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
import { CarouselComponent } from '../utils/lazyImportComponents';

export type CarouselImageObjectPosition =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom';

export interface CarouselImage {
  id: number;
  altText: string;
  src: string;
  objectPosition?: CarouselImageObjectPosition | null | undefined;
  aspectRatio?: string | null | undefined;
}

export type CarouselType = 'slideshow' | 'slider';

export interface CarouselContainerPayload {
  key?: NodeKey;
  imageList: CarouselImage[];
  carouselType: CarouselType;
  imagesInView?: number | null | undefined;
  captionText?: string;
  width?: string | null | undefined;
  imageGap?: string | null | undefined;
}

export interface UpdateCarouselContainerPayload {
  imageList?: CarouselImage[];
  carouselType?: CarouselType;
  imagesInView?: number | null | undefined;
  captionText?: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  imageGap?: string | null | undefined;
}

function convertCarouselContainerElement(
  element: HTMLElement
): DOMConversionOutput {
  const images = Array.from(
    element.querySelectorAll('img.carousel-image')
  ) as HTMLImageElement[];
  let newImageList: CarouselImage[] | undefined;

  for (let i = 0; i < images.length; i++) {
    const imageData = {
      id: i,
      src: images[i].src,
      altText: images[i].alt,
      objectPosition: images[i].style
        .objectPosition as CarouselImageObjectPosition,
      imageWidth: images[i].style.width,
      aspectRatio: images[i].style.aspectRatio,
    };

    newImageList!.push(imageData);
  }

  const node = $createCarouselContainerNode({
    imageList: newImageList!,
    carouselType: 'slideshow',
  });
  if (element.style) {
    if (element.style.width && element.style.maxWidth) {
      node.setWidth(element.style.width);
      node.setMaxWidth(element.style.maxWidth);
    }
  }
  return { node };
}

export type SerializedCarouselContainerNode = Spread<
  {
    imageList: CarouselImage[];
    carouselType: CarouselType;
    imagesInView: number | null | undefined;
    captionText: string;
    width?: string | null | undefined;
    maxWidth?: string | null | undefined;
    imageGap?: string | null | undefined;
  },
  SerializedLexicalNode
>;

export class CarouselContainerNode extends DecoratorNode<JSX.Element> {
  __imageList: CarouselImage[];
  __carouselType: CarouselType;
  __imagesInView: number | null | undefined;
  __captionText: string;
  __width: string | null | undefined;
  __maxWidth: string | null | undefined;
  __imageGap: string | null | undefined;

  static getType(): string {
    return 'carousel-container';
  }
  static clone(node: CarouselContainerNode): CarouselContainerNode {
    return new CarouselContainerNode(
      node.__imageList,
      node.__carouselType,
      node.__imagesInView,
      node.__width,
      node.__maxWidth,
      node.__captionText,
      node.__imageGap,
      node.__key
    );
  }

  constructor(
    imageList: CarouselImage[],
    carouselType: CarouselType,
    imagesInView?: number | null | undefined,
    width?: string | null | undefined,
    maxWidth?: string | null | undefined,
    captionText?: string,
    imageGap?: string | null | undefined,
    key?: NodeKey
  ) {
    super(key);
    this.__imageList = imageList;
    this.__carouselType = carouselType;
    this.__imagesInView = imagesInView ? imagesInView : 2;
    this.__width = width ? width : null;
    this.__maxWidth = maxWidth ? maxWidth : null;
    this.__captionText = captionText ? captionText : '';
    this.__imageGap = imageGap ? imageGap : '0.5rem';
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    const className = config.theme.carouselContainer;
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

    return div;
  }

  updateDOM(
    prevNode: CarouselContainerNode,
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
        conversion: convertCarouselContainerElement,
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
    serializedNode: SerializedCarouselContainerNode
  ): CarouselContainerNode {
    const node = $createCarouselContainerNode({
      imageList: serializedNode.imageList,
      carouselType: serializedNode.carouselType,
    });
    node.setImageList(serializedNode.imageList);
    node.setCarouselType(serializedNode.carouselType);
    node.setImagesInView(serializedNode.imagesInView);
    node.setWidth(serializedNode.width);
    node.setMaxWidth(serializedNode.maxWidth);
    node.setCaptionText(serializedNode.captionText);
    node.setImageGap(serializedNode.imageGap);
    return node;
  }

  exportJSON(): SerializedCarouselContainerNode {
    return {
      imageList: this.__imageList,
      carouselType: this.__carouselType,
      imagesInView: this.__imagesInView,
      width: this.__width,
      maxWidth: this.__maxWidth,
      captionText: this.__captionText,
      imageGap: this.__imageGap,
      type: 'carousel-container',
      version: 1,
    };
  }

  getImageList(): CarouselImage[] {
    return this.__imageList;
  }

  setImageList(imageList: CarouselImage[]): void {
    const writable = this.getWritable();
    writable.__imageList = imageList;
  }

  getCarouselType(): CarouselType {
    return this.__carouselType;
  }

  setCarouselType(carouselType: CarouselType): void {
    const writable = this.getWritable();
    writable.__carouselType = carouselType;
  }

  getImagesInView(): number | null | undefined {
    return this.__imagesInView;
  }

  setImagesInView(imagesInView: number | null | undefined): void {
    const writable = this.getWritable();
    writable.__imagesInView = imagesInView;
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

  getImageGap(): string | null | undefined {
    return this.__imageGap;
  }

  setImageGap(imageGap: string | null | undefined): void {
    const writable = this.getWritable();
    writable.__imageGap = imageGap;
  }

  update(payload: UpdateCarouselContainerPayload): void {
    const writable = this.getWritable();
    const {
      imageList,
      carouselType,
      imagesInView,
      captionText,
      width,
      maxWidth,
      imageGap,
    } = payload;
    if (carouselType !== undefined) {
      writable.__carouselType = carouselType;
    }
    if (imageList !== undefined) {
      writable.__imageList = imageList;
    }
    if (imagesInView !== undefined) {
      writable.__imagesInView = imagesInView;
    }
    if (imageGap !== undefined) {
      writable.__imageGap = imageGap;
    }
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
        <CarouselComponent
          imageList={this.__imageList}
          carouselType={this.__carouselType}
          imagesInView={this.__imagesInView}
          captionText={this.__captionText}
          width={this.__width}
          maxWidth={this.__maxWidth}
          imageGap={this.__imageGap}
          nodeKey={this.getKey()}
          resizable={true}
        />
      </Suspense>
    );
  }
}

export function $createCarouselContainerNode({
  imageList,
  carouselType,
}: {
  imageList: CarouselImage[];
  carouselType: CarouselType;
}): CarouselContainerNode {
  return $applyNodeReplacement(
    new CarouselContainerNode(imageList, carouselType)
  );
}
export function $isCarouselContainerNode(
  node: LexicalNode | null | undefined
): node is CarouselContainerNode {
  return node!.__type === 'carousel-container';
}
