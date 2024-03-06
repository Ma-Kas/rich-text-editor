export const DEFAULT_SETTINGS = {
  disableBeforeInput: false,
  tableCellBackgroundColor: true,
  tableCellMerge: true,
};

export type SettingName = keyof typeof DEFAULT_SETTINGS;

export type Settings = typeof DEFAULT_SETTINGS;
