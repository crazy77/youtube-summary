# 권한 사용 근거 / Permission justification (Chrome 웹스토어 "개인정보 보호 관행" 탭에 붙여넣기)

## 단일 목적 / Single purpose
유튜브 영상을 클릭 한 번으로 Gemini에 보내 요약·질문할 수 있게 합니다.
Send a YouTube video to Gemini in one click so the user can get a summary or ask about it.

## contextMenus
유튜브 영상 링크(썸네일, 제목)와 영상 페이지에서 우클릭했을 때 "이 영상을 Gemini로 보내기" 메뉴를 보여주기 위해 사용합니다.
Adds a "Send this video to Gemini" item when right-clicking a YouTube video link or video page.

## storage
사용자가 옵션 화면에서 바꾼 프롬프트 문구를 저장하고(storage.sync), 버튼을 누른 뒤 Gemini 탭에 입력될 때까지 프롬프트를 잠깐 보관합니다(storage.session).
Stores the user's prompt template (storage.sync) and briefly holds the pending prompt until it is typed into the Gemini tab (storage.session).

## 호스트 권한 / Host permissions
- `*://*.youtube.com/*`: 썸네일 목록의 영상 제목 옆에 Gemini 버튼을 표시하고, 누른 영상의 주소를 읽습니다. / Shows the Gemini button next to video titles and reads the clicked video's URL.
- `https://gemini.google.com/*`: 사용자가 연 Gemini 탭의 입력창에 프롬프트를 넣고 전송 버튼을 누릅니다. / Types the prompt into the Gemini tab the user opened and presses send.

## 원격 코드 / Remote code
사용하지 않습니다. 모든 코드는 패키지에 포함되어 있습니다. / No remote code; all code ships in the package.

## 데이터 사용 / Data usage
개인정보를 수집하거나 전송하지 않습니다. 웹스토어 데이터 사용 항목은 모두 "수집하지 않음"에 해당합니다.
No user data is collected or transmitted. All data-usage categories in the dashboard are "not collected".
