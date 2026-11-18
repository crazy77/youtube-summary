import {
  GEMINI_APP_URL,
  pendingPromptKey,
  type ExtensionMessage,
} from '@/utils/messages';
import { buildPrompt, getPromptTemplate } from '@/utils/settings';
import { YOUTUBE_VIDEO_URL_PATTERNS, toCanonicalVideoUrl } from '@/utils/youtube';

const MENU_LINK = 'send-link-to-gemini';
const MENU_PAGE = 'send-page-to-gemini';

/**
 * Gemini 탭을 새로 열고, 그 탭에서 넣을 프롬프트를 session storage에 맡겨 둔다.
 * Gemini 페이지의 content script가 로드되면 이 값을 꺼내 입력하고 전송한다.
 */
async function sendToGemini(rawUrl: string | undefined, sourceTab?: Browser.tabs.Tab) {
  const videoUrl = toCanonicalVideoUrl(rawUrl);
  if (!videoUrl) {
    console.warn('[yt→gemini] 유튜브 영상 URL이 아님:', rawUrl);
    return;
  }

  const tab = await browser.tabs.create({
    url: GEMINI_APP_URL,
    active: true,
    index: sourceTab?.index !== undefined ? sourceTab.index + 1 : undefined,
    openerTabId: sourceTab?.id,
  });
  if (tab.id === undefined) return;

  const prompt = buildPrompt(await getPromptTemplate(), videoUrl);
  await browser.storage.session.set({ [pendingPromptKey(tab.id)]: prompt });
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.removeAll(() => {
      // 썸네일·제목 등 영상 링크 위에서 우클릭
      browser.contextMenus.create({
        id: MENU_LINK,
        title: browser.i18n.getMessage('contextMenuTitle'),
        contexts: ['link'],
        targetUrlPatterns: YOUTUBE_VIDEO_URL_PATTERNS,
      });
      // 영상 재생 페이지의 빈 곳이나 플레이어 위에서 우클릭
      browser.contextMenus.create({
        id: MENU_PAGE,
        title: browser.i18n.getMessage('contextMenuPageTitle'),
        contexts: ['page', 'video'],
        documentUrlPatterns: YOUTUBE_VIDEO_URL_PATTERNS,
      });
    });
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_LINK) void sendToGemini(info.linkUrl, tab);
    if (info.menuItemId === MENU_PAGE) void sendToGemini(info.pageUrl ?? tab?.url, tab);
  });

  // 툴바 아이콘: 지금 보고 있는 영상을 보낸다
  browser.action.onClicked.addListener((tab) => {
    void sendToGemini(tab.url, tab);
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    void browser.storage.session.remove(pendingPromptKey(tabId));
  });

  browser.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === 'send-to-gemini') {
      void sendToGemini(message.url, sender.tab);
      return;
    }

    if (message.type === 'take-pending-prompt') {
      const tabId = sender.tab?.id;
      if (tabId === undefined) {
        sendResponse(null);
        return;
      }
      const key = pendingPromptKey(tabId);
      browser.storage.session.get(key).then(async (stored) => {
        const prompt = (stored[key] as string | undefined) ?? null;
        // 한 번 꺼내면 지운다. 새로고침해도 다시 전송되지 않게.
        if (prompt) await browser.storage.session.remove(key);
        sendResponse(prompt);
      });
      return true; // 비동기 응답
    }
  });
});
