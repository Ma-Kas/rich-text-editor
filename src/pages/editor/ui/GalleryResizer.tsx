import type { LexicalEditor, NodeKey } from 'lexical';

import * as React from 'react';
import { useRef } from 'react';
import { UpdateGalleryDialog } from '../nodes/GalleryComponent';
import { getMinColumnWidth } from '../utils/getMinColumnWidth';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const Directions = {
  east: 1 << 0,
  north: 1 << 3,
  south: 1 << 1,
  west: 1 << 2,
};

// Return the definition of the grid-container from parsed stylesheet
// or from inline style if it was overwritten
function getGridDefinitionRule(
  containerRef: HTMLElement | null
): string | null {
  const gridContainer = containerRef!.querySelector(
    '.grid-container'
  ) as HTMLElement;

  if (gridContainer.style && gridContainer.style.gridTemplateColumns) {
    return gridContainer.style.gridTemplateColumns;
  }

  let definition: string | undefined;

  Array.from(document.styleSheets).forEach((css) => {
    Array.from(css.rules).forEach((rule) => {
      if (
        rule instanceof CSSStyleRule &&
        rule.selectorText &&
        gridContainer.matches(rule.selectorText) &&
        rule.style.gridTemplateColumns
      ) {
        definition = rule.style.gridTemplateColumns;
      }
    });
  });
  return definition ? definition : null;
}

export default function GalleryResizer({
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
  // Find max allowable gallery width (=block full width)
  let maxWidthContainer: number;
  const galleryContainer = containerRef.current;
  if (galleryContainer) {
    const blockContainer = galleryContainer.closest(
      "[class^='EditorTheme__galleryBlock']"
    );
    maxWidthContainer = blockContainer
      ? blockContainer.getBoundingClientRect().width
      : 100;
  } else {
    maxWidthContainer = editorRootElement
      ? editorRootElement.getBoundingClientRect().width
      : 100;
  }

  // Dynamically set the minimum allowed shrink size of gallery based on the
  // grid column definition
  const minimumColumnWidth = getMinColumnWidth(
    getGridDefinitionRule(containerRef.current)
  );
  const minWidth = minimumColumnWidth ? minimumColumnWidth : 150;

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

    const galleryContainer = containerRef.current;
    const controlWrapper = controlWrapperRef.current;

    if (galleryContainer && controlWrapper) {
      event.preventDefault();

      const { width, height } = galleryContainer.getBoundingClientRect();
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

      galleryContainer.style.maxWidth = `${width}px`;
      galleryContainer.style.width = `100%`;

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
  };
  const handlePointerMove = (event: PointerEvent) => {
    const galleryContainer = containerRef.current;
    const positioning = positioningRef.current;

    if (galleryContainer && positioning.isResizing) {
      let diff = Math.floor(positioning.startX - event.clientX);
      // Is scaling through west or east handle?
      diff = positioning.direction & Directions.east ? -diff : diff;

      const width = clamp(
        positioning.startWidth + diff,
        minWidth,
        maxWidthContainer
      );

      const height = width / positioning.ratio;
      galleryContainer.style.maxWidth = `${width}px`;
      galleryContainer.style.width = `100%`;
      positioning.currentHeight = height;
      positioning.currentWidth = width;
    }
  };
  const handlePointerUp = () => {
    const galleryContainer = containerRef.current;
    const positioning = positioningRef.current;
    const controlWrapper = controlWrapperRef.current;
    if (galleryContainer && controlWrapper && positioning.isResizing) {
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
      // If gallery is full width, set it to percentage based instead pixel value
      if (width === maxWidthContainer) {
        galleryContainer.style.maxWidth = '100%';
        // set values in ImageNode here (will only be used when serializing)
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
        className='gallery-edit-button'
        ref={buttonRef}
        onClick={() => {
          showModal('Update Gallery', (onClose) => (
            <UpdateGalleryDialog
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
        className='gallery-resizer gallery-resizer-e'
        onPointerDown={(event) => {
          handlePointerDown(event, Directions.north | Directions.east);
        }}
      />
      <div
        className='gallery-resizer gallery-resizer-w'
        onPointerDown={(event) => {
          handlePointerDown(event, Directions.north | Directions.west);
        }}
      />
    </div>
  );
}
