import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  EditorState,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  NodeKey,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {
  $isGalleryContainerNode,
  GalleryContainerNode,
  GalleryImage,
} from './GalleryContainerNode';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { RIGHT_CLICK_IMAGE_COMMAND } from '../utils/exportedCommands';
import GalleryResizer from '../ui/GalleryResizer';
import TextInput from '../ui/TextInput';
import Select from '../ui/Select';
import { DialogActions } from '../ui/Dialog';
import Button from '../ui/Button';
import { Alignment, GalleryBlockNode } from './GalleryBlockNode';
import useModal from '../hooks/useModal';

const imageCache = new Set();

function useSuspenseImage(src: string) {
  if (!imageCache.has(src)) {
    throw new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageCache.add(src);
        resolve(null);
      };
    });
  }
}

function LazyImage({
  altText,
  className,
  imageRef,
  src,
}: {
  altText: string;
  className: string | null;
  imageRef: { current: null | HTMLImageElement };
  src: string;
}): JSX.Element {
  useSuspenseImage(src);
  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={imageRef}
      draggable='false'
    />
  );
}

function eventTargetIsGalleryContainer(
  event: MouseEvent,
  ref: React.MutableRefObject<HTMLDivElement | null>
): boolean {
  const targetElement = event.target as HTMLElement;
  const galleryContainerElement = targetElement.closest(
    "[class^='EditorTheme__galleryContainer']"
  );

  if (
    targetElement === ref.current ||
    galleryContainerElement === ref.current
  ) {
    return true;
  }

  return false;
}

function getBlockParentNode(
  editorState: EditorState,
  node: GalleryContainerNode
): GalleryBlockNode {
  const parentNodeKey = node.__parent;
  return editorState.read(
    () => $getNodeByKey(parentNodeKey!) as GalleryBlockNode
  );
}

export function UpdateGalleryDialog({
  activeEditor,
  nodeKey,
  onClose,
}: {
  activeEditor: LexicalEditor;
  nodeKey: NodeKey;
  onClose: () => void;
}): JSX.Element {
  const editorState = activeEditor.getEditorState();
  const node = editorState.read(
    () => $getNodeByKey(nodeKey) as GalleryContainerNode
  );
  // const [altText, setAltText] = useState(node.getAltText());
  const [captionText, setCaptionText] = useState(node.getCaptionText());
  const [imageList, setImageList] = useState(node.getImageList());

  // Get the galleryBlock node to set alignment there
  const parentBlockNode = getBlockParentNode(editorState, node);
  const [blockAlignment, setBlockAlignment] = useState<Alignment>(
    parentBlockNode.getAlignment()
  );

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBlockAlignment(e.target.value as Alignment);
  };

  const handleOnConfirm = () => {
    const payload = { captionText };
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
      <div style={{ marginBottom: '1em' }}>
        {imageList.map((image) => {
          return (
            <TextInput
              key={image.id}
              label='Alt Text'
              placeholder='Descriptive alternative text'
              onChange={() => console.log('need to update this specific image')}
              value={image.altText}
              data-test-id='image-modal-alt-text-input'
            />
          );
        })}
      </div>

      <div style={{ marginBottom: '1em' }}>
        <TextInput
          label='Caption'
          placeholder='Add a caption here'
          onChange={setCaptionText}
          value={captionText}
          data-test-id='image-modal-caption-text-input'
        />
      </div>

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

export default function GalleryComponent({
  imageList,
  nodeKey,
  captionText,
  resizable,
}: {
  imageList: GalleryImage[];
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  nodeKey: NodeKey;
  captionText?: string;
  resizable: boolean;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const imageRef = useRef<null | HTMLImageElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<null | HTMLDivElement>(
    editor.getElementByKey(nodeKey) as HTMLDivElement
  );
  const [modal, showModal] = useModal();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isGalleryContainerNode(node)) {
          // Access the parent/grandparent imageBlockNode that contains this image
          const domElement = editor.getElementByKey(nodeKey);
          if (!domElement) {
            return false;
          }
          const parentBlock = domElement.closest(
            "[class^='EditorTheme__galleryBlock']"
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

          // Delete parent ImageBlockNode instead of just the image, to avoid having
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

      if (eventTargetIsGalleryContainer(event, containerRef)) {
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

  const onRightClick = useCallback(
    (event: MouseEvent): void => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection();
        const domElement = event.target as HTMLElement;
        if (
          domElement.tagName === 'IMG' &&
          $isRangeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          editor.dispatchCommand(
            RIGHT_CLICK_IMAGE_COMMAND,
            event as MouseEvent
          );
        }
      });
    },
    [editor]
  );

  useEffect(() => {
    let isMounted = true;
    const rootElement = editor.getRootElement();
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
      editor.registerCommand<MouseEvent>(
        RIGHT_CLICK_IMAGE_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (eventTargetIsGalleryContainer(event, containerRef)) {
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

    rootElement?.addEventListener('contextmenu', onRightClick);

    return () => {
      isMounted = false;
      unregister();
      rootElement?.removeEventListener('contextmenu', onRightClick);
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
    onRightClick,
    setSelected,
  ]);

  const onResizeEnd = (width: string, maxWidth: string) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    // Set values in ImageNode that will be necessary for serialization and deserialization
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isGalleryContainerNode(node)) {
        node.setWidth(width);
        node.setMaxWidth(maxWidth);
      }
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const isFocused = isSelected || isResizing;
  return (
    <Suspense fallback={null}>
      <div
        className={isFocused ? `grid-container focused` : 'grid-container'}
        draggable='false'
      >
        {imageList.map((image) => {
          return (
            <LazyImage
              key={image.id}
              className='gallery-image'
              src={image.src}
              altText={image.altText}
              imageRef={imageRef}
            />
          );
        })}
      </div>
      {resizable && $isNodeSelection(selection) && isFocused && (
        <GalleryResizer
          editor={editor}
          buttonRef={buttonRef}
          containerRef={containerRef}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
          nodeKey={nodeKey}
          showModal={showModal}
        />
      )}
      {captionText && (
        <div className='gallery-caption-container'>{captionText}</div>
      )}
      {modal}
    </Suspense>
  );
}
