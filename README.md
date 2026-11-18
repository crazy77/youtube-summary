# YouTube AI Search (YouTube → Gemini)

유튜브 영상 링크를 클릭 한 번으로 Gemini에 보내고, 자동으로 입력·전송하는 크롬/웨일 확장 프로그램입니다.

## 개발

```bash
pnpm install
pnpm dev      # 개발 모드 (크롬 자동 실행 + 핫 리로드)
pnpm build    # .output/chrome-mv3 에 빌드
pnpm zip      # 스토어 업로드용 zip
pnpm compile  # 타입 체크
```

## 직접 설치해서 테스트하기

1. `pnpm build`
2. 크롬 `chrome://extensions` (웨일은 `whale://extensions`) 에서 개발자 모드 켜기
3. "압축해제된 확장 프로그램을 로드합니다" → `.output/chrome-mv3` 폴더 선택
4. Gemini(gemini.google.com)에 로그인되어 있어야 합니다.

## 사용법

- 유튜브 썸네일이나 영상 제목 위에서 우클릭 → **이 영상을 Gemini로 보내기**
- 영상 재생 페이지에서 우클릭 또는 툴바 아이콘 클릭 → 지금 보는 영상을 보내기

## 구조

- `entrypoints/background.ts` — 우클릭 메뉴, 툴바 아이콘, Gemini 탭 열기
- `entrypoints/gemini.content/` — Gemini 페이지에서 링크를 입력하고 전송
- `utils/youtube.ts` — 영상 URL 정리 (재생목록·시간 파라미터 제거)
