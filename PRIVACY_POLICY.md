# 개인정보처리방침 / Privacy Policy — YouTube AI Search

**시행일 / Effective date:** 2026-11-19 (v2.0.0)

## 한국어

**YouTube AI Search는 개인정보를 수집하지 않습니다.** 개발자가 운영하는 서버가 없으며, 어떤 데이터도 개발자에게 전송되지 않습니다.

### 저장하는 정보
- **프롬프트 템플릿**: 옵션 화면에서 직접 바꾼 경우에만 `chrome.storage.sync`에 저장됩니다. 브라우저 계정 동기화가 켜져 있으면 브라우저 제공자(Google/네이버)의 동기화 기능으로 내 다른 기기에 복사됩니다.
- **전송 대기 중인 프롬프트**: 버튼을 누른 순간부터 Gemini 탭에 입력될 때까지 `chrome.storage.session`(메모리)에 잠깐 보관되고, 입력 직후 또는 탭을 닫으면 삭제됩니다.

### 페이지 접근
- **youtube.com**: 영상 제목 옆에 버튼을 표시하고, 누른 영상의 주소를 읽기 위해서만 사용합니다. 시청 기록, 계정 정보, 댓글 등은 읽지 않습니다.
- **gemini.google.com**: 사용자가 버튼을 눌러 연 Gemini 탭에 프롬프트(설정한 문구 + 영상 주소)를 입력하고 전송하기 위해서만 사용합니다. 대화 내용은 읽지 않습니다.

### 제3자 제공
없습니다. 프롬프트는 사용자가 버튼을 누를 때 사용자의 Gemini 계정으로 직접 전송되며, 이후 처리는 [Google 개인정보처리방침](https://policies.google.com/privacy)을 따릅니다. 광고, 분석, 추적 도구를 사용하지 않습니다.

### 삭제
확장 프로그램을 제거하면 저장된 설정이 모두 삭제됩니다. 옵션 화면의 "기본값으로"를 눌러도 저장된 프롬프트가 지워집니다.

### 문의
[GitHub Issues](https://github.com/crazy77/youtube-summary/issues)

## English

**YouTube AI Search does not collect personal data.** There is no developer-operated server, and no data is ever sent to the developer.

### What is stored
- **Prompt template**: saved in `chrome.storage.sync` only if you change it on the options page. If browser sync is on, your browser vendor's sync copies it to your other devices.
- **Pending prompt**: held in `chrome.storage.session` (memory) from the moment you click until it is typed into the Gemini tab, then deleted immediately or when the tab closes.

### Page access
- **youtube.com**: only to show the button next to video titles and read the address of the video you clicked. Watch history, account data and comments are not read.
- **gemini.google.com**: only to type and send the prompt (your template + the video address) in the Gemini tab you opened with the button. Conversations are not read.

### Sharing
None. The prompt is sent from your own Gemini account when you click, and is then handled under [Google's Privacy Policy](https://policies.google.com/privacy). No ads, analytics or tracking.

### Deletion
Uninstalling the extension removes all stored settings. "Reset to default" on the options page also clears the saved prompt.

### Contact
[GitHub Issues](https://github.com/crazy77/youtube-summary/issues)
