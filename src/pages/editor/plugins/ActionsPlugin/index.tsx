import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { exportFile, importFile } from '@lexical/file';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { $createTextNode, $getRoot } from 'lexical';
import { useCallback } from 'react';

import { PLAYGROUND_TRANSFORMERS } from '../MarkdownTransformers';

export default function ActionsPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const handleMarkdownToggle = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      if ($isCodeNode(firstChild) && firstChild.getLanguage() === 'markdown') {
        $convertFromMarkdownString(
          firstChild.getTextContent(),
          PLAYGROUND_TRANSFORMERS
        );
      } else {
        const markdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
        root
          .clear()
          .append(
            $createCodeNode('markdown').append($createTextNode(markdown))
          );
      }
      root.selectEnd();
    });
  }, [editor]);

  return (
    <div className='actions'>
      <button
        className='action-button import'
        onClick={() => importFile(editor)}
        title='Import'
        aria-label='Import editor state from JSON'
      >
        <i className='import' />
      </button>
      <button
        className='action-button export'
        onClick={() =>
          exportFile(editor, {
            fileName: `Playground ${new Date().toISOString()}`,
            source: 'Playground',
          })
        }
        title='Export'
        aria-label='Export editor state to JSON'
      >
        <i className='export' />
      </button>
      <button
        className='action-button'
        onClick={handleMarkdownToggle}
        title='Convert From Markdown'
        aria-label='Convert from markdown'
      >
        <i className='markdown' />
      </button>
    </div>
  );
}
