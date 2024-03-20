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

export type Alignment = 'left' | 'right' | 'center' | undefined;

function convertEmbedBlockElement(element: HTMLElement): DOMConversionOutput {
  const node = $createEmbedBlockNode();
  if (element.style) {
    node.setAlignment(element.style.justifyContent as Alignment);
  }
  return { node };
}

export type SerializedEmbedBlockNode = Spread<
  {
    alignment?: Alignment;
  },
  SerializedParagraphNode
>;

export class EmbedBlockNode extends ElementNode {
  __alignment: Alignment = 'center';

  static getType(): string {
    return 'embed-block';
  }
  static clone(node: EmbedBlockNode): EmbedBlockNode {
    return new EmbedBlockNode(node.__alignment, node.__key);
  }

  constructor(alignment?: Alignment, key?: NodeKey) {
    super(key);
    if (alignment) {
      this.__alignment = alignment;
    } else {
      this.__alignment = 'center';
    }
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('p');
    const className = config.theme.embedBlock!.base;
    if (className !== undefined) {
      span.className = className;
    }
    if (this.__alignment) {
      span.style.justifyContent = this.__alignment;
    }
    return span;
  }

  updateDOM(
    prevNode: EmbedBlockNode,
    dom: HTMLElement,
    _config: EditorConfig
  ): boolean {
    const alignment = this.__alignment;
    if (alignment && alignment !== prevNode.__alignment) {
      // Update the justify-content
      dom.style.justifyContent = alignment;
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      p: () => ({
        conversion: convertEmbedBlockElement,
        priority: 0,
      }),
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);

    if (element && isHTMLElement(element)) {
      const alignment = this.getAlignment();
      if (alignment) {
        element.style.justifyContent = alignment;
      }
    }

    return {
      element,
    };
  }

  static importJSON(serializedNode: SerializedEmbedBlockNode): EmbedBlockNode {
    const node = $createEmbedBlockNode();
    node.setAlignment(serializedNode.alignment);
    return node;
  }

  exportJSON(): SerializedEmbedBlockNode {
    return {
      ...super.exportJSON(),
      alignment: this.__alignment,
      type: 'embed-block',
      version: 1,
    };
  }

  getAlignment(): Alignment {
    return this.__alignment;
  }

  setAlignment(alignment: Alignment): void {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  insertNewAfter(_: RangeSelection, restoreSelection: boolean): EmbedBlockNode {
    const newElement = $createEmbedBlockNode();
    const alignment = this.getAlignment();
    newElement.setAlignment(alignment);
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

export function $createEmbedBlockNode(): EmbedBlockNode {
  return $applyNodeReplacement(new EmbedBlockNode());
}
export function $isEmbedBlockNode(
  node: LexicalNode | null | undefined
): node is EmbedBlockNode {
  return node instanceof EmbedBlockNode;
}
