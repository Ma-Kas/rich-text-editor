import './index.css';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { BlockTypeListMenu } from '../ToolbarPlugin';
import { setFloatingElemPositionForBlockChange } from '../../utils/setFloatingElemPositionForBlockChange';
import { BlockTypeListPopupContext } from '../../Editor';

// Prop Types
type ChangeBlockTypeFloatingToolbarProps = {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
};

const ChangeBlockTypeFloatingToolbar = (
  props: ChangeBlockTypeFloatingToolbarProps
): JSX.Element => {
  const { editor, anchorElem } = props;

  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);

  const mouseMoveListener = (e: MouseEvent) => {
    if (
      popupCharStylesEditorRef?.current &&
      (e.buttons === 1 || e.buttons === 3)
    ) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'none') {
        const x = e.clientX;
        const y = e.clientY;
        const elementUnderMouse = document.elementFromPoint(x, y);

        if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
          // Mouse is not over the target element => not a normal click, but probably a drag
          popupCharStylesEditorRef.current.style.pointerEvents = 'none';
        }
      }
    }
  };

  const mouseUpListener = () => {
    if (popupCharStylesEditorRef?.current) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'auto') {
        popupCharStylesEditorRef.current.style.pointerEvents = 'auto';
      }
    }
  };

  useEffect(() => {
    if (popupCharStylesEditorRef?.current) {
      document.addEventListener('mousemove', mouseMoveListener);
      document.addEventListener('mouseup', mouseUpListener);

      return () => {
        document.removeEventListener('mousemove', mouseMoveListener);
        document.removeEventListener('mouseup', mouseUpListener);
      };
    }
    return;
  }, [popupCharStylesEditorRef]);

  const updateChangeBlockTypeFloatingToolbar = useCallback(() => {
    const selection = $getSelection();

    const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
    const nativeSelection = window.getSelection();

    if (popupCharStylesEditorElem === null) {
      return;
    }
    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const targetElem = editor.getElementByKey(selection.getNodes()[0].__key);

      setFloatingElemPositionForBlockChange(
        targetElem,
        popupCharStylesEditorElem,
        anchorElem
      );
    }
  }, [editor, anchorElem]);

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;

    const update = () => {
      editor.getEditorState().read(() => {
        updateChangeBlockTypeFloatingToolbar();
      });
    };

    window.addEventListener('resize', update);
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update);
    }

    return () => {
      window.removeEventListener('resize', update);
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update);
      }
    };
  }, [editor, updateChangeBlockTypeFloatingToolbar, anchorElem]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateChangeBlockTypeFloatingToolbar();
    });
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateChangeBlockTypeFloatingToolbar();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateChangeBlockTypeFloatingToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updateChangeBlockTypeFloatingToolbar]);

  return (
    <div ref={popupCharStylesEditorRef} className='floating-change-block-popup'>
      {editor.isEditable() && (
        <>
          <BlockTypeListMenu blockType='h6' editor={editor} />
        </>
      )}
    </div>
  );
};

const useFloatingBlockTypeToolbar = (
  editor: LexicalEditor,
  anchorElem: HTMLElement
): JSX.Element | null => {
  const { blockTypePopupNode } = useContext(BlockTypeListPopupContext);
  const [canShow, setCanShow] = useState(false);

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setCanShow(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      // If no draggable next to block node was clicked, this is null
      if (blockTypePopupNode) {
        setCanShow(true);
      } else {
        setCanShow(false);
      }
    });
  }, [editor, blockTypePopupNode]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setCanShow(false);
        }
      })
    );
  }, [editor, updatePopup]);

  if (!canShow) {
    return null;
  }

  return createPortal(
    <ChangeBlockTypeFloatingToolbar editor={editor} anchorElem={anchorElem} />,
    anchorElem
  );
};

const FloatingBlockTypeToolbarPlugin = ({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): JSX.Element | null => {
  const [editor] = useLexicalComposerContext();
  return useFloatingBlockTypeToolbar(editor, anchorElem);
};

export default FloatingBlockTypeToolbarPlugin;
