import { DEFAULT_PROMPT_TEMPLATE, getPromptTemplate, setPromptTemplate } from '@/utils/settings';

const textarea = document.querySelector<HTMLTextAreaElement>('#template')!;
const status = document.querySelector<HTMLSpanElement>('#status')!;

function flash(message: string) {
  status.textContent = message;
  setTimeout(() => (status.textContent = ''), 1500);
}

textarea.value = await getPromptTemplate();

document.querySelector('#save')!.addEventListener('click', async () => {
  await setPromptTemplate(textarea.value);
  textarea.value = await getPromptTemplate();
  flash('저장했어요');
});

document.querySelector('#reset')!.addEventListener('click', async () => {
  textarea.value = DEFAULT_PROMPT_TEMPLATE;
  await setPromptTemplate(DEFAULT_PROMPT_TEMPLATE);
  flash('기본값으로 되돌렸어요');
});
