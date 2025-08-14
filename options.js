// YouTube AI Search Extension - Options Page Script

/**
 * Get localized message with fallback and user language preference
 */
function getI18nMessage(key, fallback = '') {
    try {
        // 사용자가 선택한 언어가 있는지 확인
        const userLanguage = localStorage.getItem('userSelectedLanguage');
        
        if (userLanguage && userLanguage !== 'auto') {
            // 사용자가 특정 언어를 선택한 경우, 해당 언어의 메시지를 가져오기 시도
            const messages = getMessagesForLanguage(userLanguage);
            if (messages && messages[key] && messages[key].message) {
                return messages[key].message;
            }
        }
        
        // 기본 Chrome i18n 사용
        return chrome.i18n.getMessage(key) || fallback;
    } catch (e) {
        console.warn(`[Options] Failed to get i18n message for key: ${key}`, e);
        return fallback;
    }
}

/**
 * 특정 언어의 메시지를 가져오는 함수
 */
function getMessagesForLanguage(lang) {
    try {
        // 하드코딩된 메시지들 (실제로는 _locales 폴더에서 fetch로 가져와야 하지만 보안상 제한이 있을 수 있음)
        const messages = {
            'ko': {
                'optionsTitle': { 'message': 'YouTube AI Search 설정' },
                'optionsButtonSettings': { 'message': '표시할 검색 버튼 선택' },
                'optionsEnableFelo': { 'message': 'Felo 검색 버튼' },
                'optionsEnableGemini': { 'message': 'Gemini 검색 버튼' },
                'optionsGeminiPrompt': { 'message': 'Gemini 프롬프트' },
                'optionsGeminiPromptPlaceholder': { 'message': 'Gemini에서 사용할 프롬프트를 입력하세요...' },
                'optionsSave': { 'message': '설정 저장' },
                'optionsReset': { 'message': '기본값 복원' },
                'optionsSaveSuccess': { 'message': '설정이 성공적으로 저장되었습니다! 🎉' },
                'optionsSaveError': { 'message': '설정 저장 중 오류가 발생했습니다:' },
                'optionsLoadError': { 'message': '설정을 불러오는 중 오류가 발생했습니다.' },
                'optionsMinimumButtonRequired': { 'message': '최소 하나의 검색 버튼은 활성화되어야 합니다.' },
                'optionsResetSuccess': { 'message': 'Gemini 프롬프트가 기본값으로 복원되었습니다.' },
                'optionsPromptMaxLength': { 'message': '프롬프트는 최대 1000자까지 입력 가능합니다.' },
                'defaultGeminiPrompt': { 'message': '요약 및 핵심 내용 정리' },
                'optionsLanguageSettings': { 'message': '언어 설정' },
                'optionsLanguageSelect': { 'message': '확장 프로그램 언어:' },
                'optionsLanguageChanged': { 'message': '언어가 변경되었습니다. 페이지가 새로고침됩니다.' },
                'optionsLanguageAuto': { 'message': '브라우저 기본 언어 사용' },
                'optionsLanguageKo': { 'message': '한국어' },
                'optionsLanguageEn': { 'message': 'English' },
                'optionsLanguageDescription': { 'message': '브라우저 언어와 관계없이 확장 프로그램에서 사용할 언어를 선택할 수 있습니다.' },
                'optionsFeloDescription': { 'message': 'Felo AI를 사용한 영상 검색 기능' },
                'optionsGeminiDescription': { 'message': 'Google Gemini를 사용한 영상 분석 기능 (자동 입력 및 전송)' },
                'optionsPromptSettings': { 'message': 'AI 프롬프트 설정' },
                'optionsDefaultValue': { 'message': '기본값' },
                'optionsVariableInfo': { 'message': '{VIDEO_URL}은 자동으로 영상 링크로 치환됩니다.' }
            },
            'en': {
                'optionsTitle': { 'message': 'YouTube AI Search Settings' },
                'optionsButtonSettings': { 'message': 'Select Search Buttons to Display' },
                'optionsEnableFelo': { 'message': 'Felo Search Button' },
                'optionsEnableGemini': { 'message': 'Gemini Search Button' },
                'optionsGeminiPrompt': { 'message': 'Gemini Prompt' },
                'optionsGeminiPromptPlaceholder': { 'message': 'Enter the prompt to use with Gemini...' },
                'optionsSave': { 'message': 'Save Settings' },
                'optionsReset': { 'message': 'Reset to Default' },
                'optionsSaveSuccess': { 'message': 'Settings saved successfully! 🎉' },
                'optionsSaveError': { 'message': 'Error saving settings:' },
                'optionsLoadError': { 'message': 'Error loading settings.' },
                'optionsMinimumButtonRequired': { 'message': 'At least one search button must be enabled.' },
                'optionsResetSuccess': { 'message': 'Gemini prompt has been reset to default.' },
                'optionsPromptMaxLength': { 'message': 'Prompt can be up to 1000 characters long.' },
                'defaultGeminiPrompt': { 'message': 'Summarize and extract key points' },
                'optionsLanguageSettings': { 'message': 'Language Settings' },
                'optionsLanguageSelect': { 'message': 'Extension Language:' },
                'optionsLanguageChanged': { 'message': 'Language changed. Page will refresh.' },
                'optionsLanguageAuto': { 'message': 'Use browser default language' },
                'optionsLanguageKo': { 'message': '한국어' },
                'optionsLanguageEn': { 'message': 'English' },
                'optionsLanguageDescription': { 'message': 'You can select the language to use in the extension regardless of your browser language.' },
                'optionsFeloDescription': { 'message': 'Video search function using Felo AI' },
                'optionsGeminiDescription': { 'message': 'Video analysis function using Google Gemini (auto input and submit)' },
                'optionsPromptSettings': { 'message': 'AI Prompt Settings' },
                'optionsDefaultValue': { 'message': 'Default' },
                'optionsVariableInfo': { 'message': '{VIDEO_URL} will be automatically replaced with the video link.' }
            }
        };
        
        return messages[lang];
    } catch (error) {
        console.warn('Failed to get messages for language:', lang, error);
        return null;
    }
}

// 기본 설정값 (런타임에 i18n으로 업데이트됨)
const DEFAULT_SETTINGS = {
    enableFelo: true,
    enableGemini: true,
    geminiPrompt: null // 런타임에 i18n으로 설정됨
};

// 설정 키
const STORAGE_KEYS = {
    ENABLE_FELO: 'enableFelo',
    ENABLE_GEMINI: 'enableGemini',
    GEMINI_PROMPT: 'geminiPrompt'
};

/**
 * 설정 로드
 */
async function loadSettings() {
    try {
        // 기본 프롬프트를 i18n으로 설정
        const defaultGeminiPrompt = getI18nMessage("defaultGeminiPrompt", "요약 및 핵심 내용 정리");
        
        const defaultSettings = {
            enableFelo: DEFAULT_SETTINGS.enableFelo,
            enableGemini: DEFAULT_SETTINGS.enableGemini,
            geminiPrompt: defaultGeminiPrompt
        };
        
        // sync와 local 둘 다 시도해보기
        let result;
        try {
            result = await chrome.storage.sync.get(defaultSettings);
        } catch (syncError) {
            result = await chrome.storage.local.get(defaultSettings);
        }
        
        // 체크박스 설정
        document.getElementById('enableFelo').checked = result.enableFelo !== undefined ? result.enableFelo : defaultSettings.enableFelo;
        document.getElementById('enableGemini').checked = result.enableGemini !== undefined ? result.enableGemini : defaultSettings.enableGemini;
        
        // 프롬프트 설정
        document.getElementById('geminiPrompt').value = result.geminiPrompt || defaultSettings.geminiPrompt;
        
        // 언어 설정
        const savedLanguage = localStorage.getItem('userSelectedLanguage') || 'auto';
        document.getElementById('languageSelect').value = savedLanguage;
        
    } catch (error) {
        console.error('[Options] Error loading settings:', error);
        showStatusMessage(getI18nMessage('optionsLoadError', '설정을 불러오는 중 오류가 발생했습니다.'), 'error');
        
        // 에러 시 기본값으로 설정
        const defaultGeminiPrompt = getI18nMessage("defaultGeminiPrompt", "요약 및 핵심 내용 정리");
        document.getElementById('enableFelo').checked = DEFAULT_SETTINGS.enableFelo;
        document.getElementById('enableGemini').checked = DEFAULT_SETTINGS.enableGemini;
        document.getElementById('geminiPrompt').value = defaultGeminiPrompt;
        
        // 언어 설정 복원
        const savedLanguage = localStorage.getItem('userSelectedLanguage') || 'auto';
        document.getElementById('languageSelect').value = savedLanguage;
    }
}

/**
 * 설정 저장
 */
async function saveSettings() {
    try {
        const defaultGeminiPrompt = getI18nMessage("defaultGeminiPrompt", "요약 및 핵심 내용 정리");
        const settings = {
            enableFelo: document.getElementById('enableFelo').checked,
            enableGemini: document.getElementById('enableGemini').checked,
            geminiPrompt: document.getElementById('geminiPrompt').value.trim() || defaultGeminiPrompt
        };
        
        // 최소 하나의 버튼은 활성화되어야 함
        if (!settings.enableFelo && !settings.enableGemini) {
            showStatusMessage(getI18nMessage('optionsMinimumButtonRequired', '최소 하나의 검색 버튼은 활성화되어야 합니다.'), 'error');
            return;
        }
        
        // 여러 storage API 시도
        let saveSuccess = false;
        let saveError = null;
        
        // 1. sync storage 시도
        try {
            await chrome.storage.sync.set(settings);
            saveSuccess = true;
        } catch (syncError) {
            saveError = syncError;
            
            // 2. local storage로 백업 시도
            try {
                await chrome.storage.local.set(settings);
                saveSuccess = true;
            } catch (localError) {
                saveError = localError;
            }
        }
        
        if (saveSuccess) {
            showStatusMessage(getI18nMessage('optionsSaveSuccess', '설정이 성공적으로 저장되었습니다! 🎉'), 'success');
            
            // 잠시 후 성공 메시지 숨기기
            setTimeout(() => {
                hideStatusMessage();
            }, 3000);
        } else {
            throw saveError || new Error('Unknown storage error');
        }
        
    } catch (error) {
        console.error('[Options] Error saving settings:', error);
        showStatusMessage(`${getI18nMessage('optionsSaveError', '설정 저장 중 오류가 발생했습니다:')} ${error.message}`, 'error');
    }
}

/**
 * Gemini 프롬프트를 기본값으로 복원
 */
function resetGeminiPrompt() {
    const defaultGeminiPrompt = getI18nMessage("defaultGeminiPrompt", "요약 및 핵심 내용 정리");
    document.getElementById('geminiPrompt').value = defaultGeminiPrompt;
    showStatusMessage(getI18nMessage('optionsResetSuccess', 'Gemini 프롬프트가 기본값으로 복원되었습니다.'), 'success');
    setTimeout(() => {
        hideStatusMessage();
    }, 2000);
}

/**
 * 상태 메시지 표시
 */
function showStatusMessage(message, type = 'success') {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
}

/**
 * 상태 메시지 숨기기
 */
function hideStatusMessage() {
    const statusElement = document.getElementById('statusMessage');
    statusElement.className = 'status-message';
}

/**
 * 실시간 프롬프트 미리보기 (옵션)
 */
function updatePromptPreview() {
    // 필요시 프롬프트 미리보기 로직 추가 가능
}

/**
 * 키보드 단축키 처리
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Ctrl+S 또는 Cmd+S로 저장
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            saveSettings();
        }
        
        // Escape으로 상태 메시지 숨기기
        if (event.key === 'Escape') {
            hideStatusMessage();
        }
    });
}

/**
 * 폼 유효성 검사
 */
function setupFormValidation() {
    const geminiPromptTextarea = document.getElementById('geminiPrompt');
    
    // 프롬프트 길이 제한 (선택사항)
    geminiPromptTextarea.addEventListener('input', (event) => {
        const maxLength = 1000;
        const currentLength = event.target.value.length;
        
        if (currentLength > maxLength) {
            event.target.value = event.target.value.substring(0, maxLength);
            showStatusMessage(getI18nMessage('optionsPromptMaxLength', '프롬프트는 최대 1000자까지 입력 가능합니다.'), 'error');
            setTimeout(() => {
                hideStatusMessage();
            }, 3000);
        }
    });
    
    // 체크박스 상태 변경 감지
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const enableFelo = document.getElementById('enableFelo').checked;
            const enableGemini = document.getElementById('enableGemini').checked;
            
            // 모든 체크박스가 해제되지 않도록 방지
            if (!enableFelo && !enableGemini) {
                checkbox.checked = true;
                showStatusMessage(getI18nMessage('optionsMinimumButtonRequired', '최소 하나의 검색 버튼은 활성화되어야 합니다.'), 'error');
                setTimeout(() => {
                    hideStatusMessage();
                }, 3000);
            }
        });
    });
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 저장 버튼
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
    
    // 기본값 복원 버튼
    const resetBtn = document.getElementById('resetGeminiBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetGeminiPrompt);
    }
    
    // 프롬프트 실시간 미리보기
    const geminiPromptTextarea = document.getElementById('geminiPrompt');
    if (geminiPromptTextarea) {
        geminiPromptTextarea.addEventListener('input', updatePromptPreview);
    }
    
    // 언어 선택 드롭다운
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', handleLanguageChange);
    }
}

/**
 * 언어 변경 처리
 */
function handleLanguageChange() {
    const selectedLanguage = document.getElementById('languageSelect').value;
    const currentLanguage = localStorage.getItem('userSelectedLanguage') || 'auto';
    
    if (selectedLanguage !== currentLanguage) {
        // 언어 설정 저장
        localStorage.setItem('userSelectedLanguage', selectedLanguage);
        
        // 성공 메시지 표시
        showStatusMessage(getI18nMessage('optionsLanguageChanged', '언어가 변경되었습니다. 페이지가 새로고침됩니다.'), 'success');
        
        // 잠시 후 페이지 새로고침
        setTimeout(() => {
            location.reload();
        }, 1500);
    }
}

/**
 * 다국어 텍스트 업데이트
 */
function updateI18nTexts() {
    // 페이지 제목
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = '🚀 ' + getI18nMessage('optionsTitle', 'YouTube AI Search 설정');
    }
    
    // 언어 설정 섹션
    const languageSettingsTitle = document.getElementById('languageSettingsTitle');
    if (languageSettingsTitle) {
        languageSettingsTitle.innerHTML = '<span class="section-icon">🌍</span>' + getI18nMessage('optionsLanguageSettings', '언어 설정');
    }
    
    const languageSelectLabel = document.getElementById('languageSelectLabel');
    if (languageSelectLabel) {
        languageSelectLabel.textContent = getI18nMessage('optionsLanguageSelect', '확장 프로그램 언어:');
    }
    
    const optionAuto = document.getElementById('optionAuto');
    if (optionAuto) {
        optionAuto.textContent = getI18nMessage('optionsLanguageAuto', '브라우저 기본 언어 사용');
    }
    
    const optionKo = document.getElementById('optionKo');
    if (optionKo) {
        optionKo.textContent = getI18nMessage('optionsLanguageKo', '한국어');
    }
    
    const optionEn = document.getElementById('optionEn');
    if (optionEn) {
        optionEn.textContent = getI18nMessage('optionsLanguageEn', 'English');
    }
    
    const languageDescription = document.getElementById('languageDescription');
    if (languageDescription) {
        languageDescription.textContent = getI18nMessage('optionsLanguageDescription', '브라우저 언어와 관계없이 확장 프로그램에서 사용할 언어를 선택할 수 있습니다.');
    }
    
    // 버튼 설정 섹션
    const buttonSettingsTitle = document.getElementById('buttonSettingsTitle');
    if (buttonSettingsTitle) {
        buttonSettingsTitle.innerHTML = '<span class="section-icon">🔍</span>' + getI18nMessage('optionsButtonSettings', '표시할 검색 버튼 선택');
    }
    
    const feloLabel = document.getElementById('feloLabel');
    if (feloLabel) {
        feloLabel.textContent = getI18nMessage('optionsEnableFelo', 'Felo 검색 버튼');
    }
    
    const feloDescription = document.getElementById('feloDescription');
    if (feloDescription) {
        feloDescription.textContent = getI18nMessage('optionsFeloDescription', 'Felo AI를 사용한 영상 검색 기능');
    }
    
    const geminiLabel = document.getElementById('geminiLabel');
    if (geminiLabel) {
        geminiLabel.textContent = getI18nMessage('optionsEnableGemini', 'Gemini 검색 버튼');
    }
    
    const geminiDescription = document.getElementById('geminiDescription');
    if (geminiDescription) {
        geminiDescription.textContent = getI18nMessage('optionsGeminiDescription', 'Google Gemini를 사용한 영상 분석 기능 (자동 입력 및 전송)');
    }
    
    // 프롬프트 설정 섹션
    const promptSettingsTitle = document.getElementById('promptSettingsTitle');
    if (promptSettingsTitle) {
        promptSettingsTitle.innerHTML = '<span class="section-icon">💬</span>' + getI18nMessage('optionsPromptSettings', 'AI 프롬프트 설정');
    }
    
    const geminiPromptLabel = document.getElementById('geminiPromptLabel');
    if (geminiPromptLabel) {
        const resetBtn = document.getElementById('resetGeminiBtn');
        const resetBtnText = resetBtn ? resetBtn.outerHTML : '';
        geminiPromptLabel.innerHTML = getI18nMessage('optionsGeminiPrompt', 'Gemini 프롬프트') + ' ' + resetBtnText;
    }
    
    const geminiPromptTextarea = document.getElementById('geminiPrompt');
    if (geminiPromptTextarea) {
        geminiPromptTextarea.placeholder = getI18nMessage('optionsGeminiPromptPlaceholder', 'Gemini에서 사용할 프롬프트를 입력하세요...');
    }
    
    const promptInfo = document.getElementById('promptInfo');
    if (promptInfo) {
        const defaultPrompt = getI18nMessage('defaultGeminiPrompt', '요약 및 핵심 내용 정리');
        promptInfo.innerHTML = `💡 ${getI18nMessage('optionsDefaultValue', '기본값')}: "${defaultPrompt}"<br>📝 ${getI18nMessage('optionsVariableInfo', '{VIDEO_URL}은 자동으로 영상 링크로 치환됩니다.')}`;
    }
    
    // 버튼들
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
        saveBtn.textContent = getI18nMessage('optionsSave', '설정 저장');
    }
    
    const resetBtn = document.getElementById('resetGeminiBtn');
    if (resetBtn) {
        resetBtn.textContent = getI18nMessage('optionsReset', '기본값 복원');
    }
}

/**
 * 초기화
 */
async function initialize() {
    console.log('[Options] Initializing options page...');
    
    try {
        // 다국어 텍스트 업데이트
        updateI18nTexts();
        
        // 설정 로드
        await loadSettings();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        setupKeyboardShortcuts();
        setupFormValidation();
        
        console.log('[Options] Options page initialized successfully');
        
    } catch (error) {
        console.error('[Options] Error initializing options page:', error);
        showStatusMessage(getI18nMessage('optionsLoadError', '옵션 페이지 초기화 중 오류가 발생했습니다.'), 'error');
    }
}

/**
 * 내보내기/가져오기 기능 (향후 확장용)
 */
function exportSettings() {
    chrome.storage.sync.get(null, (settings) => {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'youtube-ai-search-settings.json';
        link.click();
    });
}

function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const settings = JSON.parse(e.target.result);
            chrome.storage.sync.set(settings, () => {
                loadSettings();
                showStatusMessage('설정을 성공적으로 가져왔습니다!', 'success');
            });
        } catch (error) {
            showStatusMessage('유효하지 않은 설정 파일입니다.', 'error');
        }
    };
    reader.readAsText(file);
}

// DOM 로드 완료 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

 