import type { TakePendingPromptMessage } from '@/utils/messages';

const LOG = '[yt→gemini]';

/** Gemini 입력창 후보. 위에 있을수록 우선. (Gemini는 Quill 기반 contenteditable을 쓴다) */
const EDITOR_SELECTORS = [
  'rich-textarea .ql-editor[contenteditable="true"]',
  '.ql-editor[contenteditable="true"]',
  'div[contenteditable="true"][role="textbox"]',
  'rich-textarea [contenteditable="true"]',
];

/** 전송 버튼 후보 */
const SEND_BUTTON_SELECTORS = [
  'button.send-button',
  'button[aria-label="Send message"]',
  'button[aria-label="메시지 보내기"]',
  'button[aria-label*="Send"]',
  'button[aria-label*="보내기"]',
  'button[aria-label*="전송"]',
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isVisible(el: Element): el is HTMLElement {
  return el instanceof HTMLElement && el.getClientRects().length > 0;
}

/** 조건을 만족하는 값이 나올 때까지 DOM 변화를 지켜본다 */
function waitFor<T>(find: () => T | null, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const hit = find();
    if (hit) return resolve(hit);

    const observer = new MutationObserver(() => {
      const found = find();
      if (found) done(found);
    });
    const timer = setTimeout(() => done(find()), timeoutMs);
    // 속성 변화(disabled 해제 등)도 잡기 위해 attributes 포함
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled', 'class'],
    });

    function done(value: T | null) {
      observer.disconnect();
      clearTimeout(timer);
      resolve(value);
    }
  });
}

function findEditor(): HTMLElement | null {
  for (const sel of EDITOR_SELECTORS) {
    const el = Array.from(document.querySelectorAll(sel)).find(isVisible);
    if (el) return el;
  }
  return null;
}

function findEnabledSendButton(): HTMLButtonElement | null {
  for (const sel of SEND_BUTTON_SELECTORS) {
    const btn = Array.from(document.querySelectorAll<HTMLButtonElement>(sel)).find(
      (b) => isVisible(b) && !b.disabled && b.getAttribute('aria-disabled') !== 'true',
    );
    if (btn) return btn;
  }
  return null;
}

/** 줄바꿈·공백 차이는 무시하고 비교 (에디터는 줄마다 <p>로 나눈다) */
const squash = (s: string) => s.replace(/\s+/g, '');
const hasText = (editor: HTMLElement, text: string) =>
  squash(editor.innerText || editor.textContent || '').includes(squash(text));

/**
 * 에디터에 텍스트를 넣는다. 에디터가 실제 사용자 입력처럼 인식하도록
 * insertText → paste 이벤트 → 직접 DOM 수정 순서로 시도한다.
 */
async function insertText(editor: HTMLElement, text: string) {
  editor.focus();
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // 1) execCommand: deprecated지만 contenteditable 에디터가 가장 잘 알아듣는 방법
  document.execCommand('insertText', false, text);
  await sleep(50);
  if (hasText(editor, text)) return;

  // 2) 붙여넣기 이벤트
  const data = new DataTransfer();
  data.setData('text/plain', text);
  editor.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
  );
  await sleep(50);
  if (hasText(editor, text)) return;

  // 3) 최후 수단: DOM 직접 수정 후 input 이벤트
  editor.replaceChildren(
    ...text.split('\n').map((line) => {
      const p = document.createElement('p');
      if (line) p.textContent = line;
      else p.append(document.createElement('br'));
      return p;
    }),
  );
  editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
}

function pressEnter(editor: HTMLElement) {
  const init: KeyboardEventInit = {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  };
  editor.dispatchEvent(new KeyboardEvent('keydown', init));
  editor.dispatchEvent(new KeyboardEvent('keyup', init));
}

/** 백그라운드에 이 탭용 프롬프트가 있는지 묻는다. 탭 생성 직후 경합을 고려해 몇 번 재시도. */
async function takePendingPrompt(): Promise<string | null> {
  const message: TakePendingPromptMessage = { type: 'take-pending-prompt' };
  for (let i = 0; i < 5; i++) {
    const prompt = (await browser.runtime.sendMessage(message)) as string | null;
    if (prompt) return prompt;
    await sleep(300);
  }
  return null;
}

export default defineContentScript({
  matches: ['https://gemini.google.com/*'],
  runAt: 'document_idle',

  async main() {
    const prompt = await takePendingPrompt();
    if (!prompt) return;
    console.info(LOG, '프롬프트 수신:', prompt);

    // 로그인 확인·초기 로딩이 느릴 수 있어 넉넉히 기다린다
    const editor = await waitFor(findEditor, 20_000);
    if (!editor) {
      console.warn(LOG, '입력창을 찾지 못함 (로그인 필요하거나 화면 구조가 바뀜)');
      return;
    }

    await insertText(editor, prompt);

    const sendButton = await waitFor(findEnabledSendButton, 5_000);
    if (sendButton) {
      sendButton.click();
      console.info(LOG, '전송 버튼 클릭');
    } else {
      console.warn(LOG, '전송 버튼을 찾지 못해 Enter로 전송 시도');
      pressEnter(editor);
    }
  },
});
