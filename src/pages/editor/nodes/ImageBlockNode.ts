import type { EditorConfig, ElementFormatType, LexicalEditor } from 'lexical';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
} from 'lexical';
import type { SerializedElementNode } from 'lexical';
import type { RangeSelection } from 'lexical';
import {
  ElementNode,
  isHTMLElement,
  $applyNodeReplacement,
  $isTextNode,
} from 'lexical';

function convertImageBlockElement(element: HTMLElement): DOMConversionOutput {
  const node = $createImageBlockNode();
  if (element.style) {
    node.setFormat(element.style.textAlign as ElementFormatType);
    const indent = parseInt(element.style.textIndent, 10) / 20;
    if (indent > 0) {
      node.setIndent(indent);
    }
  }
  return { node };
}

export type SerializedImageBlockNode = SerializedElementNode;

export class ImageBlockNode extends ElementNode {
  static getType(): string {
    return 'image-block';
  }
  static clone(node: ImageBlockNode): ImageBlockNode {
    return new ImageBlockNode(node.__key);
  }
  // View
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('p');
    const className = config.theme.imageBlock;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(_prevNode: ImageBlockNode, _dom: HTMLElement): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      p: () => ({
        conversion: convertImageBlockElement,
        priority: 0,
      }),
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);

    if (element && isHTMLElement(element)) {
      const formatType = this.getFormatType();
      element.style.textAlign = formatType;

      const direction = this.getDirection();
      if (direction) {
        element.dir = direction;
      }
      const indent = this.getIndent();
      if (indent > 0) {
        // padding-inline-start is not widely supported in email HTML, but
        // Lexical Reconciler uses padding-inline-start. Using text-indent instead.
        element.style.textIndent = `${indent * 20}px`;
      }
    }

    return {
      element,
    };
  }

  static importJSON(serializedNode: SerializedImageBlockNode): ImageBlockNode {
    const node = $createImageBlockNode();
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedImageBlockNode {
    return {
      ...super.exportJSON(),
      type: 'image-block',
      version: 1,
    };
  }

  insertNewAfter(_: RangeSelection, restoreSelection: boolean): ImageBlockNode {
    const newElement = $createImageBlockNode();
    const direction = this.getDirection();
    newElement.setDirection(direction);
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

export function $createImageBlockNode(): ImageBlockNode {
  return $applyNodeReplacement(new ImageBlockNode());
}
export function $isImageBlockNode(
  node: LexicalNode | null | undefined
): node is ImageBlockNode {
  return node instanceof ImageBlockNode;
}
