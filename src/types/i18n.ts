export type LocalizedString = Record<string, string | undefined>;

// Backward-compatible: allow legacy `string` values in data files.
export type LocalizedText = string | LocalizedString;

