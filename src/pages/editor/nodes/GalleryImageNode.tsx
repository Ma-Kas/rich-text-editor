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

export interface GalleryImagePayload {
  altText: string;
  key?: NodeKey;
  src: string;
}

export interface UpdateGalleryImagePayload {
  altText?: string;
}

function convertGalleryImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  if (img.src.startsWith('file:///')) {
    return null;
  }
  const { alt: altText, src } = img;
  const node = $createGalleryImageNode({ altText, src });
  return { node };
}

export type SerializedGalleryImageNode = Spread<
  {
    altText: string;
    src: string;
  },
  SerializedLexicalNode
>;

export class GalleryImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;

  static getType(): string {
    return 'gallery-image';
  }

  static clone(node: GalleryImageNode): GalleryImageNode {
    return new GalleryImageNode(node.__src, node.__altText, node.__key);
  }

  static importJSON(
    serializedNode: SerializedGalleryImageNode
  ): GalleryImageNode {
    const { altText, src } = serializedNode;
    const node = $createGalleryImageNode({
      altText,
      src,
    });
    return node;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertGalleryImageElement,
        priority: 0,
      }),
    };
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    return { element };
  }

  exportJSON(): SerializedGalleryImageNode {
    return {
      altText: this.getAltText(),
      src: this.getSrc(),
      type: 'gallery-image',
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

  update(payload: UpdateGalleryImagePayload): void {
    const writable = this.getWritable();
    const { altText } = payload;
    if (altText !== undefined) {
      writable.__altText = altText;
    }
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    const className = config.theme.galleryImage;
    if (className !== undefined) {
      div.className = className;
    }
    return div;
  }

  updateDOM(
    _prevNode: GalleryImageNode,
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
          nodeKey={this.getKey()}
        />
      </Suspense>
    );
  }
}

export function $createGalleryImageNode({
  altText,
  src,
  key,
}: GalleryImagePayload): GalleryImageNode {
  return $applyNodeReplacement(new GalleryImageNode(src, altText, key));
}

export function $isGalleryImageNode(
  node: LexicalNode | null | undefined
): node is GalleryImageNode {
  return node instanceof GalleryImageNode;
}
