// import {$getRoot, $getSelection} from 'lexical';
import { useState } from 'react';

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $generateHtmlFromNodes } from '@lexical/html';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

import ExampleTheme from './ExampleTheme';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import { EditorState } from 'lexical';

const Placeholder = () => {
  return <div className='editor-placeholder'>Enter some rich text...</div>;
};

const editorConfig = {
  namespace: 'React.js Demo',
  nodes: [],
  // Handling of errors during update
  onError(error: Error) {
    throw error;
  },
  // The editor theme
  theme: ExampleTheme,
};

// @ts-expect-error 'leave here as reference for later use'
// eslint-disable-next-line
const HtmlPlugin = (): JSX.Element => {
  const [editor] = useLexicalComposerContext();
  const onClick = (): void => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      console.log(htmlString);
      console.log(typeof htmlString);
    });
  };
  return <button onClick={onClick}>HTML</button>;
};

const Editor = () => {
  // eslint-disable-next-line
  const [_editorState, setEditorState] = useState<EditorState>();

  const onChange = (newEditorState: EditorState) => {
    // const editorStateJSON = newEditorState.toJSON();
    setEditorState(newEditorState);
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className='editor-container'>
        <ToolbarPlugin />
        <div className='editor-inner'>
          <RichTextPlugin
            contentEditable={<ContentEditable className='editor-input' />}
            placeholder={Placeholder}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <OnChangePlugin onChange={onChange} />
        </div>
      </div>
    </LexicalComposer>
  );
};

export default Editor;
