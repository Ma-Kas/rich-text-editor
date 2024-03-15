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

export type Alignment = 'left' | 'right' | 'center' | undefined;

export interface ImagePayload {
  altText: string;
  key?: NodeKey;
  captionText?: string;
  src: string;
  alignment?: Alignment;
}

export interface UpdateImagePayload {
  altText?: string;
  captionText?: string;
  alignment?: Alignment;
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
    alignment?: Alignment;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __captionText: string;
  __alignment: Alignment;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__alignment,
      node.__captionText,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, src, captionText, alignment } = serializedNode;
    const node = $createImageNode({
      altText,
      captionText,
      src,
      alignment,
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
    alignment: Alignment,
    captionText?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__alignment = alignment;
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
      alignment: this.__alignment,
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

  getAlignment(): Alignment {
    return this.__alignment;
  }

  setAlignment(alignment: Alignment): void {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  update(payload: UpdateImagePayload): void {
    const writable = this.getWritable();
    const { altText, captionText, alignment } = payload;
    if (altText !== undefined) {
      writable.__altText = altText;
    }
    if (captionText !== undefined) {
      writable.__captionText = captionText;
    }
    if (alignment !== undefined) {
      writable.__alignment = alignment;
    }
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    const className = config.theme.image;
    if (className !== undefined) {
      div.className = className;
    }
    return div;
  }

  updateDOM(
    prevNode: ImageNode,
    dom: HTMLElement,
    _config: EditorConfig
  ): false {
    const alignment = this.__alignment;
    if (alignment && alignment !== prevNode.__alignment) {
      // Update the justify-content in parent
      const blockContainer = dom.parentElement;
      if (
        blockContainer &&
        blockContainer instanceof HTMLElement &&
        blockContainer.classList.contains('EditorTheme__imageBlock')
      ) {
        blockContainer.style.justifyContent = alignment;
      }
    }
    return false;
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          alignment={this.__alignment}
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
  alignment = 'center',
  src,
  captionText,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(src, altText, alignment, captionText, key)
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
