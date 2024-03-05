export const DEFAULT_SETTINGS = {
  disableBeforeInput: false,
  emptyEditor: false,
  isCollab: false,
  shouldUseLexicalContextMenu: false,
  showNestedEditorTreeView: false,
  showTreeView: false,
  tableCellBackgroundColor: true,
  tableCellMerge: true,
};

export type SettingName = keyof typeof DEFAULT_SETTINGS;

export type Settings = typeof DEFAULT_SETTINGS;
