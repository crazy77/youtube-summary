// Gemini Auto-Input Content Script
// This script runs on Gemini pages to automatically input prompts

console.log("[Gemini Auto-Input] Script loaded");

// Configuration
const GEMINI_CONFIG = {
	SELECTORS: {
		// Gemini 입력창 선택자들 (다양한 버전 대응)
		inputAreas: [
			'rich-textarea[placeholder*="Gemini"]',
			'div[contenteditable="true"]',
			'textarea[placeholder*="message"]',
			'div[data-placeholder*="Gemini"]',
			'[role="textbox"]',
			'textarea',
			'div.ql-editor',
			'.ProseMirror'
		],
		// 전송 버튼 선택자들
		sendButtons: [
			'button[data-testid="send-button"]',
			'button[aria-label*="Send"]',
			'button[aria-label*="전송"]',
			'button:has(svg)',
			'button[type="submit"]',
			'.send-button',
			'[data-testid*="send"]'
		]
	},
	TIMING: {
		maxWaitTime: 10000, // 10초
		checkInterval: 100,  // 100ms
		inputDelay: 500,     // 입력 후 대기시간
		submitDelay: 1000    // 전송 전 대기시간
	}
};

// 상태 관리
let isProcessing = false;

/**
 * 페이지가 완전히 로드될 때까지 대기
 */
function waitForPageReady() {
	return new Promise((resolve) => {
		if (document.readyState === 'complete') {
			resolve();
			return;
		}
		
		window.addEventListener('load', resolve, { once: true });
	});
}

/**
 * 요소가 나타날 때까지 대기
 */
function waitForElement(selectors, timeout = GEMINI_CONFIG.TIMING.maxWaitTime) {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();
		
		function check() {
			for (const selector of selectors) {
				const element = document.querySelector(selector);
				if (element && element.offsetParent !== null) {
					console.log(`[Gemini Auto-Input] Found element with selector: ${selector}`);
					resolve(element);
					return;
				}
			}
			
			if (Date.now() - startTime > timeout) {
				reject(new Error('Timeout waiting for element'));
				return;
			}
			
			setTimeout(check, GEMINI_CONFIG.TIMING.checkInterval);
		}
		
		check();
	});
}

/**
 * 텍스트를 자연스럽게 입력하는 함수
 */
function typeText(element, text) {
	return new Promise((resolve) => {
		// 요소에 포커스
		element.focus();
		element.click();
		
		// 기존 텍스트 선택 및 삭제
		if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
			element.select();
			element.value = '';
		} else if (element.contentEditable === 'true') {
			// contenteditable 요소의 경우
			const range = document.createRange();
			const selection = window.getSelection();
			range.selectNodeContents(element);
			selection.removeAllRanges();
			selection.addRange(range);
			document.execCommand('delete');
		}
		
		// 입력 이벤트들을 시뮬레이션
		const inputEvent = new Event('input', { bubbles: true });
		const changeEvent = new Event('change', { bubbles: true });
		
		// 텍스트 설정
		if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
			element.value = text;
		} else if (element.contentEditable === 'true') {
			element.textContent = text;
			// 또는 innerHTML 사용
			element.innerHTML = text.replace(/\n/g, '<br>');
		}
		
		// 이벤트 발생
		element.dispatchEvent(inputEvent);
		element.dispatchEvent(changeEvent);
		
		// 커서를 마지막으로 이동
		setTimeout(() => {
			if (element.contentEditable === 'true') {
				const range = document.createRange();
				const selection = window.getSelection();
				range.selectNodeContents(element);
				range.collapse(false);
				selection.removeAllRanges();
				selection.addRange(range);
			} else {
				element.setSelectionRange(text.length, text.length);
			}
			resolve();
		}, 100);
	});
}

/**
 * 전송 버튼 클릭
 */
function clickSendButton() {
	return new Promise(async (resolve, reject) => {
		try {
			const sendButton = await waitForElement(GEMINI_CONFIG.SELECTORS.sendButtons, 3000);
			
			// 버튼이 활성화될 때까지 잠시 대기
			setTimeout(() => {
				if (sendButton.disabled) {
					console.log("[Gemini Auto-Input] Send button is disabled, trying to enable...");
					sendButton.disabled = false;
				}
				
				// 클릭 이벤트 시뮬레이션
				sendButton.click();
				
				// 대안적 방법들도 시도
				const clickEvent = new MouseEvent('click', {
					bubbles: true,
					cancelable: true,
					view: window
				});
				sendButton.dispatchEvent(clickEvent);
				
				console.log("[Gemini Auto-Input] Send button clicked");
				resolve();
			}, GEMINI_CONFIG.TIMING.submitDelay);
			
		} catch (error) {
			console.warn("[Gemini Auto-Input] Could not find send button, trying Enter key");
			// 전송 버튼을 찾지 못하면 Enter 키로 대체
			const inputArea = document.querySelector(GEMINI_CONFIG.SELECTORS.inputAreas.join(', '));
			if (inputArea) {
				inputArea.focus();
				const enterEvent = new KeyboardEvent('keydown', {
					key: 'Enter',
					code: 'Enter',
					keyCode: 13,
					which: 13,
					bubbles: true
				});
				inputArea.dispatchEvent(enterEvent);
			}
			resolve();
		}
	});
}

/**
 * 메인 자동 입력 함수
 */
async function autoInputPrompt(prompt) {
	if (isProcessing) {
		console.log("[Gemini Auto-Input] Already processing...");
		return;
	}
	
	isProcessing = true;
	console.log("[Gemini Auto-Input] Starting auto input process...");
	
	try {
		// 페이지 로드 대기
		await waitForPageReady();
		console.log("[Gemini Auto-Input] Page ready");
		
		// 입력창 찾기
		const inputArea = await waitForElement(GEMINI_CONFIG.SELECTORS.inputAreas);
		console.log("[Gemini Auto-Input] Input area found:", inputArea);
		
		// 텍스트 입력
		await typeText(inputArea, prompt);
		console.log("[Gemini Auto-Input] Text typed");
		
		// 잠시 대기 후 전송
		await new Promise(resolve => setTimeout(resolve, GEMINI_CONFIG.TIMING.inputDelay));
		
		// 전송 버튼 클릭
		await clickSendButton();
		console.log("[Gemini Auto-Input] Process completed");
		
		// 완료 후 storage에서 데이터 제거
		chrome.storage.local.remove(['geminiPrompt']);
		
	} catch (error) {
		console.error("[Gemini Auto-Input] Error during auto input:", error);
	} finally {
		isProcessing = false;
	}
}

/**
 * storage에서 프롬프트 확인 및 처리
 * 프롬프트는 이미 사용자 설정이 적용된 상태로 전달됨
 */
async function checkForPrompt() {
	try {
		const result = await chrome.storage.local.get(['geminiPrompt']);
		if (result.geminiPrompt) {
			console.log("[Gemini Auto-Input] Found prompt in storage:", result.geminiPrompt);
			await autoInputPrompt(result.geminiPrompt);
		}
	} catch (error) {
		console.error("[Gemini Auto-Input] Error checking storage:", error);
	}
}

/**
 * URL 변경 감지
 */
function observeUrlChanges() {
	let currentUrl = location.href;
	
	// MutationObserver로 URL 변경 감지
	const observer = new MutationObserver(() => {
		if (location.href !== currentUrl) {
			currentUrl = location.href;
			console.log("[Gemini Auto-Input] URL changed, checking for prompt...");
			setTimeout(checkForPrompt, 1000); // 페이지 로드 후 1초 대기
		}
	});
	
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
}

/**
 * 초기화
 */
async function initialize() {
	console.log("[Gemini Auto-Input] Initializing...");
	
	// URL 변경 감지 시작
	observeUrlChanges();
	
	// 초기 프롬프트 확인
	await checkForPrompt();
	
	// storage 변경 이벤트 리스너
	chrome.storage.onChanged.addListener((changes, namespace) => {
		if (namespace === 'local' && changes.geminiPrompt) {
			console.log("[Gemini Auto-Input] Storage changed, processing new prompt");
			setTimeout(() => checkForPrompt(), 500);
		}
	});
}

// 페이지 로드 후 초기화
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initialize);
} else {
	initialize();
} 