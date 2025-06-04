// YouTube AI Search Extension - Options Page Script

// 기본 설정값
const DEFAULT_SETTINGS = {
    enableFelo: true,
    enableGemini: true,
    geminiPrompt: "해당 영상을 단계별로 디테일하고 자세히 정리"
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
        // sync와 local 둘 다 시도해보기
        let result;
        try {
            result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
        } catch (syncError) {
            result = await chrome.storage.local.get(DEFAULT_SETTINGS);
        }
        
        // 체크박스 설정
        document.getElementById('enableFelo').checked = result.enableFelo !== undefined ? result.enableFelo : DEFAULT_SETTINGS.enableFelo;
        document.getElementById('enableGemini').checked = result.enableGemini !== undefined ? result.enableGemini : DEFAULT_SETTINGS.enableGemini;
        
        // 프롬프트 설정
        document.getElementById('geminiPrompt').value = result.geminiPrompt || DEFAULT_SETTINGS.geminiPrompt;
        
    } catch (error) {
        console.error('[Options] Error loading settings:', error);
        showStatusMessage('설정을 불러오는 중 오류가 발생했습니다.', 'error');
        
        // 에러 시 기본값으로 설정
        document.getElementById('enableFelo').checked = DEFAULT_SETTINGS.enableFelo;
        document.getElementById('enableGemini').checked = DEFAULT_SETTINGS.enableGemini;
        document.getElementById('geminiPrompt').value = DEFAULT_SETTINGS.geminiPrompt;
    }
}

/**
 * 설정 저장
 */
async function saveSettings() {
    try {
        const settings = {
            enableFelo: document.getElementById('enableFelo').checked,
            enableGemini: document.getElementById('enableGemini').checked,
            geminiPrompt: document.getElementById('geminiPrompt').value.trim() || DEFAULT_SETTINGS.geminiPrompt
        };
        
        // 최소 하나의 버튼은 활성화되어야 함
        if (!settings.enableFelo && !settings.enableGemini) {
            showStatusMessage('최소 하나의 검색 버튼은 활성화되어야 합니다.', 'error');
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
            showStatusMessage('설정이 성공적으로 저장되었습니다! 🎉', 'success');
            
            // 잠시 후 성공 메시지 숨기기
            setTimeout(() => {
                hideStatusMessage();
            }, 3000);
        } else {
            throw saveError || new Error('Unknown storage error');
        }
        
    } catch (error) {
        console.error('[Options] Error saving settings:', error);
        showStatusMessage(`설정 저장 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

/**
 * Gemini 프롬프트를 기본값으로 복원
 */
function resetGeminiPrompt() {
    document.getElementById('geminiPrompt').value = DEFAULT_SETTINGS.geminiPrompt;
    showStatusMessage('Gemini 프롬프트가 기본값으로 복원되었습니다.', 'success');
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
            showStatusMessage(`프롬프트는 최대 ${maxLength}자까지 입력 가능합니다.`, 'error');
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
                showStatusMessage('최소 하나의 검색 버튼은 활성화되어야 합니다.', 'error');
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
}

/**
 * 초기화
 */
async function initialize() {
    console.log('[Options] Initializing options page...');
    
    try {
        // 설정 로드
        await loadSettings();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        setupKeyboardShortcuts();
        setupFormValidation();
        

        
        console.log('[Options] Options page initialized successfully');
        
    } catch (error) {
        console.error('[Options] Error initializing options page:', error);
        showStatusMessage('옵션 페이지 초기화 중 오류가 발생했습니다.', 'error');
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

 