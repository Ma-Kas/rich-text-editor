import { LexicalComposer } from '@lexical/react/LexicalComposer';
import Editor from './pages/editor/Editor';
import EditorNodes from './pages/editor/nodes/EditorNodes';
import { TableContext } from './pages/editor/plugins/TablePlugin';
import EditorTheme from './pages/editor/themes/EditorTheme';

const App = (): JSX.Element => {
  const initialConfig = {
    editorState: undefined,
    namespace: 'Editor',
    nodes: [...EditorNodes],
    onError: (error: Error) => {
      throw error;
    },
    theme: EditorTheme,
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
