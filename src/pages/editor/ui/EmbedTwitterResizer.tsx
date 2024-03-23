import type { LexicalEditor, NodeKey } from 'lexical';

import * as React from 'react';
import { useRef } from 'react';
import { UpdateEmbedDialog } from '../nodes/EmbedComponent';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const Directions = {
  east: 1 << 0,
  north: 1 << 3,
  south: 1 << 1,
  west: 1 << 2,
};

export default function EmbedTwitterResizer({
  onResizeStart,
  onResizeEnd,
  buttonRef,
  embedRef,
  editor,
  nodeKey,
  showModal,
}: {
  editor: LexicalEditor;
  buttonRef: { current: null | HTMLButtonElement };
  embedRef: { current: null | HTMLElement };
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
  // Find max allowable embed width (=container full width)
  let maxWidthContainer: number;
  const embed = embedRef.current;
  if (embed) {
    const blockContainer = embed.closest("[class^='EditorTheme__embedBlock']");
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

    const embed = embedRef.current;
    const controlWrapper = controlWrapperRef.current;
    const editorEmbedDiv = embed?.parentElement;
    const tweet = embed?.querySelector('.react-tweet-theme') as HTMLElement;

    if (embed && tweet && controlWrapper && editorEmbedDiv) {
      event.preventDefault();

      const { width, height } = editorEmbedDiv.getBoundingClientRect();
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

      controlWrapper.classList.add('embed-control-wrapper--resizing');
      // CSS Trickery 101:
      // Embed is responsive when added, but for user resizing to work, pixel
      // values are used. Instead of applying this style to embed, apply to parent
      // in maxWidth, and at the same time set width to 100%. This way, embed is
      // as big as user chooses AS A MAX, but can shrink down on smaller screens
      editorEmbedDiv.style.maxWidth = `${width}px`;
      editorEmbedDiv.style.width = `100%`;
      tweet.style.maxWidth = '100%';

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    const embed = embedRef.current;
    const editorEmbedDiv = embed?.parentElement;
    const positioning = positioningRef.current;

    if (embed && editorEmbedDiv && positioning.isResizing) {
      let diff = Math.floor(positioning.startX - event.clientX);
      // Is scaling through west or east handle?
      diff = positioning.direction & Directions.east ? -diff : diff;

      const width = clamp(
        positioning.startWidth + diff,
        minWidth,
        maxWidthContainer
      );

      const height = width / positioning.ratio;
      editorEmbedDiv.style.maxWidth = `${width}px`;
      editorEmbedDiv.style.width = `100%`;
      positioning.currentHeight = height;
      positioning.currentWidth = width;
    }
  };

  const handlePointerUp = () => {
    const embed = embedRef.current;
    const editorEmbedDiv = embed?.parentElement;
    const positioning = positioningRef.current;
    const controlWrapper = controlWrapperRef.current;
    if (embed && controlWrapper && editorEmbedDiv && positioning.isResizing) {
      const width = positioning.currentWidth;
      positioning.startWidth = 0;
      positioning.startHeight = 0;
      positioning.ratio = 0;
      positioning.startX = 0;
      positioning.startY = 0;
      positioning.currentWidth = 0;
      positioning.currentHeight = 0;
      positioning.isResizing = false;

      controlWrapper.classList.remove('embed-control-wrapper--resizing');
      // CSS Trickery 101:
      // If embed is full width, set it to percentage based instead pixel value
      if (width === maxWidthContainer) {
        editorEmbedDiv.style.maxWidth = '100%';
        // set values in EmbedNode here (will only be used when serializing)
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
        className='embed-edit-button'
        ref={buttonRef}
        onClick={() => {
          showModal('Update Embed', (onClose) => (
            <UpdateEmbedDialog
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
        className='embed-resizer embed-resizer-e'
        onPointerDown={(event) => {
          handlePointerDown(event, Directions.north | Directions.east);
        }}
      />

      <div
        className='embed-resizer embed-resizer-w'
        onPointerDown={(event) => {
          handlePointerDown(event, Directions.north | Directions.west);
        }}
      />
    </div>
  );
}
