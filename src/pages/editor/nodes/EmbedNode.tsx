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
  source: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  aspectRatio?: string | null | undefined;
  key?: NodeKey;
}

export interface UpdateEmbedPayload {
  embedType?: string;
  source?: string;
  width?: string | null | undefined;
  maxWidth?: string | null | undefined;
  aspectRatio?: string | null | undefined;
  key?: NodeKey;
}

function convertEmbedElement(element: HTMLElement): DOMConversionOutput {
  const node = $createEmbedNode({
    embedType: element.dataset.embedType!,
    source: element.innerHTML,
  });
  if (element.style) {
    if (element.style.width) {
      node.setWidth(element.style.width);
    }
    if (element.style.maxWidth) {
      node.setMaxWidth(element.style.maxWidth);
    }
    if (element.style.aspectRatio) {
      node.setAspectRatio(element.style.aspectRatio);
    }
  }
  return { node };
}

export type SerializedEmbedNode = Spread<
  {
    embedType: string;
    source: string;
    width?: string | null | undefined;
    maxWidth?: string | null | undefined;
    aspectRatio?: string | null | undefined;
  },
  SerializedLexicalNode
>;

export class EmbedNode extends DecoratorNode<JSX.Element> {
  __embedType: string;
  __source: string;
  __width: string | null | undefined;
  __maxWidth: string | null | undefined;
  __aspectRatio: string | null | undefined;

  static getType(): string {
    return 'embed';
  }

  static clone(node: EmbedNode): EmbedNode {
    return new EmbedNode(
      node.__embedType,
      node.__source,
      node.__width,
      node.__maxWidth,

      node.__aspectRatio,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedEmbedNode): EmbedNode {
    const { embedType, source, width, maxWidth, aspectRatio } = serializedNode;
    const node = $createEmbedNode({
      embedType,
      source,
      width,
      maxWidth,
      aspectRatio,
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
    source: string,
    width?: string | null | undefined,
    maxWidth?: string | null | undefined,
    aspectRatio?: string | null | undefined,
    key?: NodeKey
  ) {
    super(key);
    this.__embedType = embedType;
    this.__source = source;
    this.__width = width;
    this.__maxWidth = maxWidth;
    this.__aspectRatio = aspectRatio;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    if (this.__width) {
      element.setAttribute('width', this.__width);
    }
    if (this.__maxWidth) {
      element.setAttribute('maxWidth', this.__maxWidth);
    }
    if (this.__aspectRatio) {
      element.setAttribute('aspectRatio', this.__aspectRatio);
    }
    element.innerHTML = this.__source;

    return { element };
  }

  exportJSON(): SerializedEmbedNode {
    return {
      embedType: this.__embedType,
      source: this.__source,
      width: this.__width,
      maxWidth: this.__maxWidth,
      aspectRatio: this.__aspectRatio,
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

  getSource(): string {
    return this.__source;
  }

  setSource(source: string): void {
    const writable = this.getWritable();
    writable.__source = source;
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

  getAspectRatio(): string | null | undefined {
    return this.__aspectRatio;
  }

  setAspectRatio(aspectRatio: string | null | undefined): void {
    const writable = this.getWritable();
    writable.__aspectRatio = aspectRatio;
  }

  update(payload: UpdateEmbedPayload): void {
    const writable = this.getWritable();
    const { embedType, source, width, maxWidth, aspectRatio } = payload;
    if (embedType !== undefined) {
      writable.__embedType = embedType;
    }
    if (source !== undefined) {
      writable.__source = source;
    }
    if (width !== undefined) {
      writable.__width = width;
    }
    if (maxWidth !== undefined) {
      writable.__maxWidth = maxWidth;
    }
    if (aspectRatio !== undefined) {
      writable.__aspectRatio = aspectRatio;
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
    if (this.__aspectRatio) {
      div.style.aspectRatio = this.__aspectRatio;
    }
    div.dataset.embedType = this.__embedType;
    return div;
  }

  updateDOM(
    prevNode: EmbedNode,
    dom: HTMLElement,
    _config: EditorConfig
  ): false {
    const width = this.__width;
    const maxWidth = this.__maxWidth;
    const aspectRatio = this.__aspectRatio;
    if (width && width !== prevNode.__width) {
      dom.style.width = width;
    }
    if (maxWidth && maxWidth !== prevNode.__maxWidth) {
      dom.style.maxWidth = maxWidth;
    }
    if (aspectRatio && aspectRatio !== prevNode.__aspectRatio) {
      dom.style.aspectRatio = aspectRatio;
    }

    return false;
  }

  decorate(): JSX.Element {
    return (
      <EmbedComponent
        embedType={this.__embedType}
        source={this.__source}
        width={this.__width}
        maxWidth={this.__maxWidth}
        aspectRatio={this.__aspectRatio}
        nodeKey={this.getKey()}
        resizable={true}
      />
    );
  }
}

export function $createEmbedNode({
  embedType,
  source,
  width = null,
  maxWidth = null,
  aspectRatio,
  key,
}: EmbedPayload): EmbedNode {
  return $applyNodeReplacement(
    new EmbedNode(embedType, source, width, maxWidth, aspectRatio, key)
  );
}

export function $isEmbedNode(
  node: LexicalNode | null | undefined
): node is EmbedNode {
  return node instanceof EmbedNode;
}
