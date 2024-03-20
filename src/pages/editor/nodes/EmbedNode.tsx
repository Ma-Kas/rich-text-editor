import {
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

import EmbedComponent from './EmbedComponent';

export interface EmbedPayload {
  embedType: string;
  html: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  height?: string | null | undefined;
  maxHeight?: string | null | undefined;
  key?: NodeKey;
}

export interface UpdateEmbedPayload {
  embedType?: string;
  html?: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  height?: string | null | undefined;
  maxHeight?: string | null | undefined;
  key?: NodeKey;
}

function convertEmbedElement(element: HTMLElement): DOMConversionOutput {
  const node = $createEmbedNode({
    embedType: element.dataset.embedType!,
    html: element.innerHTML,
  });
  if (element.style) {
    if (element.style.width) {
      node.setWidth(element.style.width);
    }
    if (element.style.maxWidth) {
      node.setMaxWidth(element.style.maxWidth);
    }
    if (element.style.height) {
      node.setHeight(element.style.height);
    }
    if (element.style.maxHeight) {
      node.setMaxHeight(element.style.maxHeight);
    }
  }
  return { node };
}

export type SerializedEmbedNode = Spread<
  {
    embedType: string;
    html: string;
    width?: string | null | undefined;
    maxWidth?: string | null | undefined;
    height?: string | null | undefined;
    maxHeight?: string | null | undefined;
  },
  SerializedLexicalNode
>;

export class EmbedNode extends DecoratorNode<JSX.Element> {
  __embedType: string;
  __html: string;
  __width: string | null | undefined;
  __maxWidth: string | null | undefined;
  __height: string | null | undefined;
  __maxHeight: string | null | undefined;

  static getType(): string {
    return 'embed';
  }

  static clone(node: EmbedNode): EmbedNode {
    return new EmbedNode(
      node.__embedType,
      node.__html,
      node.__width,
      node.__maxWidth,
      node.__height,
      node.__maxHeight,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedEmbedNode): EmbedNode {
    const { embedType, html, width, maxWidth, height, maxHeight } =
      serializedNode;
    const node = $createEmbedNode({
      embedType,
      html,
      width,
      maxWidth,
      height,
      maxHeight,
    });
    return node;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertEmbedElement,
        priority: 0,
      }),
    };
  }

  constructor(
    embedType: string,
    html: string,
    width?: string | null | undefined,
    maxWidth?: string | null | undefined,
    height?: string | null | undefined,
    maxHeight?: string | null | undefined,
    key?: NodeKey
  ) {
    super(key);
    this.__embedType = embedType;
    this.__html = html;
    this.__width = width;
    this.__maxWidth = maxWidth;
    this.__height = height;
    this.__maxHeight = maxHeight;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    if (this.__width) {
      element.setAttribute('width', this.__width);
    }
    if (this.__maxWidth) {
      element.setAttribute('maxWidth', this.__maxWidth);
    }
    if (this.__height) {
      element.setAttribute('height', this.__height);
    }
    if (this.__maxHeight) {
      element.setAttribute('maxHeight', this.__maxHeight);
    }
    element.innerHTML = this.__html;

    return { element };
  }

  exportJSON(): SerializedEmbedNode {
    return {
      embedType: this.__embedType,
      html: this.__html,
      width: this.__width,
      maxWidth: this.__maxWidth,
      height: this.__height,
      maxHeight: this.__maxHeight,
      type: 'embed',
      version: 1,
    };
  }

  getEmbedType(): string {
    return this.__embedType;
  }

  setEmbedType(embedType: string): void {
    const writable = this.getWritable();
    writable.__embedType = embedType;
  }

  getHtml(): string {
    return this.__html;
  }

  setHtml(html: string): void {
    const writable = this.getWritable();
    writable.__html = html;
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

  getHeight(): string | null | undefined {
    return this.__height;
  }

  setHeight(height: string | null | undefined): void {
    const writable = this.getWritable();
    writable.__height = height;
  }

  getMaxHeight(): string | null | undefined {
    return this.__maxHeight;
  }

  setMaxHeight(maxHeight: string | null | undefined): void {
    const writable = this.getWritable();
    writable.__maxHeight = maxHeight;
  }

  update(payload: UpdateEmbedPayload): void {
    const writable = this.getWritable();
    const { embedType, html, width, maxWidth, height, maxHeight } = payload;
    if (embedType !== undefined) {
      writable.__embedType = embedType;
    }
    if (html !== undefined) {
      writable.__html = html;
    }
    if (width !== undefined) {
      writable.__width = width;
    }
    if (maxWidth !== undefined) {
      writable.__maxWidth = maxWidth;
    }
    if (height !== undefined) {
      writable.__height = height;
    }
    if (maxHeight !== undefined) {
      writable.__maxHeight = maxHeight;
    }
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    const className = config.theme.embedContainer;
    if (className !== undefined) {
      div.className = className;
    }
    if (this.__width) {
      div.style.width = this.__width;
    }
    if (this.__maxWidth) {
      div.style.maxWidth = this.__maxWidth;
    }
    if (this.__height) {
      div.style.height = this.__height;
    }
    if (this.__maxHeight) {
      div.style.maxHeight = this.__maxHeight;
    }
    return div;
  }

  updateDOM(
    prevNode: EmbedNode,
    dom: HTMLElement,
    _config: EditorConfig
  ): false {
    const width = this.__width;
    const maxWidth = this.__maxWidth;
    const height = this.__height;
    const maxHeight = this.__maxHeight;
    if (width && width !== prevNode.__width) {
      dom.style.width = width;
    }
    if (maxWidth && maxWidth !== prevNode.__maxWidth) {
      dom.style.maxWidth = maxWidth;
    }
    if (height && height !== prevNode.__height) {
      dom.style.height = height;
    }
    if (maxHeight && maxHeight !== prevNode.__maxHeight) {
      dom.style.maxHeight = maxHeight;
    }

    return false;
  }

  decorate(): JSX.Element {
    return (
      <EmbedComponent
        embedType={this.__embedType}
        html={this.__html}
        width={this.__width}
        maxWidth={this.__maxWidth}
        height={this.__height}
        maxHeight={this.__maxHeight}
        nodeKey={this.getKey()}
        resizable={true}
      />
    );
  }
}

export function $createEmbedNode({
  embedType,
  html,
  width = null,
  maxWidth = null,
  height = null,
  maxHeight = null,
  key,
}: EmbedPayload): EmbedNode {
  return $applyNodeReplacement(
    new EmbedNode(embedType, html, width, maxWidth, height, maxHeight, key)
  );
}

export function $isEmbedNode(
  node: LexicalNode | null | undefined
): node is EmbedNode {
  return node instanceof EmbedNode;
}