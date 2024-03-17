import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
} from 'lexical';
import { isHTMLElement, $applyNodeReplacement, DecoratorNode } from 'lexical';

import { Suspense } from 'react';
import { GalleryComponent } from '../utils/lazyImportComponents';

export interface GalleryImage {
  id: number;
  altText: string;
  src: string;
}

export interface GalleryContainerPayload {
  key?: NodeKey;
  imageList: GalleryImage[];
  captionText?: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
}

export interface UpdateGalleryContainerPayload {
  imageList?: GalleryImage[];
  captionText?: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
}

function convertGalleryContainerElement(
  element: HTMLElement
): DOMConversionOutput {
  const images = Array.from(
    element.querySelectorAll('img.gallery-image')
  ) as HTMLImageElement[];
  let newImageList: GalleryImage[] | undefined;

  for (let i = 0; i < images.length; i++) {
    const imageData = {
      id: i,
      src: images[i].src,
      altText: images[i].alt,
    };
    newImageList!.push(imageData);
  }

  const node = $createGalleryContainerNode({ imageList: newImageList! });
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
    imageList: GalleryImage[];
    captionText: string;
    width?: string | null | undefined;
    maxWidth?: string | null | undefined;
  },
  SerializedLexicalNode
>;

export class GalleryContainerNode extends DecoratorNode<JSX.Element> {
  __imageList: GalleryImage[];
  __captionText: string;
  __width: string | null | undefined;
  __maxWidth: string | null | undefined;

  static getType(): string {
    return 'gallery-container';
  }
  static clone(node: GalleryContainerNode): GalleryContainerNode {
    return new GalleryContainerNode(
      node.__imageList,
      node.__width,
      node.__maxWidth,
      node.__captionText,
      node.__key
    );
  }

  constructor(
    imageList: GalleryImage[],
    width?: string | null | undefined,
    maxWidth?: string | null | undefined,
    captionText?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__imageList = imageList;
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
    div.draggable = false;

    // const gridContainerDiv = document.createElement('div');
    // gridContainerDiv.className = 'grid-container';

    // this.__imageList.forEach((image) => {
    //   const img = document.createElement('img');
    //   img.className = 'gallery-image';
    //   img.src = image.src;
    //   img.alt = image.altText;
    //   gridContainerDiv.appendChild(img);
    // });
    // div.appendChild(gridContainerDiv);

    // const caption = this.__captionText;
    // if (caption) {
    //   const captionDiv = document.createElement('div');
    //   captionDiv.className = 'gallery-caption-container';
    //   captionDiv.textContent = this.__captionText;
    //   div.appendChild(captionDiv);
    // }

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
    const node = $createGalleryContainerNode({
      imageList: serializedNode.imageList,
    });
    node.setImageList(serializedNode.imageList);
    node.setWidth(serializedNode.width);
    node.setMaxWidth(serializedNode.maxWidth);
    node.setCaptionText(serializedNode.captionText);
    return node;
  }

  exportJSON(): SerializedGalleryContainerNode {
    return {
      imageList: this.__imageList,
      width: this.__width,
      maxWidth: this.__maxWidth,
      captionText: this.__captionText,
      type: 'gallery-container',
      version: 1,
    };
  }

  getImageList(): GalleryImage[] {
    return this.__imageList;
  }

  setImageList(imageList: GalleryImage[]): void {
    const writable = this.getWritable();
    writable.__imageList = imageList;
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

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <GalleryComponent
          imageList={this.__imageList}
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

export function $createGalleryContainerNode({
  imageList,
}: {
  imageList: GalleryImage[];
}): GalleryContainerNode {
  return $applyNodeReplacement(new GalleryContainerNode(imageList));
}
export function $isGalleryContainerNode(
  node: LexicalNode | null | undefined
): node is GalleryContainerNode {
  return node instanceof GalleryContainerNode;
}
