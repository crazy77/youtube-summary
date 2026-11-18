# 스토어 등록 정보 (v2.0.0)

크롬 웹스토어와 웨일 스토어에 같은 zip(`pnpm zip` → `.output/youtube-summary-<버전>-chrome.zip`)을 올립니다. 기존 "YouTube AI Search" 등록 항목에 **업데이트로** 올리면 기존 사용자가 그대로 새 버전을 받습니다 (매니페스트 버전 2.0.0 > 기존 1.22).

## 이름
YouTube AI Search

## 요약 (132자 이하)
- ko: 유튜브 영상 제목 옆 버튼이나 우클릭 한 번으로 영상을 Gemini에 보내 바로 요약받으세요.
- en: Send any YouTube video to Gemini with one click from its title or the right-click menu, and get a summary instantly.

## 상세 설명 (ko)
유튜브를 보다가 "이 영상 무슨 내용이지?" 싶을 때, 클릭 한 번으로 Gemini에게 물어보세요.

■ 이렇게 써요
• 홈, 검색 결과, 추천 목록, 채널, 쇼츠의 영상 제목 옆 ✦ 버튼 클릭
• 썸네일이나 제목 위에서 우클릭 → "이 영상을 Gemini로 보내기"
• 영상을 보는 중에는 툴바 아이콘 클릭

Gemini가 새 탭에서 열리고, 영상 주소와 프롬프트가 자동으로 입력·전송됩니다.

■ 프롬프트는 내 마음대로
기본 문구는 "다음 유튜브 영상의 핵심 내용을 정리해줘."입니다. 확장 프로그램 옵션에서 "3줄 요약해줘", "영어 표현만 뽑아줘"처럼 원하는 문구로 바꿀 수 있어요.

■ 개인정보
개인정보를 수집하지 않으며, 개발자 서버로 아무것도 전송하지 않습니다. 영상 주소와 프롬프트는 버튼을 눌렀을 때 내 Gemini 계정으로만 전달됩니다.

※ Gemini(gemini.google.com)에 로그인되어 있어야 합니다.

■ v2.0.0 변경 사항
• 새로 만든 구조로 Gemini 자동 입력·전송 안정화
• 썸네일 우클릭 메뉴 추가
• 프롬프트 설정 화면 추가
• Perplexity 버튼 제거

## 상세 설명 (en)
Wondering what a YouTube video is about? Ask Gemini in one click.

■ How to use
• Click the ✦ button next to any video title on Home, Search, recommendations, channels and Shorts
• Right-click a thumbnail or title → "Send this video to Gemini"
• While watching, click the toolbar icon

Gemini opens in a new tab with the video link and your prompt typed in and sent.

■ Your prompt, your way
The default prompt asks Gemini to summarize the key points. Change it on the options page to anything you like.

■ Privacy
No personal data is collected and nothing is sent to the developer. The video link and prompt go only to your own Gemini account when you click.

※ Requires being signed in to Gemini (gemini.google.com).

## 카테고리
도구 / Tools (크롬: "생산성 > 도구")

## 언어
한국어(기본), 영어

## 개인정보처리방침 URL
GitHub Pages가 `docs/` 폴더로 켜져 있다면: https://crazy77.github.io/youtube-summary/privacy-policy.html

## 권한 근거
[PERMISSIONS_JUSTIFICATION.md](./PERMISSIONS_JUSTIFICATION.md) 내용을 "개인정보 보호 관행" 탭에 붙여넣습니다.

## 이미지
- 아이콘 128×128: `public/icon/128.png`
- 스크린샷 1280×800: 검색 결과의 제목 옆 버튼 화면 (프로젝트 파일 `store-assets/screenshot-1-search.png`)
- 추가 권장: Gemini가 요약 중인 화면 1장 (로그인이 필요해 직접 캡처)
