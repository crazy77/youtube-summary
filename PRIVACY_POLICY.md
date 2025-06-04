# 개인정보처리방침 / Privacy Policy
## YouTube AI Search Extension

**시행일 / Effective Date:** 2024년 12월 19일 / December 19, 2024

---

## 한국어 버전

### 📋 요약
**YouTube AI Search 확장 프로그램은 개인정보를 수집하지 않습니다.** 사용자가 설정한 옵션 정보만을 브라우저 로컬에 저장하며, 외부로 전송하지 않습니다.

### 1. 개인정보 수집 및 이용

#### 1.1 수집하는 정보
본 확장 프로그램은 **개인정보를 수집하지 않습니다**. 다음 정보만을 로컬에 저장합니다:

- Felo/Gemini 버튼 활성화 설정 (true/false)
- Gemini 프롬프트 커스터마이징 텍스트
- 확장 프로그램 언어 설정

#### 1.2 정보 사용 목적
- 사용자 맞춤 버튼 표시
- 사용자 지정 프롬프트 저장
- 선호 언어로 확장 프로그램 표시
- YouTube에서 Gemini로 프롬프트 자동 전달

#### 1.3 정보 저장 위치
모든 설정 정보는 **사용자의 브라우저 로컬 저장소**에만 저장되며, 외부 서버로 전송되지 않습니다.

### 2. 정보 보안
- Chrome 브라우저의 보안 정책을 준수합니다
- 암호화된 Chrome Storage API를 사용합니다
- 네트워크를 통한 데이터 전송이 없습니다
- 사용자 데이터는 로컬에서만 처리됩니다

### 3. 제3자 정보 공유
**본 확장 프로그램은 어떠한 정보도 제3자와 공유하지 않습니다.**

- 개인정보 수집하지 않음
- 외부 서버로 데이터 전송하지 않음
- 광고 네트워크 연동하지 않음
- 분석 도구 사용하지 않음

### 4. 외부 서비스 연동

#### 4.1 Felo AI
Felo 버튼 클릭 시, 사용자를 Felo AI 웹사이트로 이동시킵니다. YouTube 영상 URL만 전달되며, 개인정보는 전송되지 않습니다.

#### 4.2 Google Gemini
Gemini 버튼 클릭 시, 사용자를 Gemini 웹사이트로 이동시키고 프롬프트를 자동 입력합니다. 영상 URL과 사용자 설정 프롬프트만 전달됩니다.

### 5. 사용자 권리
- **설정 변경:** 옵션 페이지에서 언제든 설정 변경 가능
- **데이터 삭제:** 확장 프로그램 제거 시 모든 데이터 자동 삭제
- **투명성:** 오픈소스 코드로 동작 방식 확인 가능

### 6. 쿠키 및 추적
본 확장 프로그램은:
- 쿠키를 설정하지 않습니다
- 사용자 행동을 추적하지 않습니다
- 브라우징 히스토리에 접근하지 않습니다
- 웹사이트 내용을 읽거나 수정하지 않습니다

### 7. 아동 개인정보 보호
본 확장 프로그램은 만 13세 미만 아동을 대상으로 하지 않으며, 고의로 아동의 개인정보를 수집하지 않습니다.

### 8. 개인정보처리방침 변경
본 방침의 변경 시, Chrome 웹스토어를 통해 공지하며, 중요한 변경사항은 확장 프로그램 업데이트 노트에 명시합니다.

---

## English Version

### 📋 Summary
**YouTube AI Search extension does not collect personal information.** It only stores user-configured settings locally in the browser and does not transmit them externally.

### 1. Information Collection and Use

#### 1.1 Information We Collect
This extension **does not collect personal information**. It only stores the following locally:

- Felo/Gemini button enable/disable settings (true/false)
- Custom Gemini prompt text
- Extension language preference

#### 1.2 How We Use Information
- Display customized buttons based on user preferences
- Save user-defined prompts
- Display extension in preferred language
- Auto-transfer prompts from YouTube to Gemini

#### 1.3 Information Storage
All settings are stored only in **your browser's local storage** and are not transmitted to external servers.

### 2. Information Security
- Complies with Chrome browser security policies
- Uses encrypted Chrome Storage API
- No network data transmission
- User data processed locally only

### 3. Third-Party Information Sharing
**This extension does not share any information with third parties.**

- No personal information collection
- No data transmission to external servers
- No advertising network integration
- No analytics tools used

### 4. External Service Integration

#### 4.1 Felo AI
When clicking the Felo button, users are redirected to the Felo AI website. Only the YouTube video URL is passed; no personal information is transmitted.

#### 4.2 Google Gemini
When clicking the Gemini button, users are redirected to the Gemini website with auto-input functionality. Only the video URL and user-configured prompt are passed.

### 5. User Rights
- **Settings Modification:** Change settings anytime through the options page
- **Data Deletion:** All data automatically deleted when extension is uninstalled
- **Transparency:** Open-source code allows verification of functionality

### 6. Cookies and Tracking
This extension:
- Does not set cookies
- Does not track user behavior
- Does not access browsing history
- Does not read or modify website content

### 7. Children's Privacy Protection
This extension is not intended for children under 13 and does not knowingly collect personal information from children.

### 8. Privacy Policy Changes
Changes to this policy will be announced through the Chrome Web Store, with significant changes noted in extension update notes.

---

## 연락처 / Contact Information

**개발자 / Developer:** [Your Name/Company]  
**이메일 / Email:** [your-email@example.com]  
**GitHub:** [https://github.com/[your-username]/youtube-ai-search](https://github.com/[your-username]/youtube-ai-search)  
**Chrome 웹스토어 / Chrome Web Store:** [Extension URL]

---

## 기술적 세부사항 / Technical Details

### Storage Usage
```javascript
// User Settings (stored locally)
{
  "enableFelo": boolean,
  "enableGemini": boolean,
  "geminiPrompt": string,
  "userSelectedLanguage": string
}

// Temporary data (auto-deleted after use)
{
  "geminiPrompt": string // For auto-input functionality
}
```

### Host Permissions
- **youtube.com:** Button insertion and URL extraction only
- **gemini.google.com:** Auto-input functionality only

### Data Flow
1. User configures settings → Stored locally in browser
2. User clicks Gemini button → Temporary data transfer to Gemini page
3. Auto-input completes → Temporary data deleted

### Compliance
- ✅ GDPR Compliant (no personal data collection)
- ✅ Chrome Web Store Policies
- ✅ Children's Online Privacy Protection Act (COPPA)
- ✅ Minimal permissions principle
- ✅ Transparent functionality 