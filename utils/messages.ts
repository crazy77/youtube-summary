/** 유튜브 페이지 → 백그라운드: 이 영상을 Gemini로 보내기 */
export interface SendToGeminiMessage {
  type: 'send-to-gemini';
  url: string;
}

/** Gemini 페이지 → 백그라운드: 이 탭에 넣을 프롬프트가 있으면 꺼내주기 (한 번만) */
export interface TakePendingPromptMessage {
  type: 'take-pending-prompt';
}

export type ExtensionMessage = SendToGeminiMessage | TakePendingPromptMessage;

export const GEMINI_APP_URL = 'https://gemini.google.com/app';

export const pendingPromptKey = (tabId: number) => `pending-prompt:${tabId}`;
