import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';

import { EDITOR_TRANSFORMERS } from '../MarkdownTransformers';

export default function MarkdownPlugin(): JSX.Element {
  return <MarkdownShortcutPlugin transformers={EDITOR_TRANSFORMERS} />;
}
