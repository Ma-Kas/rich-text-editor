import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedParagraphNode,
  Spread,
} from 'lexical';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
} from 'lexical';
import type { RangeSelection } from 'lexical';
import {
  ElementNode,
  isHTMLElement,
  $applyNodeReplacement,
  $isTextNode,
} from 'lexical';

export interface GalleryContainerPayload {
  key?: NodeKey;
  captionText?: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
}

export interface UpdateGalleryContainerPayload {
  captionText?: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
}

function convertGalleryContainerElement(
  element: HTMLElement
): DOMConversionOutput {
  const node = $createGalleryContainerNode();
  if (element.style && element.style.width && element.style.maxWidth) {
    node.setWidth(element.style.width);
    node.setMaxWidth(element.style.maxWidth);
  }

  const captionContainer = element.querySelector('.gallery-caption-container');
  if (captionContainer) {
    node.setCaptionText(captionContainer.innerHTML);
  }
  return { node };
}

export type SerializedGalleryContainerNode = Spread<
  {
    captionText: string;
    width?: string | null | undefined;
    maxWidth?: string | null | undefined;
  },
  SerializedParagraphNode
>;

export class GalleryContainerNode extends ElementNode {
  __captionText: string;
  __width: string | null | undefined;
  __maxWidth: string | null | undefined;

  static getType(): string {
    return 'gallery-container';
  }
  static clone(node: GalleryContainerNode): GalleryContainerNode {
    return new GalleryContainerNode(
      node.__width,
      node.__maxWidth,
      node.__captionText,
      node.__key
    );
  }

  constructor(
    width?: string | null | undefined,
    maxWidth?: string | null | undefined,
    captionText?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__width = width ? width : null;
    this.__maxWidth = maxWidth ? maxWidth : null;
    this.__captionText = captionText ? captionText : '';
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    const className = config.theme.galleryContainer;
    if (className !== undefined) {
      div.className = className;
    }
    if (this.__width) {
      div.style.width = this.__width;
    }
    if (this.__maxWidth) {
      div.style.maxWidth = this.__maxWidth;
    }
    return div;
  }

  updateDOM(
    prevNode: GalleryContainerNode,
    dom: HTMLElement,
    _config: EditorConfig
  ): boolean {
    const width = this.__width;
    const maxWidth = this.__maxWidth;
    if (
      width &&
      width !== prevNode.__width &&
      maxWidth &&
      maxWidth !== prevNode.__maxWidth
    ) {
      // Update the width and max-width of node
      dom.style.width = width;
      dom.style.maxWidth = maxWidth;
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      p: () => ({
        conversion: convertGalleryContainerElement,
        priority: 0,
      }),
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);

    if (element && isHTMLElement(element)) {
      const width = this.getWidth();
      const maxWidth = this.getMaxWidth();
      if (width && maxWidth) {
        element.style.width = width;
        element.style.maxWidth = maxWidth;
      }
    }

    return {
      element,
    };
  }

  static importJSON(
    serializedNode: SerializedGalleryContainerNode
  ): GalleryContainerNode {
    const node = $createGalleryContainerNode();
    node.setWidth(serializedNode.width);
    node.setMaxWidth(serializedNode.maxWidth);
    node.setCaptionText(serializedNode.captionText);
    return node;
  }

  exportJSON(): SerializedGalleryContainerNode {
    return {
      ...super.exportJSON(),
      width: this.__width,
      maxWidth: this.__maxWidth,
      captionText: this.__captionText,
      type: 'gallery-container',
      version: 1,
    };
  }

  getCaptionText(): string {
    return this.__captionText;
  }

  setCaptionText(captionText: string): void {
    const writable = this.getWritable();
    writable.__captionText = captionText;
  }

  getWidth(): string | null | undefined {
    return this.__width;
  }

  setWidth(width: string | null | undefined): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  getMaxWidth(): string | null | undefined {
    return this.__maxWidth;
  }

  setMaxWidth(maxWidth: string | null | undefined): void {
    const writable = this.getWritable();
    writable.__maxWidth = maxWidth;
  }

  update(payload: UpdateGalleryContainerPayload): void {
    const writable = this.getWritable();
    const { captionText, width, maxWidth } = payload;
    if (captionText !== undefined) {
      writable.__captionText = captionText;
    }
    if (width !== undefined) {
      writable.__width = width;
    }
    if (maxWidth !== undefined) {
      writable.__maxWidth = maxWidth;
    }
  }

  insertNewAfter(
    _: RangeSelection,
    restoreSelection: boolean
  ): GalleryContainerNode {
    const newElement = $createGalleryContainerNode();
    const width = this.getWidth();
    const maxWidth = this.getMaxWidth();
    const captionText = this.getCaptionText();
    newElement.setWidth(width);
    newElement.setMaxWidth(maxWidth);
    newElement.setCaptionText(captionText);
    this.insertAfter(newElement, restoreSelection);
    return newElement;
  }

  collapseAtStart(): boolean {
    const children = this.getChildren();
    // If we have an empty (trimmed) first paragraph and try and remove it,
    // delete the paragraph as long as we have another sibling to go to
    if (
      children.length === 0 ||
      ($isTextNode(children[0]) && children[0].getTextContent().trim() === '')
    ) {
      const nextSibling = this.getNextSibling();
      if (nextSibling !== null) {
        this.selectNext();
        this.remove();
        return true;
      }
      const prevSibling = this.getPreviousSibling();
      if (prevSibling !== null) {
        this.selectPrevious();
        this.remove();
        return true;
      }
    }
    return false;
  }
}

export function $createGalleryContainerNode(): GalleryContainerNode {
  return $applyNodeReplacement(new GalleryContainerNode());
}
export function $isGalleryContainerNode(
  node: LexicalNode | null | undefined
): node is GalleryContainerNode {
  return node instanceof GalleryContainerNode;
}
