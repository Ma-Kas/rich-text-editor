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
  $isCarouselContainerNode,
  CarouselContainerNode,
  CarouselImage,
  CarouselType,
} from './CarouselContainerNode';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { z } from 'zod';
import { RIGHT_CLICK_IMAGE_COMMAND } from '../utils/exportedCommands';
import TextInput from '../ui/TextInput';
import Select from '../ui/Select';
import { DialogActions } from '../ui/Dialog';
import Button from '../ui/Button';
import { Alignment, CarouselBlockNode } from './CarouselBlockNode';
import CarouselResizer from '../ui/CarouselResizer';
import useModal from '../hooks/useModal';

import { CarouselImageObjectPosition } from './CarouselContainerNode';
import EmblaCarousel from '../../../components/Carousel/EmblaCarousel';
import '../../../components/Carousel/styles.css';
import { EmblaOptionsType } from 'embla-carousel';

type ImageStyleType = {
  objectPosition?: CarouselImageObjectPosition;
  width?: string;
  aspectRatio?: string;
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

export function LazyImage({
  altText,
  className,
  src,
  objectPosition,
  aspectRatio,
}: {
  altText: string;
  className: string | null;
  src: string;
  objectPosition: CarouselImageObjectPosition | null | undefined;
  aspectRatio: string | null | undefined;
  imagesInView: number | null | undefined;
  imageGap: string | null | undefined;
}): JSX.Element {
  useSuspenseImage(src);
  const style: ImageStyleType = {};
  if (objectPosition) {
    style.objectPosition = objectPosition;
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

function eventTargetIsCarouselContainer(
  event: MouseEvent,
  ref: React.MutableRefObject<HTMLDivElement | null>
): boolean {
  const targetElement = event.target as HTMLElement;
  const carouselContainerElement = targetElement.closest(
    "[class^='EditorTheme__carouselContainer']"
  );

  if (
    targetElement === ref.current ||
    carouselContainerElement === ref.current
  ) {
    return true;
  }

  return false;
}

function getBlockParentNode(
  editorState: EditorState,
  node: CarouselContainerNode
): CarouselBlockNode {
  const parentNodeKey = node.__parent;
  return editorState.read(
    () => $getNodeByKey(parentNodeKey!) as CarouselBlockNode
  );
}

export function UpdateCarouselDialog({
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
    () => $getNodeByKey(nodeKey) as CarouselContainerNode
  );
  const [imageList, setImageList] = useState(node.getImageList());
  const [carouselType, setCarouselType] = useState<CarouselType>(
    node.getCarouselType()
  );
  const [imagesInView, setImagesInView] = useState(node.getImagesInView());
  const [captionText, setCaptionText] = useState(node.getCaptionText());
  const [imageGap, setImageGap] = useState(node.getImageGap());

  // Get the carouselBlock node to set alignment there
  const parentBlockNode = getBlockParentNode(editorState, node);
  const [blockAlignment, setBlockAlignment] = useState<Alignment>(
    parentBlockNode.getAlignment()
  );

  // Edits of whole carousel
  const handleCarouselTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCarouselType(e.target.value as CarouselType);
  };
  const handleImagesInViewChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setImagesInView(Number(e.target.value));
  };
  const handleImageGapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setImageGap(e.target.value as string);
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
    image: CarouselImage,
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
      imagesInView,
      carouselType,
      imageGap,
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
      {/* Whole Carousel Edit */}
      <div className='Input__carouselInputGroup'>
        <div className='Input__carouselInputGroupTitle'>
          Edit Whole Carousel:
        </div>
        <Select
          value={carouselType ? carouselType : 'slideshow'}
          label='Carousel Type'
          name='carousel-type-all'
          id='carousel-type-all-select'
          onChange={handleCarouselTypeChange}
        >
          <option value='slideshow'>Slideshow</option>
          <option value='slider'>Slider</option>
        </Select>
        {carouselType !== 'slideshow' && (
          <Select
            value={imagesInView ? imagesInView : '1'}
            label='Max Images in View'
            name='images-in-view-all'
            id='images-in-view-all-select'
            onChange={handleImagesInViewChange}
          >
            <option value='1'>1</option>
            <option value='2'>2</option>
            <option value='3'>3</option>
            <option value='4'>4</option>
          </Select>
        )}
        <TextInput
          label='Caption'
          placeholder='Add a caption here'
          onChange={setCaptionText}
          value={captionText}
          data-test-id='carousel-modal-caption-text-input'
        />
        {carouselType !== 'slideshow' && (
          <Select
            value={imageGap ? imageGap : '0.25rem'}
            label='Image Gap'
            name='image-gap-all'
            id='image-gap-all-select'
            onChange={handleImageGapChange}
          >
            <option value='0'>0</option>
            <option value='0.25rem'>0.25</option>
            <option value='0.5rem'>0.5</option>
            <option value='0.75rem'>0.75</option>
            <option value='1rem'>1</option>
            <option value='1.25rem'>1.25</option>
            <option value='1.5rem'>1.5</option>
            <option value='2rem'>2</option>
          </Select>
        )}
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
          value={imageList[0].aspectRatio ? imageList[0].aspectRatio : '4 / 3'}
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
      </div>

      {/* Individual Image Edit */}
      <div className='Input__carouselInputGroup'>
        {imageList.map((image, index) => {
          return (
            <div key={image.id}>
              <div className='Input__carouselInputGroupTitle'>{`Edit Image ${index + 1}:`}</div>
              <TextInput
                label='Alt Text'
                placeholder='Descriptive alternative text'
                onChange={(value) => handleImageChange(image, 'altText', value)}
                value={image.altText}
                data-test-id='carousel-image-modal-alt-text-input'
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
              {carouselType !== 'slideshow' && (
                <Select
                  value={image.aspectRatio ? image.aspectRatio : '4 / 3'}
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
              )}
            </div>
          );
        })}
      </div>

      <DialogActions>
        <Button
          data-test-id='carousel-modal-file-upload-btn'
          onClick={() => handleOnConfirm()}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export default function CarouselComponent({
  imageList,
  carouselType,
  imagesInView,
  nodeKey,
  captionText,
  resizable,
  imageGap,
}: {
  imageList: CarouselImage[];
  carouselType: CarouselType;
  imagesInView?: number | null | undefined;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  imageGap?: string | null | undefined;
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
        if ($isCarouselContainerNode(node)) {
          // Access the parent/grandparent imageBlockNode that contains this image
          const domElement = editor.getElementByKey(nodeKey);
          if (!domElement) {
            return false;
          }
          const parentBlock = domElement.closest(
            "[class^='EditorTheme__carouselBlock']"
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

      if (eventTargetIsCarouselContainer(event, containerRef)) {
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
          if (eventTargetIsCarouselContainer(event, containerRef)) {
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
      if ($isCarouselContainerNode(node)) {
        node.setWidth(width);
        node.setMaxWidth(maxWidth);
      }
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const CAROUSEL_OPTIONS: EmblaOptionsType = {};

  const isFocused = isSelected || isResizing;
  return (
    <Suspense fallback={null}>
      <div
        className={
          isFocused
            ? `carousel-container ${carouselType} focused`
            : `carousel-container ${carouselType}`
        }
        draggable='false'
      >
        <EmblaCarousel
          carouselType={carouselType}
          imagesInView={imagesInView}
          imageGap={imageGap}
          slides={imageList}
          options={CAROUSEL_OPTIONS}
        />
      </div>
      {resizable && $isNodeSelection(selection) && isFocused && (
        <CarouselResizer
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
        <div className='carousel-caption-container'>{captionText}</div>
      )}
      {modal}
    </Suspense>
  );
}
