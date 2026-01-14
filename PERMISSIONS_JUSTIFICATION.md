# Chrome Extension Permissions Justification
## YouTube AI Search Extension

### 한국어 (Korean)

#### 1. Storage Permission (스토리지 권한)
**사용 권한:** `storage`

**사용 근거:**
- **사용자 설정 저장**: 사용자가 옵션 페이지에서 설정한 다음 정보들을 저장하기 위해 필요합니다:
- Perplexity 검색 버튼 활성화/비활성화 설정
  - Gemini 검색 버튼 활성화/비활성화 설정  
  - Gemini에서 사용할 사용자 정의 프롬프트 텍스트
  - 사용자가 선택한 확장 프로그램 언어 설정

- **크로스 페이지 데이터 전달**: YouTube 페이지에서 Gemini 페이지로 영상 정보와 프롬프트를 안전하게 전달하기 위해 임시 저장소로 사용됩니다.

- **설정 동기화**: chrome.storage.sync를 통해 사용자가 여러 기기에서 동일한 설정을 사용할 수 있도록 지원합니다.

**개인정보 처리:** 저장되는 모든 데이터는 사용자가 직접 입력한 설정값이며, 개인정보나 민감한 정보는 수집하지 않습니다.

#### 2. Host Permissions (호스트 권한)
**사용 권한:** 
- `https://www.youtube.com/*`
- `https://m.youtube.com/*`  
- `https://gemini.google.com/*`

**사용 근거:**

**YouTube 도메인 (`youtube.com`):**
- **버튼 삽입**: YouTube 동영상 페이지에서 영상 제목 및 추천 영상 목록에 AI 검색 버튼을 삽입하기 위해 필요합니다.
- **DOM 조작**: YouTube의 SPA(Single Page Application) 구조에서 동적으로 로드되는 콘텐츠를 감지하고 버튼을 추가하기 위해 페이지 DOM에 접근이 필요합니다.
- **URL 추출**: 각 영상의 URL을 추출하여 AI 검색 서비스에 전달하기 위해 필요합니다.

**Gemini 도메인 (`gemini.google.com`):**
- **자동 입력 기능**: 사용자가 Gemini 버튼을 클릭했을 때, Gemini 페이지에서 자동으로 프롬프트를 입력하고 전송하는 기능을 제공하기 위해 필요합니다.
- **사용자 편의성**: 수동으로 복사-붙여넣기 할 필요 없이 원클릭으로 영상 분석을 요청할 수 있는 seamless한 사용자 경험을 제공합니다.

**보안 및 개인정보:**
- 웹페이지의 내용을 읽거나 수정하지 않습니다
- 사용자의 개인정보나 브라우징 히스토리에 접근하지 않습니다
- 오직 AI 검색 버튼 추가와 자동 입력 기능만을 위해 사용됩니다

---

### English

#### 1. Storage Permission
**Permission:** `storage`

**Justification:**
- **User Settings Storage**: Required to save user preferences configured in the options page:
- Enable/disable settings for Perplexity search button
  - Enable/disable settings for Gemini search button
  - Custom prompt text for Gemini service
  - User-selected extension language preference

- **Cross-page Data Transfer**: Used as temporary storage to securely transfer video information and prompts from YouTube pages to Gemini pages.

- **Settings Synchronization**: Supports chrome.storage.sync to allow users to maintain consistent settings across multiple devices.

**Privacy Handling:** All stored data consists only of user-configured settings. No personal information or sensitive data is collected.

#### 2. Host Permissions
**Permissions:** 
- `https://www.youtube.com/*`
- `https://m.youtube.com/*`  
- `https://gemini.google.com/*`

**Justification:**

**YouTube Domains (`youtube.com`):**
- **Button Insertion**: Required to insert AI search buttons on YouTube video pages, including video titles and recommended video lists.
- **DOM Manipulation**: Necessary to access page DOM for detecting dynamically loaded content in YouTube's SPA (Single Page Application) structure and adding buttons accordingly.
- **URL Extraction**: Needed to extract video URLs for passing to AI search services.

**Gemini Domain (`gemini.google.com`):**
- **Auto-input Functionality**: Required to automatically input prompts and submit them on Gemini pages when users click the Gemini button.
- **User Convenience**: Provides seamless user experience allowing one-click video analysis requests without manual copy-paste operations.

**Security and Privacy:**
- Does not read or modify webpage content beyond the intended functionality
- Does not access user's personal information or browsing history
- Used solely for AI search button insertion and auto-input functionality

---

### Technical Implementation Details

#### Storage Usage Patterns:
```javascript
// Settings storage
chrome.storage.sync.set({
  enableFelo: boolean,
  enableGemini: boolean, 
  geminiPrompt: string,
  userSelectedLanguage: string
});

// Temporary data transfer
chrome.storage.local.set({
  geminiPrompt: string // Temporary prompt for auto-input
});
```

#### Host Permission Usage:
- **Content Scripts**: Injected only on specified YouTube and Gemini domains
- **Scope**: Limited to adding UI elements and automating user-initiated actions
- **Data Flow**: Unidirectional - only sends user-specified prompts to AI services

#### Compliance:
- Follows Chrome Web Store Developer Program Policies
- Implements minimal permissions principle
- Transparent about data usage in privacy policy
- No background data collection or tracking 