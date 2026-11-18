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

- 썸네일 목록(홈, 검색, 추천, 채널, 쇼츠)의 영상 제목 왼쪽 Gemini 버튼 클릭
- 유튜브 썸네일이나 영상 제목 위에서 우클릭 → **이 영상을 Gemini로 보내기**
- 영상 재생 페이지에서 우클릭 또는 툴바 아이콘 클릭 → 지금 보는 영상을 보내기

## 프롬프트 설정

기본 프롬프트는 "다음 유튜브 영상의 핵심 내용을 정리해줘." + 영상 주소입니다. 확장 프로그램 아이콘 우클릭 → **옵션**에서 바꿀 수 있고, `{url}` 자리에 영상 주소가 들어갑니다.

## 배포

`pnpm zip`으로 만든 zip 하나를 크롬 웹스토어와 웨일 스토어에 모두 올립니다. 등록 문구, 권한 근거, 개인정보처리방침은 [STORE_LISTING.md](./STORE_LISTING.md), [PERMISSIONS_JUSTIFICATION.md](./PERMISSIONS_JUSTIFICATION.md), [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)에 있습니다.

## 구조

- `entrypoints/background.ts` — 우클릭 메뉴, 툴바 아이콘, Gemini 탭 열기
- `entrypoints/youtube.content/` — 썸네일 제목 옆 Gemini 버튼
- `entrypoints/gemini.content/` — Gemini 페이지에서 링크를 입력하고 전송
- `entrypoints/options/` — 프롬프트 설정 화면
- `utils/settings.ts` — 프롬프트 템플릿 저장·조합
- `utils/youtube.ts` — 영상 URL 정리 (재생목록·시간 파라미터 제거)
