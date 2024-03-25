import type { LexicalEditor, NodeKey } from 'lexical';

import * as React from 'react';
import { useRef } from 'react';
import { UpdateCarouselDialog } from '../nodes/CarouselComponent';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const Directions = {
  east: 1 << 0,
  north: 1 << 3,
  south: 1 << 1,
  west: 1 << 2,
};

export default function CarouselResizer({
  onResizeStart,
  onResizeEnd,
  buttonRef,
  containerRef,
  editor,
  nodeKey,
  showModal,
}: {
  editor: LexicalEditor;
  buttonRef: { current: null | HTMLButtonElement };
  containerRef: { current: null | HTMLElement };
  onResizeEnd: (width: string, maxWidth: string) => void;
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
  // Find max allowable carousel width (=block full width)
  let maxWidthContainer: number;
  const carouselContainer = containerRef.current;
  if (carouselContainer) {
    const blockContainer = carouselContainer.closest(
      "[class^='EditorTheme__carouselBlock']"
    );
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

    const carouselContainer = containerRef.current;
    const controlWrapper = controlWrapperRef.current;

    if (carouselContainer && controlWrapper) {
      event.preventDefault();

      const { width, height } = carouselContainer.getBoundingClientRect();
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

      carouselContainer.style.maxWidth = `${width}px`;
      carouselContainer.style.width = `100%`;

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
  };
  const handlePointerMove = (event: PointerEvent) => {
    const carouselContainer = containerRef.current;
    const positioning = positioningRef.current;

    if (carouselContainer && positioning.isResizing) {
      let diff = Math.floor(positioning.startX - event.clientX);
      // Is scaling through west or east handle?
      diff = positioning.direction & Directions.east ? -diff : diff;

      const width = clamp(
        positioning.startWidth + diff,
        minWidth,
        maxWidthContainer
      );

      const height = width / positioning.ratio;
      carouselContainer.style.maxWidth = `${width}px`;
      carouselContainer.style.width = `100%`;
      positioning.currentHeight = height;
      positioning.currentWidth = width;
    }
  };
  const handlePointerUp = () => {
    const carouselContainer = containerRef.current;
    const positioning = positioningRef.current;
    const controlWrapper = controlWrapperRef.current;
    if (carouselContainer && controlWrapper && positioning.isResizing) {
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
      // If carousel is full width, set it to percentage based instead pixel value
      if (width === maxWidthContainer) {
        carouselContainer.style.maxWidth = '100%';
        // set values in CarouselContainerNode here (will only be used when serializing)
        onResizeEnd('100%', '100%');
      } else {
        onResizeEnd('100%', `${width}px`);
      }

      setEndCursor();

      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    }
  };
  return (
    <div ref={controlWrapperRef}>
      <button
        className='carousel-edit-button'
        ref={buttonRef}
        onClick={() => {
          showModal('Update Carousel', (onClose) => (
            <UpdateCarouselDialog
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
        className='carousel-resizer carousel-resizer-e'
        onPointerDown={(event) => {
          handlePointerDown(event, Directions.north | Directions.east);
        }}
      />
      <div
        className='carousel-resizer carousel-resizer-w'
        onPointerDown={(event) => {
          handlePointerDown(event, Directions.north | Directions.west);
        }}
      />
    </div>
  );
}
