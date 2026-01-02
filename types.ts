
export interface DiagramTemplate {
  id: string;
  name: string;
  code: string;
  icon: string;
}

export enum EditorTheme {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  code: string;
  name: string;
}
