import { LexicalComposer } from '@lexical/react/LexicalComposer';
import Editor from './pages/editor/Editor';
import PlaygroundNodes from './pages/editor/nodes/PlaygroundNodes';
import { TableContext } from './pages/editor/plugins/TablePlugin';
import PlaygroundEditorTheme from './pages/editor/themes/PlaygroundEditorTheme';

const App = (): JSX.Element => {
  const initialConfig = {
    editorState: undefined,
    namespace: 'Playground',
    nodes: [...PlaygroundNodes],
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <TableContext>
        <div className='editor-shell'>
          <Editor />
        </div>
      </TableContext>
    </LexicalComposer>
  );
};

export default App;
