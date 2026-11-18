const VIDEO_ID = /^[\w-]{11}$/;

/**
 * 유튜브 영상 URL을 Gemini에 보내기 좋은 형태로 정리한다.
 * 재생목록, 시작 시간 같은 부가 파라미터는 버리고 영상 주소만 남긴다.
 * 영상 URL이 아니면 null.
 */
export function toCanonicalVideoUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw, 'https://www.youtube.com');
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m|music)\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0] ?? '';
    return VIDEO_ID.test(id) ? `https://www.youtube.com/watch?v=${id}` : null;
  }

  if (host !== 'youtube.com') return null;

  if (url.pathname === '/watch') {
    const id = url.searchParams.get('v') ?? '';
    return VIDEO_ID.test(id) ? `https://www.youtube.com/watch?v=${id}` : null;
  }

  const shorts = url.pathname.match(/^\/(shorts|live|embed)\/([\w-]{11})/);
  if (shorts) {
    const [, kind, id] = shorts;
    return kind === 'shorts'
      ? `https://www.youtube.com/shorts/${id}`
      : `https://www.youtube.com/watch?v=${id}`;
  }

  return null;
}

/** contextMenus의 targetUrlPatterns / documentUrlPatterns 용 */
export const YOUTUBE_VIDEO_URL_PATTERNS = [
  '*://*.youtube.com/watch*',
  '*://*.youtube.com/shorts/*',
  '*://*.youtube.com/live/*',
  '*://youtu.be/*',
];
