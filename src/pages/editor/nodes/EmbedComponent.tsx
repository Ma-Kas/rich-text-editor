import type {
  BaseSelection,
  EditorState,
  LexicalEditor,
  NodeKey,
} from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Tweet } from 'react-tweet';

import { $isEmbedNode, EmbedNode } from './EmbedNode';
import TextInput from '../ui/TextInput';
import Select from '../ui/Select';
import { DialogActions } from '../ui/Dialog';
import Button from '../ui/Button';
import useModal from '../hooks/useModal';
import { Alignment, EmbedBlockNode } from './EmbedBlockNode';
import EmbedResizer from '../ui/EmbedResizer';

function getBlockParentNode(
  editorState: EditorState,
  node: EmbedNode
): EmbedBlockNode {
  const parentNodeKey = node.__parent;
  return editorState.read(
    () => $getNodeByKey(parentNodeKey!) as EmbedBlockNode
  );
}

export function UpdateEmbedDialog({
  activeEditor,
  nodeKey,
  onClose,
}: {
  activeEditor: LexicalEditor;
  nodeKey: NodeKey;
  onClose: () => void;
}): JSX.Element {
  const editorState = activeEditor.getEditorState();
  const node = editorState.read(() => $getNodeByKey(nodeKey) as EmbedNode);
  const embedType = node.getEmbedType();
  const [html, setHtml] = useState(node.getHtml());

  // Get the imageBlock node to set alignment there
  const parentBlockNode = getBlockParentNode(editorState, node);
  const [blockAlignment, setBlockAlignment] = useState<Alignment>(
    parentBlockNode.getAlignment()
  );

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBlockAlignment(e.target.value as Alignment);
  };

  const handleOnConfirm = () => {
    const payload = { html };
    if (node && parentBlockNode) {
      activeEditor.update(() => {
        node.update(payload);
        parentBlockNode.setAlignment(blockAlignment);
      });
    }
    onClose();
  };

  return (
    <>
      {embedType === 'general' && (
        <div style={{ marginBottom: '1em' }}>
          <TextInput
            label='HTML'
            placeholder='Your raw embed HTML'
            onChange={setHtml}
            value={html}
            data-test-id='embed-modal-html-input'
          />
        </div>
      )}

      <Select
        style={{ marginBottom: '1em', width: '208px' }}
        value={blockAlignment}
        label='Alignment'
        name='alignment'
        id='alignment-select'
        onChange={handlePositionChange}
      >
        <option value='left'>Left</option>
        <option value='center'>Center</option>
        <option value='right'>Right</option>
      </Select>

      <DialogActions>
        <Button
          data-test-id='image-modal-file-upload-btn'
          onClick={() => handleOnConfirm()}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export default function EmbedComponent({
  embedType,
  html,
  nodeKey,
  resizable,
}: {
  embedType: string;
  html: string;
  nodeKey: NodeKey;
  resizable: boolean;
  width: string | null | undefined;
  maxWidth: string | null | undefined;
  height: string | null | undefined;
  maxHeight: string | null | undefined;
  aspectRatio: string | null | undefined;
}): JSX.Element {
  const embedRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [modal, showModal] = useModal();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isEmbedNode(node)) {
          // Access the parent/grandparent imageBlockNode that contains this image
          const domElement = editor.getElementByKey(nodeKey);
          if (!domElement) {
            return false;
          }
          const parentBlock = domElement.closest(
            "[class^='EditorTheme__embedBlock']"
          );
          if (!parentBlock || !(parentBlock instanceof HTMLElement)) {
            return false;
          }
          const parentNode = $getNearestNodeFromDOMNode(parentBlock);
          if (!parentNode) {
            return false;
          }

          // Before deletion, select next node, so selection is not empty
          // would throw if trying to insert another node without selection
          parentNode.selectNext();

          // Delete parent EmbedBlockNode instead of just the image, to avoid having
          // empty block of wrong formatting to write into
          parentNode.remove();
          return true;
        }
      }
      return false;
    },
    [editor, isSelected, nodeKey]
  );

  const onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();
      const buttonElem = buttonRef.current;
      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        if (buttonElem !== null && buttonElem !== document.activeElement) {
          event.preventDefault();
          buttonElem.focus();
          return true;
        }
      }
      return false;
    },
    [isSelected]
  );

  const onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (buttonRef.current === event.target) {
        $setSelection(null);
        editor.update(() => {
          setSelected(true);
          const parentRootElement = editor.getRootElement();
          if (parentRootElement !== null) {
            parentRootElement.focus();
          }
        });
        return true;
      }
      return false;
    },
    [editor, setSelected]
  );

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;

      if (isResizing) {
        return true;
      }
      if (event.target === embedRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }

      return false;
    },
    [isResizing, isSelected, setSelected, clearSelection]
  );

  useEffect(() => {
    let isMounted = true;
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read(() => $getSelection()));
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === embedRef.current) {
            // TODO This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, onEscape, COMMAND_PRIORITY_LOW)
    );

    return () => {
      isMounted = false;
      unregister();
    };
  }, [
    clearSelection,
    editor,
    isResizing,
    isSelected,
    nodeKey,
    onDelete,
    onEnter,
    onEscape,
    onClick,
    setSelected,
  ]);

  const onResizeEnd = (
    width: string,
    maxWidth: string,
    height: string,
    maxHeight: string
  ) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    // Set values in EmbedNode that will be necessary for serialization and deserialization
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isEmbedNode(node)) {
        node.setWidth(width);
        node.setMaxWidth(maxWidth);
        node.setHeight(height);
        node.setMaxHeight(maxHeight);
      }
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const isFocused = isSelected || isResizing;

  return (
    <>
      {embedType !== 'twitter' && (
        <div
          className={isFocused ? 'embed focused' : 'embed'}
          ref={embedRef}
          dangerouslySetInnerHTML={{ __html: html }}
        ></div>
      )}
      {embedType == 'twitter' && (
        <div className={isFocused ? 'embed focused' : 'embed'} ref={embedRef}>
          <Tweet id={html} />
        </div>
      )}
      {resizable && $isNodeSelection(selection) && isFocused && (
        <EmbedResizer
          embedType={embedType}
          editor={editor}
          buttonRef={buttonRef}
          embedRef={embedRef}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
          nodeKey={nodeKey}
          showModal={showModal}
        />
      )}
      {modal}
    </>
  );
}
