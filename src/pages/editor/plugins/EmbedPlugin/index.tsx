import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalEditor,
} from 'lexical';
import { useEffect, useState } from 'react';

import { INSERT_EMBED_COMMAND } from '../../utils/exportedCommands';

import { CAN_USE_DOM } from '../../../shared/src/canUseDOM';
import Button from '../../ui/Button';
import { DialogActions } from '../../ui/Dialog';
import TextInput from '../../ui/TextInput';
import {
  $createEmbedNode,
  $isEmbedNode,
  EmbedNode,
  EmbedPayload,
} from '../../nodes/EmbedNode';
import { $createEmbedBlockNode } from '../../nodes/EmbedBlockNode';

export type InsertEmbedPayload = Readonly<EmbedPayload>;

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null;

function getVideoIdFromSrc(src: string) {
  const regex = /\/embed\/(.*?)\?si=/;
  const result = src.match(regex);
  if (result && result[1]) {
    return result[1];
  }
  return '';
}

export function InsertEmbedDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [html, setHtml] = useState('');
  const [maxWidth, setMaxWidth] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string | null>(null);

  const isDisabled = html === '';

  const transformYoutube = (value: string) => {
    const div = document.createElement('div');
    div.innerHTML = value;
    const iframe = div.firstChild;
    if (!iframe || !(iframe instanceof HTMLIFrameElement)) {
      return;
    }
    const width = iframe.width;
    const height = iframe.height;
    const src = iframe.src;
    const title = iframe.title;
    setMaxWidth(width);
    setAspectRatio(`${Number(width) / Number(height)} / 1`);
    const videoID = getVideoIdFromSrc(src);
    const newIframe = `<iframe width='100%' height='100%' src=https://www.youtube-nocookie.com/embed/${videoID} allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowFullScreen title=${title} referrerpolicy='strict-origin-when-cross-origin'/>`;

    setHtml(newIframe);
  };

  const handleSubmit = (): void => {
    const payload = {
      embedType: 'youtube',
      html: html,
      width: '100%',
      maxWidth: `${maxWidth}px`,
      aspectRatio: aspectRatio,
    };
    activeEditor.dispatchCommand(INSERT_EMBED_COMMAND, payload);
    onClose();
  };

  return (
    <>
      <TextInput
        label='HTML'
        placeholder='Your raw HTML'
        onChange={(value) => transformYoutube(value)}
        value={html}
        data-test-id='embed-modal-html-input'
      />
      <DialogActions>
        <Button
          data-test-id='embed-modal-confirm-btn'
          disabled={isDisabled}
          onClick={handleSubmit}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

const TRANSPARENT_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const img = document.createElement('img');
img.src = TRANSPARENT_IMAGE;

function onDragStart(event: DragEvent): boolean {
  const node = getEmbedNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData('text/plain', '_');
  dataTransfer.setDragImage(img, 0, 0);
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        embedType: node.__embedType,
        key: node.getKey(),
        html: node.__html,
        width: node.__width,
        maxWidth: node.__maxWidth,
        height: node.__height,
        maxHeight: node.__maxHeight,
      },
      type: 'embed',
    })
  );

  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getEmbedNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropImage(event)) {
    event.preventDefault();
  }
  return true;
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getEmbedNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragImageData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_EMBED_COMMAND, data);
  }
  return true;
}

function getEmbedNodeInSelection(): EmbedNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isEmbedNode(node) ? node : null;
}

function getDragImageData(event: DragEvent): null | InsertEmbedPayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== 'image') {
    return null;
  }

  return data;
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, span.editor-image') &&
    target.parentElement &&
    target.parentElement.closest('div.ContentEditable__root')
  );
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range;
  const target = event.target as null | Element | Document;
  const targetWindow =
    target == null
      ? null
      : target.nodeType === 9
        ? (target as Document).defaultView
        : (target as Element).ownerDocument.defaultView;
  const domSelection = getDOMSelection(targetWindow);
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }

  return range;
}

export default function EmbedPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([EmbedNode])) {
      throw new Error('EmbedPlugin: EmbedNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertEmbedPayload>(
        INSERT_EMBED_COMMAND,
        (payload) => {
          const newEmbedBlock = $createEmbedBlockNode();
          $insertNodes([newEmbedBlock]);

          const embedNode = $createEmbedNode(payload);
          $insertNodes([embedNode]);

          // Add new paragraph node below created image
          const newParagraphNode = $createParagraphNode();
          $insertNodes([newParagraphNode]);

          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event);
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor]);

  return null;
}
