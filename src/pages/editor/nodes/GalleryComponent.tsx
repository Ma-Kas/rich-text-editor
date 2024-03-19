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
  GridType,
} from './GalleryContainerNode';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { z } from 'zod';
import { RIGHT_CLICK_IMAGE_COMMAND } from '../utils/exportedCommands';
import GalleryResizer from '../ui/GalleryResizer';
import TextInput from '../ui/TextInput';
import Select from '../ui/Select';
import { DialogActions } from '../ui/Dialog';
import Button from '../ui/Button';
import { Alignment, GalleryBlockNode } from './GalleryBlockNode';
import useModal from '../hooks/useModal';

import { GalleryImageObjectPosition } from './GalleryContainerNode';

type ImageStyleType = {
  objectPosition?: GalleryImageObjectPosition;
  width?: string;
  aspectRatio?: string;
};

type GalleryInlineStyleType = {
  gap?: string | undefined;
  gridTemplateColumns?: string | undefined;
};

const stringSchema = z.string();
const imagePositionSchema = z.union([
  z.literal('center'),
  z.literal('left'),
  z.literal('right'),
  z.literal('top'),
  z.literal('bottom'),
]);

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
  src,
  objectPosition,
  imageWidth,
  aspectRatio,
}: {
  altText: string;
  className: string | null;
  src: string;
  objectPosition: GalleryImageObjectPosition | null | undefined;
  imageWidth: string | null | undefined;
  aspectRatio: string | null | undefined;
}): JSX.Element {
  useSuspenseImage(src);
  const style: ImageStyleType = {};
  if (objectPosition) {
    style.objectPosition = objectPosition;
  }
  if (imageWidth) {
    style.width = imageWidth;
  }
  if (aspectRatio) {
    style.aspectRatio = aspectRatio;
  }

  if (style) {
    return (
      <img
        className={className || undefined}
        src={src}
        alt={altText}
        style={style}
        draggable='false'
      />
    );
  } else {
    return (
      <img
        className={className || undefined}
        src={src}
        alt={altText}
        draggable='false'
      />
    );
  }
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
  const [imageList, setImageList] = useState(node.getImageList());
  const [gridType, setGridType] = useState<GridType>(node.getGridType());
  const [columns, setColumns] = useState(node.getColumns());
  const [captionText, setCaptionText] = useState(node.getCaptionText());
  const [gridGap, setGridGap] = useState(node.getGridGap());
  const [columnMinWidth, setColumnMinWidth] = useState(
    node.getColumnMinWidth()
  );

  // Get the galleryBlock node to set alignment there
  const parentBlockNode = getBlockParentNode(editorState, node);
  const [blockAlignment, setBlockAlignment] = useState<Alignment>(
    parentBlockNode.getAlignment()
  );

  // Edits of whole gallery
  const handleGridTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGridType(e.target.value as GridType);
  };
  const handleColumnsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setColumns(Number(e.target.value));
  };
  const handleGridGapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGridGap(e.target.value as string);
  };
  const handleColumnMinWidthChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setColumnMinWidth(Number(e.target.value));
  };
  const handleAlignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBlockAlignment(e.target.value as Alignment);
  };
  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const changedImageList = imageList.map((image) => {
      return { ...image, aspectRatio: e.target.value };
    });
    setImageList(changedImageList);
  };

  const handleImageChange = (
    image: GalleryImage,
    type: string,
    input: unknown
  ): void => {
    switch (type) {
      case 'altText': {
        const parseResult = stringSchema.safeParse(input);
        if (parseResult.success) {
          const newAltText = parseResult.data;
          image.altText = newAltText;
          const changedImageList = imageList.map((img) =>
            img.id !== image.id ? img : image
          );
          setImageList(changedImageList);
        }
        break;
      }
      case 'position': {
        const event = input as React.ChangeEvent<HTMLSelectElement>;
        const value = event.target.value;
        const parseResult = imagePositionSchema.safeParse(value);
        if (parseResult.success) {
          const newPosition = parseResult.data;
          image.objectPosition = newPosition;
          const changedImageList = imageList.map((img) =>
            img.id !== image.id ? img : image
          );
          setImageList(changedImageList);
        }
        break;
      }
      case 'width': {
        const event = input as React.ChangeEvent<HTMLSelectElement>;
        const value = event.target.value;
        const parseResult = stringSchema.safeParse(value);
        if (parseResult.success) {
          const newWidth = parseResult.data;
          image.imageWidth = newWidth;
          const changedImageList = imageList.map((img) =>
            img.id !== image.id ? img : image
          );
          setImageList(changedImageList);
        }
        break;
      }
      case 'aspect-ratio': {
        const event = input as React.ChangeEvent<HTMLSelectElement>;
        const value = event.target.value;
        const parseResult = stringSchema.safeParse(value);
        if (parseResult.success) {
          const newAspectRatio = parseResult.data;
          image.aspectRatio = newAspectRatio;
          const changedImageList = imageList.map((img) =>
            img.id !== image.id ? img : image
          );
          setImageList(changedImageList);
        }
        break;
      }
    }
  };

  const handleOnConfirm = () => {
    const payload = {
      captionText,
      imageList,
      columns,
      gridType,
      gridGap,
      columnMinWidth,
    };
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
      {/* Whole Gallery Edit */}
      <div className='Input__galleryInputGroup'>
        <div className='Input__galleryInputGroupTitle'>Edit Whole Gallery:</div>
        <Select
          value={gridType}
          label='Gallery Type'
          name='gallery-type'
          id='gallery-type-select'
          onChange={handleGridTypeChange}
        >
          <option value='dynamic-type'>Dynamic</option>
          <option value='static-type'>Fixed Column Number</option>
          <option value='flex-type'>Last Row Stretch</option>
        </Select>
        <Select
          disabled={gridType !== 'static-type' ? true : false}
          value={columns ? columns : '3'}
          label='Columns'
          name='columns-all'
          id='columns-select'
          onChange={handleColumnsChange}
        >
          <option value='2'>2</option>
          <option value='3'>3</option>
          <option value='4'>4</option>
          <option value='5'>5</option>
          <option value='6'>6</option>
        </Select>
        <TextInput
          label='Caption'
          placeholder='Add a caption here'
          onChange={setCaptionText}
          value={captionText}
          data-test-id='gallery-modal-caption-text-input'
        />
        <Select
          value={gridGap ? gridGap : '0.5rem'}
          label='Grid Gap'
          name='grid-gap-all'
          id='grid-gap-all-select'
          onChange={handleGridGapChange}
        >
          <option value='0.25rem'>0.25</option>
          <option value='0.5rem'>0.5</option>
          <option value='0.75rem'>0.75</option>
          <option value='1rem'>1</option>
          <option value='1.25rem'>1.25</option>
          <option value='1.5rem'>1.5</option>
          <option value='2rem'>2</option>
        </Select>
        <Select
          style={{ marginBottom: '1em', width: '208px' }}
          value={blockAlignment}
          label='Alignment'
          name='alignment'
          id='alignment-select'
          onChange={handleAlignmentChange}
        >
          <option value='left'>Left</option>
          <option value='center'>Center</option>
          <option value='right'>Right</option>
        </Select>
        <Select
          value={imageList[0].aspectRatio ? imageList[0].aspectRatio : '1 / 1'}
          label='Aspect Ratio'
          name='aspect-ratio-all'
          id='aspect-ratio-all-select'
          onChange={handleAspectRatioChange}
        >
          <option value='1 / 1'>1:1</option>
          <option value='3 / 4'>3:4</option>
          <option value='4 / 5'>4:5</option>
          <option value='4 / 3'>4:3</option>
          <option value='1.91 / 1'>1.91:1</option>
          <option value='16 / 9'>16:9</option>
        </Select>
        <Select
          style={{ marginBottom: '1em', width: '208px' }}
          value={columnMinWidth ? `${columnMinWidth}` : '150'}
          label='Minimum Column Size'
          name='min-column-size'
          id='min-column-size-select'
          onChange={handleColumnMinWidthChange}
        >
          <option value='100'>100px</option>
          <option value='150'>150px</option>
          <option value='200'>200px</option>
          <option value='250'>250px</option>
          <option value='300'>300px</option>
        </Select>
      </div>

      {/* Individual Image Edit */}
      <div className='Input__galleryInputGroup'>
        {imageList.map((image, index) => {
          return (
            <div key={image.id}>
              <div className='Input__galleryInputGroupTitle'>{`Edit Image ${index + 1}:`}</div>
              <TextInput
                label='Alt Text'
                placeholder='Descriptive alternative text'
                onChange={(value) => handleImageChange(image, 'altText', value)}
                value={image.altText}
                data-test-id='gallery-image-modal-alt-text-input'
              />
              <Select
                value={image.objectPosition ? image.objectPosition : 'center'}
                label='Position'
                name='position'
                id='position-select'
                onChange={(e) => handleImageChange(image, 'position', e)}
              >
                <option value='center'>Center</option>
                <option value='left'>Left</option>
                <option value='right'>Right</option>
                <option value='top'>Top</option>
                <option value='bottom'>Bottom</option>
              </Select>
              <Select
                value={image.aspectRatio ? image.aspectRatio : '1 / 1'}
                label='Aspect Ratio'
                name='aspect-ratio'
                id='aspect-ratio-select'
                onChange={(e) => handleImageChange(image, 'aspect-ratio', e)}
              >
                <option value='1 / 1'>1:1</option>
                <option value=' 3 / 4'>3:4</option>
                <option value='4 / 5'>4:5</option>
                <option value=' 4 / 3'>4:3</option>
                <option value=' 1.91 / 1'>1.91:1</option>
                <option value=' 16 / 9'>16:9</option>
              </Select>
              <Select
                style={{ marginBottom: '1em', width: '208px' }}
                value={image.imageWidth ? image.imageWidth : '100%'}
                label='Width'
                name='width'
                id='width-select'
                onChange={(e) => handleImageChange(image, 'width', e)}
              >
                <option value='100%'>100%</option>
                <option value='75%'>75%</option>
                <option value='50%'>50%</option>
                <option value='25%'>25%</option>
              </Select>
            </div>
          );
        })}
      </div>

      <DialogActions>
        <Button
          data-test-id='gallery-modal-file-upload-btn'
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
  gridType,
  columns,
  nodeKey,
  captionText,
  resizable,
  gridGap,
  columnMinWidth,
}: {
  imageList: GalleryImage[];
  gridType: GridType;
  columns?: number | null | undefined;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  gridGap?: string | null | undefined;
  columnMinWidth?: number | null | undefined;
  nodeKey: NodeKey;
  captionText?: string;
  resizable: boolean;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
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

  // If user has overriden stylesheet with inline properties, set them here
  // to apply to component
  const setInlineStyleOverride = (): GalleryInlineStyleType => {
    const style: GalleryInlineStyleType = {};
    if (gridGap) {
      style.gap = gridGap;
    }
    if (gridType && (columnMinWidth || columns)) {
      switch (gridType) {
        case 'dynamic-type': {
          style.gridTemplateColumns = `repeat(auto-fit, minmax(${columnMinWidth}px, 1fr))`;
          break;
        }
        case 'static-type': {
          style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
          break;
        }
        case 'flex-type': {
          break;
        }
      }
    }

    return style;
  };

  const containerInlineStyle = setInlineStyleOverride();

  const isFocused = isSelected || isResizing;
  return (
    <Suspense fallback={null}>
      <div
        style={containerInlineStyle}
        className={
          isFocused
            ? `grid-container ${gridType} focused`
            : `grid-container ${gridType}`
        }
        draggable='false'
      >
        {imageList.map((image) => {
          return (
            <LazyImage
              key={image.id}
              className='gallery-image'
              src={image.src}
              altText={image.altText}
              objectPosition={image.objectPosition}
              imageWidth={image.imageWidth}
              aspectRatio={image.aspectRatio}
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
