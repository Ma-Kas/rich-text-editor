import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import LexicalClickableLinkPlugin from '@lexical/react/LexicalClickableLinkPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import useLexicalEditable from '@lexical/react/useLexicalEditable';
import { createContext, useState } from 'react';
import { useSettings } from './context/SettingsContext';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import CollapsiblePlugin from './plugins/CollapsiblePlugin';
import DragDropPaste from './plugins/DragDropPastePlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
import FloatingTextFormatToolbarPlugin from './plugins/FloatingTextFormatToolbarPlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import ImageGalleryPlugin from './plugins/ImageGalleryPlugin';
import ImageCarouselPlugin from './plugins/ImageCarouselPlugin';
import { LayoutPlugin } from './plugins/LayoutPlugin/LayoutPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin';
import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import EmbedPlugin from './plugins/EmbedPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import ContentEditable from './ui/ContentEditable';
import Placeholder from './ui/Placeholder';
import FloatingBlockTypeToolbarPlugin from './plugins/FloatingBlockTypeToolbarPlugin';
import { LexicalNode } from 'lexical';

type BlockTypeListContext = {
  blockTypePopupNode: LexicalNode | null;
  setBlockTypePopupNode: React.Dispatch<
    React.SetStateAction<LexicalNode | null>
  >;
};

export const BlockTypeListPopupContext = createContext<BlockTypeListContext>({
  blockTypePopupNode: null,
  setBlockTypePopupNode: () => {},
});

export default function Editor(): JSX.Element {
  const {
    settings: { tableCellMerge, tableCellBackgroundColor },
  } = useSettings();
  const isEditable = useLexicalEditable();
  const [blockTypePopupNode, setBlockTypePopupNode] =
    useState<LexicalNode | null>(null);

  const placeholder = <Placeholder>{'Enter some text...'}</Placeholder>;
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <>
      <BlockTypeListPopupContext.Provider
        value={{ blockTypePopupNode, setBlockTypePopupNode }}
      >
        <ToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
      </BlockTypeListPopupContext.Provider>

      <div className={'editor-container'}>
        <DragDropPaste />
        <AutoFocusPlugin />
        <HashtagPlugin />
        <AutoLinkPlugin />
        <>
          <HistoryPlugin />
          <RichTextPlugin
            contentEditable={
              <div className='editor-scroller'>
                <div className='editor' ref={onRef}>
                  <ContentEditable />
                </div>
              </div>
            }
            placeholder={placeholder}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <CodeHighlightPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <ListMaxIndentLevelPlugin maxDepth={7} />
          <TablePlugin
            hasCellMerge={tableCellMerge}
            hasCellBackgroundColor={tableCellBackgroundColor}
          />
          <TableCellResizer />
          <ImagesPlugin />
          <ImageGalleryPlugin />
          <ImageCarouselPlugin />
          <LinkPlugin />
          <EmbedPlugin />
          {!isEditable && <LexicalClickableLinkPlugin />}
          <HorizontalRulePlugin />
          <TabIndentationPlugin />
          <CollapsiblePlugin />
          <LayoutPlugin />
          {floatingAnchorElem && (
            <>
              <BlockTypeListPopupContext.Provider
                value={{ blockTypePopupNode, setBlockTypePopupNode }}
              >
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
              </BlockTypeListPopupContext.Provider>
              <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
              <FloatingLinkEditorPlugin
                anchorElem={floatingAnchorElem}
                isLinkEditMode={isLinkEditMode}
                setIsLinkEditMode={setIsLinkEditMode}
              />
              <TableCellActionMenuPlugin
                anchorElem={floatingAnchorElem}
                cellMerge={true}
              />
              <FloatingTextFormatToolbarPlugin
                anchorElem={floatingAnchorElem}
              />
              <BlockTypeListPopupContext.Provider
                value={{ blockTypePopupNode, setBlockTypePopupNode }}
              >
                <FloatingBlockTypeToolbarPlugin
                  anchorElem={floatingAnchorElem}
                />
              </BlockTypeListPopupContext.Provider>
            </>
          )}
        </>
      </div>
    </>
  );
}
