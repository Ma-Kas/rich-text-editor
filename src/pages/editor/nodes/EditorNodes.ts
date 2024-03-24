import type { Klass, LexicalNode } from 'lexical';

import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { OverflowNode } from '@lexical/overflow';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { CollapsibleContainerNode } from '../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import { CollapsibleContentNode } from '../plugins/CollapsiblePlugin/CollapsibleContentNode';
import { CollapsibleTitleNode } from '../plugins/CollapsiblePlugin/CollapsibleTitleNode';
import { EmbedBlockNode } from './EmbedBlockNode';
import { EmbedNode } from './EmbedNode';
import { ImageBlockNode } from './ImageBlockNode';
import { GalleryBlockNode } from './GalleryBlockNode';
import { GalleryContainerNode } from './GalleryContainerNode';
import { CarouselBlockNode } from './CarouselBlockNode';
import { CarouselContainerNode } from './CarouselContainerNode';
import { ImageNode } from './ImageNode';
import { LayoutContainerNode } from './LayoutContainerNode';
import { LayoutItemNode } from './LayoutItemNode';
import { StickyNode } from './StickyNode';

const EditorNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode,
  OverflowNode,
  StickyNode,
  EmbedBlockNode,
  EmbedNode,
  ImageBlockNode,
  GalleryBlockNode,
  GalleryContainerNode,
  CarouselBlockNode,
  CarouselContainerNode,
  ImageNode,
  HorizontalRuleNode,
  MarkNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  LayoutContainerNode,
  LayoutItemNode,
];

export default EditorNodes;
