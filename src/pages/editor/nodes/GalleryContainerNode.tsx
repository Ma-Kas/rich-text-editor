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
import { getMinColumnWidth } from '../utils/getMinColumnWidth';

export type GalleryImageObjectPosition =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom';

export interface GalleryImage {
  id: number;
  altText: string;
  src: string;
  objectPosition?: GalleryImageObjectPosition | null | undefined;
  imageWidth?: string | null | undefined;
  aspectRatio?: string | null | undefined;
}

export type GridType = 'dynamic-type' | 'static-type' | 'flex-type';

export interface GalleryContainerPayload {
  key?: NodeKey;
  imageList: GalleryImage[];
  gridType: GridType;
  columns?: number | null | undefined;
  captionText?: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  gridGap?: string | null | undefined;
  columnMinWidth?: number | null | undefined;
}

export interface UpdateGalleryContainerPayload {
  imageList?: GalleryImage[];
  gridType?: GridType;
  columns?: number | null | undefined;
  captionText?: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  gridGap?: string | null | undefined;
  columnMinWidth?: number | null | undefined;
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
      objectPosition: images[i].style
        .objectPosition as GalleryImageObjectPosition,
      imageWidth: images[i].style.width,
      aspectRatio: images[i].style.aspectRatio,
    };

    newImageList!.push(imageData);
  }

  const node = $createGalleryContainerNode({
    imageList: newImageList!,
    gridType: 'dynamic-type',
  });
  if (element.style) {
    if (element.style.width && element.style.maxWidth) {
      node.setWidth(element.style.width);
      node.setMaxWidth(element.style.maxWidth);
    }
    if (element.style.gap) {
      node.setGridGap(element.style.gap);
    }
    if (element.style.gridTemplateColumns) {
      const minimumColumnWidth = getMinColumnWidth(
        element.style.gridTemplateColumns
      );
      node.setColumnMinWidth(minimumColumnWidth);
    }
  }

  const gridContainer = element.querySelector('.grid-container');
  if (gridContainer) {
    if (gridContainer.classList.contains('static-type')) {
      node.setGridType('static-type');
    } else if (gridContainer.classList.contains('flex-type')) {
      node.setGridType('flex-type');
    } else {
      node.setGridType('dynamic-type');
    }
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
    gridType: GridType;
    columns: number | null | undefined;
    captionText: string;
    width?: string | null | undefined;
    maxWidth?: string | null | undefined;
    gridGap?: string | null | undefined;
    columnMinWidth?: number | null | undefined;
  },
  SerializedLexicalNode
>;

export class GalleryContainerNode extends DecoratorNode<JSX.Element> {
  __imageList: GalleryImage[];
  __gridType: GridType;
  __columns: number | null | undefined;
  __captionText: string;
  __width: string | null | undefined;
  __maxWidth: string | null | undefined;
  __gridGap: string | null | undefined;
  __columnMinWidth: number | null | undefined;

  static getType(): string {
    return 'gallery-container';
  }
  static clone(node: GalleryContainerNode): GalleryContainerNode {
    return new GalleryContainerNode(
      node.__imageList,
      node.__gridType,
      node.__columns,
      node.__width,
      node.__maxWidth,
      node.__captionText,
      node.__gridGap,
      node.__columnMinWidth,
      node.__key
    );
  }

  constructor(
    imageList: GalleryImage[],
    gridType: GridType,
    columns?: number | null | undefined,
    width?: string | null | undefined,
    maxWidth?: string | null | undefined,
    captionText?: string,
    gridGap?: string | null | undefined,
    columnMinWidth?: number | null | undefined,
    key?: NodeKey
  ) {
    super(key);
    this.__imageList = imageList;
    this.__gridType = gridType;
    this.__columns = columns;
    this.__width = width ? width : null;
    this.__maxWidth = maxWidth ? maxWidth : null;
    this.__captionText = captionText ? captionText : '';
    this.__gridGap = gridGap ? gridGap : null;
    this.__columnMinWidth = columnMinWidth ? columnMinWidth : null;
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
      gridType: serializedNode.gridType,
    });
    node.setImageList(serializedNode.imageList);
    node.setGridType(serializedNode.gridType);
    node.setColumns(serializedNode.columns);
    node.setWidth(serializedNode.width);
    node.setMaxWidth(serializedNode.maxWidth);
    node.setCaptionText(serializedNode.captionText);
    node.setGridGap(serializedNode.gridGap);
    node.setColumnMinWidth(serializedNode.columnMinWidth);
    return node;
  }

  exportJSON(): SerializedGalleryContainerNode {
    return {
      imageList: this.__imageList,
      gridType: this.__gridType,
      columns: this.__columns,
      width: this.__width,
      maxWidth: this.__maxWidth,
      captionText: this.__captionText,
      gridGap: this.__gridGap,
      columnMinWidth: this.__columnMinWidth,
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

  getGridType(): GridType {
    return this.__gridType;
  }

  setGridType(gridType: GridType): void {
    const writable = this.getWritable();
    writable.__gridType = gridType;
  }

  getColumns(): number | null | undefined {
    return this.__columns;
  }

  setColumns(columns: number | null | undefined): void {
    const writable = this.getWritable();
    writable.__columns = columns;
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

  getGridGap(): string | null | undefined {
    return this.__gridGap;
  }

  setGridGap(gridGap: string | null | undefined): void {
    const writable = this.getWritable();
    writable.__gridGap = gridGap;
  }

  getColumnMinWidth(): number | null | undefined {
    return this.__columnMinWidth;
  }

  setColumnMinWidth(columnMinWidth: number | null | undefined): void {
    const writable = this.getWritable();
    writable.__columnMinWidth = columnMinWidth;
  }

  update(payload: UpdateGalleryContainerPayload): void {
    const writable = this.getWritable();
    const {
      imageList,
      gridType,
      columns,
      captionText,
      width,
      maxWidth,
      gridGap,
      columnMinWidth,
    } = payload;
    if (gridType !== undefined) {
      writable.__gridType = gridType;
    }
    if (imageList !== undefined) {
      writable.__imageList = imageList;
    }
    if (columns !== undefined) {
      writable.__columns = columns;
    }
    if (gridGap !== undefined) {
      writable.__gridGap = gridGap;
    }
    if (columnMinWidth !== undefined) {
      writable.__columnMinWidth = columnMinWidth;
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
        <GalleryComponent
          imageList={this.__imageList}
          gridType={this.__gridType}
          columns={this.__columns}
          captionText={this.__captionText}
          width={this.__width}
          maxWidth={this.__maxWidth}
          gridGap={this.__gridGap}
          columnMinWidth={this.__columnMinWidth}
          nodeKey={this.getKey()}
          resizable={true}
        />
      </Suspense>
    );
  }
}

export function $createGalleryContainerNode({
  imageList,
  gridType,
}: {
  imageList: GalleryImage[];
  gridType: GridType;
}): GalleryContainerNode {
  return $applyNodeReplacement(new GalleryContainerNode(imageList, gridType));
}
export function $isGalleryContainerNode(
  node: LexicalNode | null | undefined
): node is GalleryContainerNode {
  return node!.__type === 'gallery-container';
}
