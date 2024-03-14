import type { LexicalEditor, NodeKey } from 'lexical';

import * as React from 'react';
import { useRef } from 'react';
import { UpdateImageDialog } from '../nodes/ImageComponent';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const Directions = {
  east: 1 << 0,
  north: 1 << 3,
  south: 1 << 1,
  west: 1 << 2,
};

export default function ImageResizer({
  onResizeStart,
  onResizeEnd,
  buttonRef,
  imageRef,
  editor,
  nodeKey,
  showModal,
}: {
  editor: LexicalEditor;
  buttonRef: { current: null | HTMLButtonElement };
  imageRef: { current: null | HTMLElement };
  onResizeEnd: (width: 'inherit' | number) => void;
  onResizeStart: () => void;
  nodeKey: NodeKey;
  showModal: (
    title: string,
    showModal: (onClose: () => void) => JSX.Element
  ) => void;
}): JSX.Element {
  const controlWrapperRef = useRef<HTMLDivElement>(null);
  const userSelect = useRef({
    priority: '',
    value: 'default',
  });
  const positioningRef = useRef<{
    currentHeight: 'inherit' | number;
    currentWidth: 'inherit' | number;
    isResizing: boolean;
    ratio: number;
    startHeight: number;
    startWidth: number;
    startX: number;
    startY: number;
    direction: number;
  }>({
    currentHeight: 0,
    currentWidth: 0,
    isResizing: false,
    ratio: 0,
    startHeight: 0,
    startWidth: 0,
    startX: 0,
    startY: 0,
    direction: 0,
  });

  const editorRootElement = editor.getRootElement();
  // Find max allowable image width (=container full width)
  let maxWidthContainer: number;
  const image = imageRef.current;
  if (image) {
    const blockContainer = image.closest("[class^='EditorTheme__']");
    maxWidthContainer = blockContainer
      ? blockContainer.getBoundingClientRect().width
      : 100;
  } else {
    maxWidthContainer = editorRootElement
      ? editorRootElement.getBoundingClientRect().width
      : 100;
  }

  const minWidth = 100;

  const setStartCursor = () => {
    if (editorRootElement !== null) {
      editorRootElement.style.setProperty('cursor', `ew-resize`, 'important');
    }
    if (document.body !== null) {
      document.body.style.setProperty('cursor', `ew-resize`, 'important');
      userSelect.current.value = document.body.style.getPropertyValue(
        '-webkit-user-select'
      );
      userSelect.current.priority = document.body.style.getPropertyPriority(
        '-webkit-user-select'
      );
      document.body.style.setProperty(
        '-webkit-user-select',
        `none`,
        'important'
      );
    }
  };

  const setEndCursor = () => {
    if (editorRootElement !== null) {
      editorRootElement.style.setProperty('cursor', 'text');
    }
    if (document.body !== null) {
      document.body.style.setProperty('cursor', 'default');
      document.body.style.setProperty(
        '-webkit-user-select',
        userSelect.current.value,
        userSelect.current.priority
      );
    }
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    direction: number
  ) => {
    if (!editor.isEditable()) {
      return;
    }

    const image = imageRef.current;
    const controlWrapper = controlWrapperRef.current;
    const figureContainer = image?.parentElement?.parentElement;

    if (image && controlWrapper && figureContainer) {
      event.preventDefault();

      const { width, height } = figureContainer.getBoundingClientRect();
      const positioning = positioningRef.current;
      positioning.startWidth = width;
      positioning.startHeight = height;
      positioning.ratio = width / height;
      positioning.currentWidth = width;
      positioning.currentHeight = height;
      positioning.startX = event.clientX;
      positioning.startY = event.clientY;
      positioning.isResizing = true;
      positioning.direction = direction;

      setStartCursor();
      onResizeStart();

      controlWrapper.classList.add('image-control-wrapper--resizing');
      // CSS Trickery 101:
      // Image is responsive when added, but for user resizing to work, pixel
      // values are used. Instead of applying this style to image, apply to parent
      // in maxWidth, and at the same time set width to 100%. This way, image is
      // as big as user chooses AS A MAX, but can shrink down on smaller screens
      figureContainer.style.maxWidth = `${width}px`;
      figureContainer.style.width = `100%`;

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
  };
  const handlePointerMove = (event: PointerEvent) => {
    const image = imageRef.current;
    const figureContainer = image?.parentElement?.parentElement;
    const positioning = positioningRef.current;

    if (image && figureContainer && positioning.isResizing) {
      let diff = Math.floor(positioning.startX - event.clientX);
      // Is scaling through west or east handle?
      diff = positioning.direction & Directions.east ? -diff : diff;

      const width = clamp(
        positioning.startWidth + diff,
        minWidth,
        maxWidthContainer
      );

      const height = width / positioning.ratio;
      figureContainer.style.maxWidth = `${width}px`;
      figureContainer.style.width = `100%`;
      positioning.currentHeight = height;
      positioning.currentWidth = width;
    }
  };
  const handlePointerUp = () => {
    const image = imageRef.current;
    const figureContainer = image?.parentElement?.parentElement;
    const positioning = positioningRef.current;
    const controlWrapper = controlWrapperRef.current;
    if (image && controlWrapper && figureContainer && positioning.isResizing) {
      const width = positioning.currentWidth;
      positioning.startWidth = 0;
      positioning.startHeight = 0;
      positioning.ratio = 0;
      positioning.startX = 0;
      positioning.startY = 0;
      positioning.currentWidth = 0;
      positioning.currentHeight = 0;
      positioning.isResizing = false;

      controlWrapper.classList.remove('image-control-wrapper--resizing');
      // CSS Trickery 101:
      // If image is full width, set it to percentage based instead pixel value
      if (width === maxWidthContainer) {
        figureContainer.style.maxWidth = '100%';
      }

      setEndCursor();

      onResizeEnd(width);

      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    }
  };
  return (
    <div ref={controlWrapperRef}>
      <button
        className='image-edit-button'
        ref={buttonRef}
        onClick={() => {
          showModal('Update Image', (onClose) => (
            <UpdateImageDialog
              activeEditor={editor}
              nodeKey={nodeKey}
              onClose={onClose}
            />
          ));
        }}
      >
        Edit
      </button>

      <div
        className='image-resizer image-resizer-e'
        onPointerDown={(event) => {
          handlePointerDown(event, Directions.north | Directions.east);
        }}
      />
      <div
        className='image-resizer image-resizer-w'
        onPointerDown={(event) => {
          handlePointerDown(event, Directions.north | Directions.west);
        }}
      />
    </div>
  );
}
