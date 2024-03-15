import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { $applyNodeReplacement, DecoratorNode } from 'lexical';

import { Suspense } from 'react';
import { ImageComponent } from '../utils/lazyImportComponents';

export interface ImagePayload {
  altText: string;
  key?: NodeKey;
  captionText?: string;
  src: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
}

export interface UpdateImagePayload {
  altText?: string;
  captionText?: string;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  if (img.src.startsWith('file:///')) {
    return null;
  }
  const { alt: altText, src } = img;
  const node = $createImageNode({ altText, src });
  return { node };
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    captionText: string;
    src: string;
    width?: string | null | undefined;
    maxWidth?: string | null | undefined;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __captionText: string;
  __width: string | null | undefined;
  __maxWidth: string | null | undefined;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__maxWidth,
      node.__captionText,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, src, captionText, width, maxWidth } = serializedNode;
    const node = $createImageNode({
      altText,
      captionText,
      src,
      width,
      maxWidth,
    });
    return node;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    width: string | null | undefined,
    maxWidth: string | null | undefined,
    captionText?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__maxWidth = maxWidth;
    this.__captionText = captionText || '';
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    return { element };
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      width: this.__width,
      maxWidth: this.__maxWidth,
      captionText: this.__captionText,
      src: this.getSrc(),
      type: 'image',
      version: 1,
    };
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  setAltText(altText: string): void {
    const writable = this.getWritable();
    writable.__altText = altText;
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

  update(payload: UpdateImagePayload): void {
    const writable = this.getWritable();
    const { altText, captionText } = payload;
    if (altText !== undefined) {
      writable.__altText = altText;
    }
    if (captionText !== undefined) {
      writable.__captionText = captionText;
    }
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    const className = config.theme.image;
    if (className !== undefined) {
      div.className = className;
    }
    if (this.__maxWidth && this.__width) {
      div.style.maxWidth = this.__maxWidth;
      div.style.width = this.__width;
    }
    return div;
  }

  updateDOM(
    _prevNode: ImageNode,
    _dom: HTMLElement,
    _config: EditorConfig
  ): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          maxWidth={this.__maxWidth}
          nodeKey={this.getKey()}
          captionText={this.__captionText}
          resizable={true}
        />
      </Suspense>
    );
  }
}

export function $createImageNode({
  altText,
  width = null,
  maxWidth = null,
  src,
  captionText,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(src, altText, width, maxWidth, captionText, key)
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
