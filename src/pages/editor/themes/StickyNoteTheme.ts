import type { EditorThemeClasses } from 'lexical';

import './StickyNoteTheme.css';

import baseTheme from './EditorTheme';

const theme: EditorThemeClasses = {
  ...baseTheme,
  paragraph: 'StickyNoteTheme__paragraph',
};

export default theme;
