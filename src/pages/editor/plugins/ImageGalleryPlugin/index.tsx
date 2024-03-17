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
import { useEffect, useRef, useState } from 'react';
import { INSERT_GALLERY_COMMAND } from '../../utils/exportedCommands';
import { CAN_USE_DOM } from '../../../shared/src/canUseDOM';

import landscapeImage from '../../images/landscape.jpg';
import yellowFlowerImage from '../../images/yellow-flower.jpg';
import Button from '../../ui/Button';
import { DialogActions, DialogButtonsList } from '../../ui/Dialog';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import { $createGalleryBlockNode } from '../../nodes/GalleryBlockNode';
import {
  $createGalleryContainerNode,
  $isGalleryContainerNode,
  GalleryContainerNode,
  GalleryImage,
} from '../../nodes/GalleryContainerNode';

export type InsertGalleryImagePayload = GalleryImage[];

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null;

export function InsertGalleryImagesUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertGalleryImagePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  return (
    <>
      <TextInput
        label='Image URL'
        placeholder='i.e. https://source.unsplash.com/random'
        onChange={setSrc}
        value={src}
        data-test-id='image-modal-url-input'
      />
      <TextInput
        label='Alt Text'
        placeholder='Random unsplash image'
        onChange={setAltText}
        value={altText}
        data-test-id='image-modal-alt-text-input'
      />
      <DialogActions>
        <Button
          data-test-id='image-modal-confirm-btn'
          disabled={isDisabled}
          onClick={() => onClick([{ id: 1, altText, src }])}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertGalleryImagesUploadedDialogBody({
  onClick,
}: {
  onClick: (payload: InsertGalleryImagePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  const loadImage = (files: FileList | null) => {
    const reader = new FileReader();
    reader.onload = function () {
      if (typeof reader.result === 'string') {
        setSrc(reader.result);
      }
      return '';
    };
    if (files !== null) {
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <>
      <FileInput
        label='Image Upload'
        onChange={loadImage}
        accept='image/*'
        data-test-id='image-modal-file-upload'
      />
      <TextInput
        label='Alt Text'
        placeholder='Descriptive alternative text'
        onChange={setAltText}
        value={altText}
        data-test-id='image-modal-alt-text-input'
      />
      <DialogActions>
        <Button
          data-test-id='image-modal-file-upload-btn'
          disabled={isDisabled}
          onClick={() => onClick([{ id: 1, altText, src }])}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertGalleryContainerDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [mode, setMode] = useState<null | 'url' | 'file'>(null);
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [activeEditor]);

  const onClick = (payload: InsertGalleryImagePayload) => {
    activeEditor.dispatchCommand(INSERT_GALLERY_COMMAND, payload);
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button
            data-test-id='image-modal-option-sample'
            onClick={() =>
              onClick([
                {
                  id: 1,
                  altText: 'Yellow flower in tilt shift lens',
                  src: yellowFlowerImage,
                },
                {
                  id: 2,
                  altText:
                    'Daylight fir trees forest glacier green high ice landscape',
                  src: landscapeImage,
                },
                {
                  id: 3,
                  altText: 'Yellow flower in tilt shift lens',
                  src: yellowFlowerImage,
                },
                {
                  id: 4,
                  altText:
                    'Daylight fir trees forest glacier green high ice landscape',
                  src: landscapeImage,
                },
              ])
            }
          >
            Sample
          </Button>
          <Button
            data-test-id='image-modal-option-url'
            onClick={() => setMode('url')}
          >
            URL
          </Button>
          <Button
            data-test-id='image-modal-option-file'
            onClick={() => setMode('file')}
          >
            File
          </Button>
        </DialogButtonsList>
      )}
      {mode === 'url' && <InsertGalleryImagesUriDialogBody onClick={onClick} />}
      {mode === 'file' && (
        <InsertGalleryImagesUploadedDialogBody onClick={onClick} />
      )}
    </>
  );
}

const TRANSPARENT_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const img = document.createElement('img');
img.src = TRANSPARENT_IMAGE;

function onDragStart(event: DragEvent): boolean {
  const node = getGalleryContainerNodeInSelection();
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
        imageList: node.__imageList,
        key: node.getKey(),
        captionText: node.__captionText,
        width: node.__width,
        maxWidth: node.__maxWidth,
      },
      type: 'gallery-container',
    })
  );

  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getGalleryContainerNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropGalleryContainer(event)) {
    event.preventDefault();
  }
  return true;
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getGalleryContainerNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragImageData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropGalleryContainer(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_GALLERY_COMMAND, data);
  }
  return true;
}

function getGalleryContainerNodeInSelection(): GalleryContainerNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isGalleryContainerNode(node) ? node : null;
}

function getDragImageData(event: DragEvent): null | InsertGalleryImagePayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== 'gallery-container') {
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

function canDropGalleryContainer(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, div.EditorTheme__galleryContainer') &&
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

export default function ImageGalleryPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([GalleryContainerNode])) {
      throw new Error(
        'ImageGalleryPlugin: GalleryContainerNode not registered on editor'
      );
    }

    return mergeRegister(
      editor.registerCommand<InsertGalleryImagePayload>(
        INSERT_GALLERY_COMMAND,
        (payload) => {
          const newGalleryBlock = $createGalleryBlockNode();
          const newGalleryContainer = $createGalleryContainerNode({
            imageList: payload,
          });
          $insertNodes([newGalleryBlock]);

          $insertNodes([newGalleryContainer]);

          // Add new paragraph node below created image
          const newParagraphNode = $createParagraphNode();
          newGalleryBlock.insertAfter(newParagraphNode).selectNext();

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
