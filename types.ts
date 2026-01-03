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

export type AIProvider = 'openai' | 'gemini';

export interface ApiConfig {
  provider: AIProvider;
  openai: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  gemini: {
    apiKey: string;
  };
}
