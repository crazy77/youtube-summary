import './style.css';
import type { SendToGeminiMessage } from '@/utils/messages';
import { toCanonicalVideoUrl } from '@/utils/youtube';

/**
 * 썸네일 목록(홈, 검색 결과, 추천 목록, 채널, 쇼츠 선반 등)의 영상 제목 링크.
 * 유튜브는 목록 항목의 제목을 거의 항상 h3 안의 링크로 그린다.
 */
const TITLE_LINK_SELECTOR = 'h3 a[href], a#video-title[href], a#video-title-link[href]';

const BUTTON_CLASS = 'ytg-send-button';
const ROW_CLASS = 'ytg-title-row';

function createButton(iconUrl: string, label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = BUTTON_CLASS;
  button.title = label;
  button.setAttribute('aria-label', label);

  const icon = document.createElement('img');
  icon.src = iconUrl;
  icon.alt = '';
  button.append(icon);

  return button;
}

/** 제목 링크 하나에 버튼을 붙인다. 이미 붙어 있으면 아무것도 안 한다. */
function attach(link: HTMLAnchorElement, iconUrl: string, label: string) {
  const row = link.parentElement;
  if (!row) return;
  if (row.querySelector(`:scope > .${BUTTON_CLASS}`)) return;
  if (!toCanonicalVideoUrl(link.href)) return; // 채널, 재생목록 등은 제외

  row.classList.add(ROW_CLASS);
  row.insertBefore(createButton(iconUrl, label), link);
}

function scan(root: ParentNode, iconUrl: string, label: string) {
  root.querySelectorAll<HTMLAnchorElement>(TITLE_LINK_SELECTOR).forEach((link) => {
    attach(link, iconUrl, label);
  });
}

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  excludeMatches: ['*://music.youtube.com/*'],
  cssInjectionMode: 'manifest',

  main(ctx) {
    const iconUrl = browser.runtime.getURL('/gemini.svg');
    const label = browser.i18n.getMessage('sendButtonLabel') || 'Send to Gemini';

    // 클릭은 문서 한 곳에서 처리한다 (캡처 단계).
    // 유튜브는 카드 전체에 클릭 핸들러가 있어서 먼저 가로채야 영상이 열리지 않는다.
    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest?.(`.${BUTTON_CLASS}`);
      if (!(button instanceof HTMLButtonElement)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // 유튜브는 목록 항목 DOM을 재활용하므로, 클릭 시점의 옆 링크 주소를 읽는다
      const link = button.parentElement?.querySelector<HTMLAnchorElement>(':scope > a[href]');
      const url = toCanonicalVideoUrl(link?.href);
      if (!url) return;

      const message: SendToGeminiMessage = { type: 'send-to-gemini', url };
      browser.runtime.sendMessage(message).catch((error: unknown) => {
        // 확장을 업데이트·새로고침한 뒤 페이지를 새로고침하지 않으면 여기로 온다
        console.warn('[yt→gemini] 전송 실패. 페이지를 새로고침해 주세요.', error);
      });

      button.dataset.state = 'sent';
      setTimeout(() => delete button.dataset.state, 1200);
    };
    // 버튼 위에서 눌렀을 때 카드의 다른 핸들러(미리보기 재생 등)가 반응하지 않게
    const swallow = (event: Event) => {
      if ((event.target as Element | null)?.closest?.(`.${BUTTON_CLASS}`)) {
        event.stopPropagation();
      }
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('mousedown', swallow, true);
    document.addEventListener('pointerdown', swallow, true);

    // 무한 스크롤·페이지 전환으로 새로 생기는 항목을 감지. 한 프레임에 한 번만 훑는다.
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        scan(document, iconUrl, label);
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    scan(document, iconUrl, label);

    ctx.onInvalidated(() => {
      observer.disconnect();
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('mousedown', swallow, true);
      document.removeEventListener('pointerdown', swallow, true);
      document.querySelectorAll(`.${BUTTON_CLASS}`).forEach((el) => el.remove());
      document.querySelectorAll(`.${ROW_CLASS}`).forEach((el) => el.classList.remove(ROW_CLASS));
    });
  },
});
