import { $getSelection, $isRangeSelection, LexicalEditor } from 'lexical';
import * as React from 'react';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BlockTypeListPopupContext } from '../Editor';
import { getSelectedNode } from '../utils/getSelectedNode';

type BlockTypeListContextType = {
  registerItem: (ref: React.RefObject<HTMLButtonElement>) => void;
};

const BlockTypeListContext =
  React.createContext<BlockTypeListContextType | null>(null);

function BlockTypeListItem({
  children,
  className,
  onClick,
  title,
}: {
  children: React.ReactNode;
  className: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const blockTypeListContext = React.useContext(BlockTypeListContext);

  if (blockTypeListContext === null) {
    throw new Error('BlockTypeListItem must be used within a BlockTypeList');
  }

  const { registerItem } = blockTypeListContext;

  useEffect(() => {
    if (ref && ref.current) {
      registerItem(ref);
    }
  }, [ref, registerItem]);

  return (
    <button
      className={className}
      onClick={onClick}
      ref={ref}
      title={title}
      type='button'
    >
      {children}
    </button>
  );
}

function BlockTypeListItems({
  children,
  typeListRef,
  onClose,
}: {
  children: React.ReactNode;
  typeListRef: React.Ref<HTMLDivElement>;
  onClose: () => void;
}) {
  const [items, setItems] = useState<React.RefObject<HTMLButtonElement>[]>();
  const [highlightedItem, setHighlightedItem] =
    useState<React.RefObject<HTMLButtonElement>>();

  const registerItem = useCallback(
    (itemRef: React.RefObject<HTMLButtonElement>) => {
      setItems((prev) => (prev ? [...prev, itemRef] : [itemRef]));
    },
    [setItems]
  );

  // If focus is on outside of popup OR its children, fire onClose
  const handleBlur = (event: React.FocusEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      onClose();
    }
  };

  // Click on element on child element (=something was selected), close
  const handleClick = () => {
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!items) {
      return;
    }

    const key = event.key;

    if (['Escape', 'ArrowUp', 'ArrowDown', 'Tab'].includes(key)) {
      event.preventDefault();
    }

    if (key === 'Escape' || key === 'Tab') {
      onClose();
    } else if (key === 'ArrowUp') {
      setHighlightedItem((prev) => {
        if (!prev) {
          return items[0];
        }
        const index = items.indexOf(prev) - 1;
        return items[index === -1 ? items.length - 1 : index];
      });
    } else if (key === 'ArrowDown') {
      setHighlightedItem((prev) => {
        if (!prev) {
          return items[0];
        }
        return items[items.indexOf(prev) + 1];
      });
    }
  };

  const contextValue = useMemo(
    () => ({
      registerItem,
    }),
    [registerItem]
  );

  useEffect(() => {
    if (items && !highlightedItem) {
      setHighlightedItem(items[0]);
    }

    if (highlightedItem && highlightedItem.current) {
      highlightedItem.current.focus();
    }
  }, [items, highlightedItem]);

  return (
    <BlockTypeListContext.Provider value={contextValue}>
      <div
        className='dropdown'
        ref={typeListRef}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onBlur={handleBlur}
      >
        {children}
      </div>
    </BlockTypeListContext.Provider>
  );
}

function BlockTypeList({
  children,
  editor,
}: {
  children: ReactNode;
  editor: LexicalEditor;
}): JSX.Element {
  const typeListRef = useRef<HTMLDivElement>(null);
  const { setBlockTypePopupNode } = React.useContext(BlockTypeListPopupContext);

  // Force set the node reference to null to set canShow in
  // FloatingBlockTypeToolbarPlugin to false
  const handleClose = () => {
    editor.update(() => {
      setBlockTypePopupNode(null);
      // Get reference to newly changed node
      const selection = $getSelection();
      if (!selection || !$isRangeSelection(selection)) {
        return;
      }
      const node = getSelectedNode(selection);
      // Set selection to end of changed node, to update Toolbar and let user
      // continue work in selected paragraph
      node.selectEnd();
    });
  };

  return (
    <>
      <BlockTypeListItems typeListRef={typeListRef} onClose={handleClose}>
        {children}
      </BlockTypeListItems>
    </>
  );
}

export default BlockTypeList;
export { BlockTypeListItem };
