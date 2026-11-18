/** 프롬프트 안에서 영상 주소로 바뀌는 자리 표시자 */
export const URL_PLACEHOLDER = '{url}';

export const DEFAULT_PROMPT_TEMPLATE = '다음 유튜브 영상의 핵심 내용을 정리해줘.\n{url}';

const KEY = 'promptTemplate';

export async function getPromptTemplate(): Promise<string> {
  const stored = await browser.storage.sync.get(KEY);
  const value = stored[KEY];
  return typeof value === 'string' && value.trim() ? value : DEFAULT_PROMPT_TEMPLATE;
}

export async function setPromptTemplate(template: string): Promise<void> {
  if (!template.trim() || template === DEFAULT_PROMPT_TEMPLATE) {
    await browser.storage.sync.remove(KEY);
  } else {
    await browser.storage.sync.set({ [KEY]: template });
  }
}

/** 템플릿에 {url}이 없으면 끝에 줄을 바꿔 붙인다 */
export function buildPrompt(template: string, url: string): string {
  return template.includes(URL_PLACEHOLDER)
    ? template.replaceAll(URL_PLACEHOLDER, url)
    : `${template.trimEnd()}\n${url}`;
}
