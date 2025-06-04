// YouTube Felo Search Extension - Content Script
// Improved version with proper YouTube SPA loading detection

// === CONFIGURATION ===
const CONFIG = {
	SELECTORS: {
		potentialElements: [
			"ytd-rich-grid-media",
			"ytd-video-renderer", 
			"ytd-compact-video-renderer",
			"ytd-grid-video-renderer",
			"ytd-playlist-panel-video-renderer",
			"ytd-reel-video-renderer",
			"ytd-rich-item-renderer",
			// Additional containers that might contain videos
			"ytd-compact-autoplay-renderer",
			"ytd-mini-guide-entry-renderer",
			"ytd-guide-entry-renderer",
			// Generic containers for sidebar videos
			'div[class*="style-scope"]',
			'[data-context-item-id]'
		],
		// Sidebar containers to search within
		sidebarContainers: [
			"ytd-watch-next-secondary-results-renderer",
			"ytd-item-section-renderer",
			"#secondary #secondary-inner",
			"#related",
			"#secondary"
		],
		// More comprehensive video link selectors
		standardVideoLinks: "a#video-title, #video-title-link, a[href*='/watch?v='], a[href*='/shorts/']",
		shortsLockupLinks: "a.shortsLockupViewModelHostEndpoint",
		shortsReelLinks: 'a#endpoint[href*="/shorts/"], .reel-player-overlay-action a[href*="/shorts/"]',
		watchTitles: "h1.ytd-watch-metadata > yt-formatted-string, #video-title.ytd-watch-metadata, #info-contents h1 yt-formatted-string"
	},
	TIMING: {
		debounceMs: 500,
		maxWaitMs: 5000,
		retryIntervalMs: 5000,
		pageLoadCheckIntervalMs: 100
	},
	CLASSES: {
		button: "felo-search-button",
		icon: "felo-icon", 
		shortsButton: "felo-shorts-button",
		geminiButton: "gemini-search-button",
		geminiIcon: "gemini-icon",
		buttonContainer: "ai-buttons-container"
	},
	GEMINI: {
		baseUrl: "https://gemini.google.com/app"
	},
	// 기본 설정값 (i18n 메시지로 런타임에 설정됨)
	DEFAULT_SETTINGS: {
		enableFelo: true,
		enableGemini: true,
		geminiPrompt: null // 런타임에 i18n으로 설정됨
	}
};

// === STATE MANAGEMENT ===
let state = {
	isInitialized: false,
	isProcessing: false,
	processedElements: new WeakSet(),
	debounceTimer: null,
	observer: null,
	retryTimer: null,
	// 사용자 설정
	settings: CONFIG.DEFAULT_SETTINGS
};

// === UTILITY FUNCTIONS ===

/**
 * Load user settings from storage
 */
async function loadUserSettings() {
	try {
		// 기본 프롬프트를 i18n으로 설정
		const defaultGeminiPrompt = getI18nMessage("defaultGeminiPrompt", "해당 영상을 단계별로 디테일하고 자세히 정리");
		
		const defaultSettings = {
			enableFelo: CONFIG.DEFAULT_SETTINGS.enableFelo,
			enableGemini: CONFIG.DEFAULT_SETTINGS.enableGemini,
			geminiPrompt: defaultGeminiPrompt
		};
		
		let result;
		// sync storage 먼저 시도
		try {
			result = await chrome.storage.sync.get(defaultSettings);
		} catch (syncError) {
			// local storage로 백업 시도
			try {
				result = await chrome.storage.local.get(defaultSettings);
			} catch (localError) {
				throw localError;
			}
		}
		
		// 결과 병합 및 유효성 검사
		state.settings = {
			enableFelo: result.enableFelo !== undefined ? result.enableFelo : defaultSettings.enableFelo,
			enableGemini: result.enableGemini !== undefined ? result.enableGemini : defaultSettings.enableGemini,
			geminiPrompt: result.geminiPrompt || defaultSettings.geminiPrompt
		};
		
		return state.settings;
	} catch (error) {
		console.warn("[Felo] Failed to load settings, using defaults:", error);
		const defaultGeminiPrompt = getI18nMessage("defaultGeminiPrompt", "해당 영상을 단계별로 디테일하고 자세히 정리");
		state.settings = {
			enableFelo: CONFIG.DEFAULT_SETTINGS.enableFelo,
			enableGemini: CONFIG.DEFAULT_SETTINGS.enableGemini,
			geminiPrompt: defaultGeminiPrompt
		};
		return state.settings;
	}
}

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
		console.warn(`[Felo] Failed to get i18n message for key: ${key}`, e);
		return fallback;
	}
}

/**
 * 특정 언어의 메시지를 가져오는 함수 (content script용)
 */
function getMessagesForLanguage(lang) {
	try {
		// 필요한 메시지들만 하드코딩 (content script에서 사용되는 메시지들)
		const messages = {
			'ko': {
				'iconAltText': { 'message': 'Felo Search 아이콘' },
				'fallbackButtonText': { 'message': '🔍felo' },
				'buttonText': { 'message': 'felo' },
				'geminiIconAltText': { 'message': 'Gemini Search 아이콘' },
				'geminiFallbackButtonText': { 'message': '🤖gemini' },
				'geminiButtonText': { 'message': 'gemini' },
				'geminiProcessing': { 'message': '처리중...' },
				'geminiAutoInputFailed': { 'message': '자동 입력에 실패했습니다. 클립보드에 복사된 내용을 수동으로 붙여넣어 주세요.' },
				'geminiPromptFailed': { 'message': '프롬프트를 처리할 수 없습니다. 수동으로 복사해주세요:' },
				'errorNoUrl': { 'message': '이 버튼에 사용할 수 있는 URL이 없습니다' },
				'errorIconLoad': { 'message': '아이콘 로드 실패:' },
				'errorIconUrl': { 'message': '아이콘 URL 오류:' },
				'errorInsertButton': { 'message': '버튼 삽입 오류:' },
				'defaultGeminiPrompt': { 'message': '해당 영상을 단계별로 디테일하고 자세히 정리' }
			},
			'en': {
				'iconAltText': { 'message': 'Felo Search Icon' },
				'fallbackButtonText': { 'message': '🔍felo' },
				'buttonText': { 'message': 'felo' },
				'geminiIconAltText': { 'message': 'Gemini Search Icon' },
				'geminiFallbackButtonText': { 'message': '🤖gemini' },
				'geminiButtonText': { 'message': 'gemini' },
				'geminiProcessing': { 'message': 'Processing...' },
				'geminiAutoInputFailed': { 'message': 'Auto-input failed. Please manually paste the copied content.' },
				'geminiPromptFailed': { 'message': 'Cannot process prompt. Please copy manually:' },
				'errorNoUrl': { 'message': 'No URL available for this button' },
				'errorIconLoad': { 'message': 'Failed to load icon:' },
				'errorIconUrl': { 'message': 'Error getting icon URL:' },
				'errorInsertButton': { 'message': 'Error inserting buttons:' },
				'defaultGeminiPrompt': { 'message': 'Please organize this video step by step in detail' }
			}
		};
		
		return messages[lang];
	} catch (error) {
		console.warn('[Felo] Failed to get messages for language:', lang, error);
		return null;
	}
}

/**
 * Debounced function execution
 */
function debounce(func, wait) {
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(state.debounceTimer);
			func(...args);
		};
		clearTimeout(state.debounceTimer);
		state.debounceTimer = setTimeout(later, wait);
	};
}

/**
 * Check if YouTube page has finished loading
 */
function isYouTubePageReady() {
	// Check document ready state
	if (document.readyState !== 'complete') {
		return false;
	}

	// Check for main YouTube containers
	const mainContainer = document.querySelector('ytd-app, #content, #primary');
	if (!mainContainer) {
		return false;
	}

	// Check if we're on a specific page type and verify its key elements are loaded
	const currentUrl = window.location.href;
	
	if (currentUrl.includes('/watch')) {
		// Watch page - check for video player and metadata
		const player = document.querySelector('#ytd-player, #player-container');
		const metadata = document.querySelector('#info-contents, ytd-watch-metadata');
		return !!(player && metadata);
	} else if (currentUrl.includes('/shorts/')) {
		// Shorts page - check for shorts player
		return !!document.querySelector('ytd-shorts, #shorts-player');
	} else {
		// Home/Browse pages - check for main content grid
		const grid = document.querySelector('ytd-rich-grid-renderer, ytd-two-column-browse-results-renderer');
		return !!grid;
	}
}

/**
 * Wait for YouTube page to be ready
 */
function waitForPageReady() {
	return new Promise((resolve) => {
		if (isYouTubePageReady()) {
			resolve();
			return;
		}

		const startTime = Date.now();
		const checkInterval = setInterval(() => {
			if (isYouTubePageReady() || (Date.now() - startTime > CONFIG.TIMING.maxWaitMs)) {
				clearInterval(checkInterval);
				resolve();
			}
		}, CONFIG.TIMING.pageLoadCheckIntervalMs);
	});
}

// === ELEMENT ANALYSIS FUNCTIONS ===

/**
 * Determine element type and base element
 */
function analyzeElement(targetElement) {
	let baseElement = null;
	let elementType = "unknown";

	if (targetElement.matches("ytd-reel-video-renderer")) {
		elementType = "shortsReel";
		baseElement = targetElement;
	} else if (targetElement.matches("ytm-shorts-lockup-view-model")) {
		elementType = "shortsLockup";
		baseElement = targetElement;
	} else if (targetElement.matches("ytd-rich-item-renderer")) {
		const shortsLockup = targetElement.querySelector("ytm-shorts-lockup-view-model");
		const gridMedia = targetElement.querySelector("ytd-rich-grid-media");
		if (shortsLockup) {
			elementType = "shortsLockup";
			baseElement = shortsLockup;
		} else if (gridMedia) {
			const innerShorts = gridMedia.querySelector("ytm-shorts-lockup-view-model");
			if (innerShorts) {
				elementType = "shortsLockup";
				baseElement = innerShorts;
			} else {
				elementType = "standardVideo";
				baseElement = gridMedia;
			}
		}
	} else if (targetElement.matches("ytd-rich-grid-media")) {
		const innerShorts = targetElement.querySelector("ytm-shorts-lockup-view-model");
		if (innerShorts) {
			elementType = "shortsLockup";
			baseElement = innerShorts;
		} else {
			elementType = "standardVideo";
			baseElement = targetElement;
		}
	} else if (targetElement.matches("ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-playlist-panel-video-renderer")) {
		elementType = "standardVideo";
		baseElement = targetElement;
	} else if (targetElement.matches(CONFIG.SELECTORS.watchTitles)) {
		elementType = "watchTitle";
		baseElement = targetElement;
	}

	return { elementType, baseElement };
}

/**
 * Extract video URL from element based on its type
 */
function extractVideoUrl(baseElement, elementType) {
	if (!baseElement) {
		return null;
	}

	let videoUrl = null;
	let titleLinkElement = null;

	try {
		if (elementType === "watchTitle") {
			videoUrl = window.location.href;
		} else if (elementType === "shortsLockup") {
			titleLinkElement = baseElement.querySelector(CONFIG.SELECTORS.shortsLockupLinks);
			if (titleLinkElement) {
				videoUrl = titleLinkElement.href;
			}
		} else if (elementType === "shortsReel") {
			// Try to extract from YouTube internal data structures first
			const dataHost = baseElement.__data || 
							baseElement.data || 
							baseElement._data;
			const endpointData = dataHost?.data?.navigationEndpoint ||
								dataHost?.__data?.data?.navigationEndpoint ||
								dataHost?.__data?.endpoint;
			
			if (endpointData?.commandMetadata?.webCommandMetadata?.url) {
				videoUrl = endpointData.commandMetadata.webCommandMetadata.url;
			} else if (endpointData?.watchEndpoint?.videoId) {
				videoUrl = `/shorts/${endpointData.watchEndpoint.videoId}`;
			}
			
			// DOM fallback
			if (!videoUrl) {
				titleLinkElement = baseElement.querySelector(CONFIG.SELECTORS.shortsReelLinks);
				if (titleLinkElement) {
					videoUrl = titleLinkElement.href;
				}
			}
		} else if (elementType === "standardVideo") {
			// First, try the comprehensive selector
			titleLinkElement = baseElement.querySelector(CONFIG.SELECTORS.standardVideoLinks);
			
			if (titleLinkElement) {
				videoUrl = titleLinkElement.href;
			} else {
				// Try to find ALL links and filter for video URLs
				const allLinks = Array.from(baseElement.querySelectorAll('a[href]'));
				
				// Look for video links
				const videoLinks = allLinks.filter(link => 
					link.href && (
						link.href.includes('/watch?v=') || 
						link.href.includes('/shorts/') ||
						/\/watch\?v=[\w-]+/.test(link.href)
					)
				);
				
				if (videoLinks.length > 0) {
					// Prefer the first watch link, or any video link
					titleLinkElement = videoLinks.find(l => l.href.includes('/watch?v=')) || videoLinks[0];
					videoUrl = titleLinkElement.href;
				} else {
					// Last resort: check parent elements for links
					let parent = baseElement.parentElement;
					let searchDepth = 0;
					const maxDepth = 3;
					
					while (parent && searchDepth < maxDepth) {
						const parentLinks = Array.from(parent.querySelectorAll('a[href*="/watch"], a[href*="/shorts/"]'));
						if (parentLinks.length > 0) {
							titleLinkElement = parentLinks[0];
							videoUrl = titleLinkElement.href;
							break;
						}
						parent = parent.parentElement;
						searchDepth++;
					}
				}
			}
		}

		// Normalize URL
		if (videoUrl) {
			if (videoUrl.startsWith("/")) {
				videoUrl = `https://www.youtube.com${videoUrl}`;
			}
			
			if (videoUrl.includes("youtube.com/watch") || videoUrl.includes("youtube.com/shorts/")) {
				return videoUrl;
			}
		}
	} catch (error) {
		console.warn(`[Felo] Error extracting URL from ${elementType}:`, error);
	}

	return null;
}

/**
 * Find optimal button placement
 */
function findButtonPlacement(baseElement, elementType) {
	if (!baseElement || elementType === "unknown") {
		return { container: null, insertionPoint: null };
	}

	let container = null;
	let insertionPoint = null;

	try {
		if (elementType === "watchTitle") {
			container = baseElement.closest("#title, #info-contents > ytd-video-primary-info-renderer > #container > #info > #info-text") ||
						document.querySelector("#info-contents #info-text");
		} else if (elementType === "shortsLockup") {
			const subhead = baseElement.querySelector("div.shortsLockupViewModelHostMetadataSubhead");
			if (subhead) {
				container = subhead.parentNode;
				insertionPoint = subhead.nextSibling;
			} else {
				container = baseElement.querySelector(".shortsLockupViewModelHostOutsideMetadata");
			}
		} else if (elementType === "shortsReel") {
			container = baseElement.querySelector("#metadata-line, #factoids, .reel-video-meta-info") ||
						baseElement.querySelector(".reel-player-overlay-actions, #actions");
		} else if (elementType === "standardVideo") {
			// Check if this is a compact video renderer (commonly used in sidebar)
			if (baseElement.matches("ytd-compact-video-renderer")) {
				// For compact videos, try specific compact video selectors first
				const compactSelectors = [
					"#metadata-line", // Most common in compact videos
					"#meta",
					"#details",
					".details",
					"#video-title", // Sometimes the title container itself
					":scope > #content" // Direct child content
				];
				
				for (const selector of compactSelectors) {
					container = baseElement.querySelector(selector);
					if (container) {
						break;
					}
				}
				
				// If still no container found, try to find the title and place after it
				if (!container) {
					const titleLink = baseElement.querySelector(CONFIG.SELECTORS.standardVideoLinks);
					if (titleLink) {
						container = titleLink.closest("#details, .details") || titleLink.parentNode;
					}
				}
			} else {
				// Try specific containers in order of preference for regular videos
				const selectors = [
					":scope > #meta",
					"#meta",
					"#metadata-line", 
					"#info.ytd-video-meta-block",
					"#meta .ytd-video-meta-block",
					"#details .metadata",
					"#meta #metadata-line",
					"ytd-video-meta-block#meta"
				];
				
				for (const selector of selectors) {
					container = baseElement.querySelector(selector);
					if (container) break;
				}
				
				// Fallback strategies
				if (!container) {
					container = baseElement.querySelector(":scope > #details, #details") ||
								baseElement.querySelector(":scope > #dismissible, #dismissible");
				}
				
				if (!container) {
					const titleLink = baseElement.querySelector(CONFIG.SELECTORS.standardVideoLinks);
					if (titleLink) {
						container = titleLink.closest("#info, #details, #meta, .meta, #dismissible") ||
									titleLink.parentNode;
					}
				}
			}
		}
	} catch (error) {
		console.warn(`[Felo] Error finding button placement for ${elementType}:`, error);
	}

	return { container, insertionPoint };
}

// === BUTTON CREATION AND MANAGEMENT ===

/**
 * Remove all existing AI buttons (Felo and Gemini) from the page
 */
function removeAllAIButtons() {
	try {
		const existingButtons = document.querySelectorAll(`.${CONFIG.CLASSES.button}, .${CONFIG.CLASSES.geminiButton}`);
		existingButtons.forEach(button => {
			try {
				button.remove();
			} catch (error) {
				console.warn("[Felo] Error removing button:", error);
			}
		});
		
		// Also remove button containers
		const existingContainers = document.querySelectorAll(`.${CONFIG.CLASSES.buttonContainer}`);
		existingContainers.forEach(container => {
			try {
				if (container.children.length === 0) {
					container.remove();
				}
			} catch (error) {
				console.warn("[Felo] Error removing container:", error);
			}
		});
	} catch (error) {
		console.error("[Felo] Error during button cleanup:", error);
	}
}

/**
 * Create Felo search button with pre-extracted URL
 */
function createFeloButton(elementType, videoUrl) {
	// Use <a> tag instead of button for better browser integration
	const button = document.createElement("a");
	button.classList.add(CONFIG.CLASSES.button);
	
	// Set href to Felo search URL
	if (videoUrl) {
		button.href = `https://felo.ai/search?q=${encodeURIComponent(videoUrl)}`;
		button.target = "_blank"; // Open in new tab
		button.rel = "noopener noreferrer"; // Security best practice
	} else {
		// Fallback if no URL available
		button.href = "#";
		button.addEventListener("click", (e) => e.preventDefault());
	}
	
	if (elementType === "shortsLockup" || elementType === "shortsReel") {
		button.classList.add(CONFIG.CLASSES.shortsButton);
	}

	try {
		// Create icon
		const icon = document.createElement("img");
		icon.src = chrome.runtime.getURL("icons/icon.svg");
		icon.alt = getI18nMessage("iconAltText", "Felo Search Icon");
		icon.classList.add(CONFIG.CLASSES.icon);

		// Handle icon loading error
		icon.onerror = () => {
			console.warn(getI18nMessage("errorIconLoad", "Failed to load icon:"), icon.src);
			button.innerHTML = "";
			button.appendChild(document.createTextNode(getI18nMessage("fallbackButtonText", "🔍felo")));
		};

		// Assemble button content
		button.appendChild(icon);
		button.appendChild(document.createTextNode(` ${getI18nMessage("buttonText", "felo")}`));

	} catch (error) {
		console.error(getI18nMessage("errorIconUrl", "Error getting icon URL:"), error);
		button.textContent = getI18nMessage("fallbackButtonText", "🔍felo");
	}

	return button;
}

/**
 * Create Gemini search button with pre-extracted URL
 */
function createGeminiButton(elementType, videoUrl) {
	// Use <button> tag for better functionality
	const button = document.createElement("button");
	button.classList.add(CONFIG.CLASSES.geminiButton);
	button.type = "button";
	
	if (elementType === "shortsLockup" || elementType === "shortsReel") {
		button.classList.add(CONFIG.CLASSES.shortsButton);
	}

	try {
		// Create icon
		const icon = document.createElement("img");
		icon.src = chrome.runtime.getURL("icons/gemini.svg");
		icon.alt = getI18nMessage("geminiIconAltText", "Gemini Search Icon");
		icon.classList.add(CONFIG.CLASSES.geminiIcon);

		// Handle icon loading error
		icon.onerror = () => {
			console.warn(getI18nMessage("errorIconLoad", "Failed to load icon:"), icon.src);
			button.innerHTML = "";
			button.appendChild(document.createTextNode(getI18nMessage("geminiFallbackButtonText", "🤖gemini")));
		};

		// Assemble button content
		button.appendChild(icon);
		button.appendChild(document.createTextNode(` ${getI18nMessage("geminiButtonText", "gemini")}`))

	} catch (error) {
		console.error(getI18nMessage("errorIconUrl", "Error getting icon URL:"), error);
		button.textContent = getI18nMessage("geminiFallbackButtonText", "🤖gemini");
	}

	// Add click handler
	button.addEventListener("click", async (event) => {
		event.preventDefault();
		event.stopPropagation();
		
		if (videoUrl) {
			const userPrompt = state.settings.geminiPrompt || CONFIG.GEMINI.prompt;
			const fullPrompt = `${videoUrl}\n\n${userPrompt}`;
			
			try {
				// Store prompt in chrome storage for the Gemini content script
				await chrome.storage.local.set({ geminiPrompt: fullPrompt });
				
				// Show temporary success feedback
				const originalIcon = button.querySelector('img');
				const originalText = button.childNodes[1] ? button.childNodes[1].textContent : ` ${getI18nMessage("geminiButtonText", "gemini")}`;
				
				button.innerHTML = "";
				button.appendChild(document.createTextNode(getI18nMessage("geminiProcessing", "처리중...")));
				button.style.backgroundColor = "#1a73e8";
				button.style.color = "white";
				
				setTimeout(() => {
					button.innerHTML = "";
					if (originalIcon) {
						button.appendChild(originalIcon.cloneNode(true));
					}
					button.appendChild(document.createTextNode(originalText));
					button.style.backgroundColor = "";
					button.style.color = "";
				}, 2000);
				
				// Open Gemini page - the content script will handle auto-input
				window.open(CONFIG.GEMINI.baseUrl, "_blank");
				
			} catch (storageError) {
				console.warn("Failed to store prompt:", storageError);
				
				// Fallback: copy to clipboard
				try {
					await navigator.clipboard.writeText(fullPrompt);
					alert(getI18nMessage("geminiAutoInputFailed", "자동 입력에 실패했습니다. 클립보드에 복사된 내용을 수동으로 붙여넣어 주세요."));
					window.open(CONFIG.GEMINI.baseUrl, "_blank");
				} catch (clipboardError) {
					// Ultimate fallback: show prompt in alert
					alert(`${getI18nMessage("geminiPromptFailed", "프롬프트를 처리할 수 없습니다. 수동으로 복사해주세요:")} \n\n${fullPrompt}`);
					window.open(CONFIG.GEMINI.baseUrl, "_blank");
				}
			}
		} else {
			console.warn(getI18nMessage("errorNoUrl", "No URL available for this button"));
		}
	});

	return button;
}

/**
 * Add click handler to button (simplified version for fallback cases)
 */
function addButtonClickHandler(button) {
	// Only add handler for Felo buttons with href="#" (fallback case)
	// Gemini buttons already have their own click handlers
	if (button.classList.contains(CONFIG.CLASSES.button) && button.href && button.href.endsWith("#")) {
		button.addEventListener("click", (event) => {
			event.preventDefault();
			console.warn(getI18nMessage("errorNoUrl", "No URL available for this button"));
		});
	}
	// For Felo buttons with valid href, browser handles the navigation automatically
	// For Gemini buttons, they have their own click handlers already attached
}

/**
 * Add buttons to element if not already present
 */
function addButtonToElement(targetElement, useLocationHref = false) {
	// Skip if already processed (multiple checks for reliability)
	if (state.processedElements.has(targetElement)) {
		return;
	}
	
	// Additional check: see if element has our data attribute
	if (targetElement.dataset.feloProcessed === 'true') {
		state.processedElements.add(targetElement);
		return;
	}

	// Check if element is visible
	if (targetElement.offsetParent === null) {
		return;
	}

	// Analyze element
	const { elementType, baseElement } = useLocationHref 
		? { elementType: "watchTitle", baseElement: targetElement }
		: analyzeElement(targetElement);

	if (!baseElement || elementType === "unknown") {
		return;
	}

	// Find button placement first to check if buttons already exist
	const { container: buttonContainer, insertionPoint } = findButtonPlacement(baseElement, elementType);

	if (!buttonContainer) {
		return;
	}

	// Check if buttons already exist in this container
	const existingContainer = buttonContainer.querySelector(`.${CONFIG.CLASSES.buttonContainer}`);
	if (existingContainer) {
		state.processedElements.add(targetElement);
		targetElement.dataset.feloProcessed = 'true';
		return;
	}

	// Extract URL at button creation time
	const videoUrl = extractVideoUrl(baseElement, elementType);
	
	// Skip if we can't extract a valid URL
	if (!videoUrl) {
		return;
	}

	try {
		// Create button container
		const aiButtonsContainer = document.createElement("div");
		aiButtonsContainer.classList.add(CONFIG.CLASSES.buttonContainer);
		aiButtonsContainer.style.cssText = `
			display: flex;
			gap: 8px;
			align-items: center;
			margin-top: 4px;
		`;

		// Create buttons based on user settings
		const buttonsToAdd = [];
		
		if (state.settings.enableFelo) {
			const feloButton = createFeloButton(elementType, videoUrl);
			addButtonClickHandler(feloButton);
			buttonsToAdd.push(feloButton);
		}
		
		if (state.settings.enableGemini) {
			const geminiButton = createGeminiButton(elementType, videoUrl);
			buttonsToAdd.push(geminiButton);
		}
		
		// Skip if no buttons to add
		if (buttonsToAdd.length === 0) {
			return;
		}

		// Add buttons to container
		buttonsToAdd.forEach(button => {
			aiButtonsContainer.appendChild(button);
		});

		// Insert button container
		if (insertionPoint) {
			buttonContainer.insertBefore(aiButtonsContainer, insertionPoint);
		} else {
			buttonContainer.appendChild(aiButtonsContainer);
		}

		// Mark as processed with multiple methods
		state.processedElements.add(targetElement);
		targetElement.dataset.feloProcessed = 'true';

	} catch (error) {
		console.error(getI18nMessage("errorInsertButton", "Error inserting buttons:"), error, "Container:", buttonContainer);
	}
}

// === MAIN PROCESSING FUNCTIONS ===

/**
 * Process all potential elements on the page
 */
async function processAllElements() {
	if (state.isProcessing) {
		return;
	}

	state.isProcessing = true;

	try {
		// Wait for page to be ready
		await waitForPageReady();

		// Process main video elements
		const potentialElementsSelector = CONFIG.SELECTORS.potentialElements.join(", ");
		const elements = document.querySelectorAll(potentialElementsSelector);
		
		// Filter out already processed elements
		const unprocessedElements = Array.from(elements).filter(el => 
			!state.processedElements.has(el) && 
			el.dataset.feloProcessed !== 'true' && 
			el.offsetParent !== null
		);
		
		for (const element of unprocessedElements) {
			addButtonToElement(element, false);
		}

		// Process sidebar video elements specifically (more aggressive for watch pages)
		const sidebarContainers = document.querySelectorAll(CONFIG.SELECTORS.sidebarContainers.join(", "));
		
		for (const container of sidebarContainers) {
			// Method 1: Look for standard video renderer elements
			const sidebarVideos = container.querySelectorAll(potentialElementsSelector);
			const unprocessedSidebarVideos = Array.from(sidebarVideos).filter(el => 
				!state.processedElements.has(el) && 
				el.dataset.feloProcessed !== 'true' && 
				el.offsetParent !== null
			);
			
			for (const video of unprocessedSidebarVideos) {
				addButtonToElement(video, false);
			}
			
			// Method 2: Look for ANY element with video links - more aggressive approach
			if (unprocessedSidebarVideos.length === 0 && sidebarVideos.length === 0) {
				// Find all elements that contain video links
				const allElements = Array.from(container.querySelectorAll('*'));
				const elementsWithVideoLinks = new Set();
				
				// First pass: find all elements that contain video links
				for (const el of allElements) {
					// Skip if already processed
					if (state.processedElements.has(el) || 
						el.dataset.feloProcessed === 'true' || 
						el.offsetParent === null) {
						continue;
					}
					
					const videoLinks = el.querySelectorAll('a[href*="/watch?v="], a[href*="/shorts/"]');
					if (videoLinks.length > 0) {
						// Find the most appropriate container for this video
						// Usually it's the element that contains both thumbnail and title
						let videoContainer = el;
						
						// Try to find a parent that contains both image and text content
						let current = el;
						let searchDepth = 0;
						while (current && searchDepth < 5) {
							const hasImage = current.querySelector('img, [style*="background-image"]');
							const hasTitle = current.querySelector('a[href*="/watch"], h3, [class*="title"]');
							
							if (hasImage && hasTitle && videoLinks.length > 0) {
								videoContainer = current;
								break;
							}
							current = current.parentElement;
							searchDepth++;
						}
						
						if (!state.processedElements.has(videoContainer)) {
							elementsWithVideoLinks.add(videoContainer);
						}
					}
				}
				
				// Process each unique video container
				for (const videoEl of elementsWithVideoLinks) {
					if (!videoEl.querySelector(`.${CONFIG.CLASSES.button}`)) {
						addButtonToElement(videoEl, false);
					}
				}
			}
		}

		// Handle watch page title separately
		const mainTitleElement = document.querySelector(CONFIG.SELECTORS.watchTitles);
		if (mainTitleElement && 
			mainTitleElement.offsetParent !== null && 
			!state.processedElements.has(mainTitleElement) && 
			mainTitleElement.dataset.feloProcessed !== 'true') {
			addButtonToElement(mainTitleElement, true);
		}

	} catch (error) {
		console.error("[Felo] Error processing elements:", error);
	} finally {
		state.isProcessing = false;
	}
}

/**
 * Debounced version of processAllElements
 */
const debouncedProcessElements = debounce(processAllElements, CONFIG.TIMING.debounceMs);

/**
 * Handle YouTube navigation events
 */
function handleYouTubeNavigation() {
	// Remove all existing buttons to prevent stale URLs
	removeAllAIButtons();
	
	// Clear processed elements cache on navigation
	state.processedElements = new WeakSet();
	
	// Also clear data attributes from all elements
	try {
		const processedElements = document.querySelectorAll('[data-felo-processed="true"]');
		processedElements.forEach(el => {
			delete el.dataset.feloProcessed;
		});
	} catch (error) {
		// Ignore errors during cleanup
	}
	
	// Process elements after navigation with a small delay to ensure content is loaded
	setTimeout(() => {
		debouncedProcessElements();
	}, 100);
}

/**
 * Setup DOM mutation observer
 */
function setupMutationObserver() {
	if (state.observer) {
		state.observer.disconnect();
	}

	let observerTimeout = null;

	state.observer = new MutationObserver((mutationsList) => {
		// Clear any existing timeout
		if (observerTimeout) {
			clearTimeout(observerTimeout);
		}

		// Debounce the observer itself to prevent rapid-fire triggers
		observerTimeout = setTimeout(() => {
			let shouldProcess = false;
			let hasNewVideoElements = false;

			for (const mutation of mutationsList) {
				if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
					for (const node of mutation.addedNodes) {
						if (node.nodeType === 1) { // Element node
							const potentialElementsSelector = CONFIG.SELECTORS.potentialElements.join(", ");
							
							// Check if node itself matches video elements
							if (node.matches(potentialElementsSelector)) {
								if (!state.processedElements.has(node) && node.dataset.feloProcessed !== 'true') {
									hasNewVideoElements = true;
									shouldProcess = true;
									break;
								}
							} 
							// Check if node contains video elements (for infinite scroll containers)
							else if (node.querySelector) {
								const newElements = Array.from(node.querySelectorAll(potentialElementsSelector))
									.filter(el => !state.processedElements.has(el) && el.dataset.feloProcessed !== 'true');
								if (newElements.length > 0) {
									hasNewVideoElements = true;
									shouldProcess = true;
									break;
								}
							}
							// Special handling for YouTube grid containers (infinite scroll)
							else if (node.matches('ytd-rich-grid-renderer, ytd-rich-section-renderer, ytd-item-section-renderer, ytd-continuation-item-renderer') ||
									 node.querySelector('ytd-rich-grid-renderer, ytd-rich-section-renderer, ytd-item-section-renderer, ytd-continuation-item-renderer')) {
								shouldProcess = true;
								hasNewVideoElements = true;
								break;
							}
							// Special handling for sidebar containers (watch page)
							else if (node.matches('ytd-watch-next-secondary-results-renderer, ytd-compact-video-renderer, ytd-compact-autoplay-renderer') ||
									 node.querySelector('ytd-watch-next-secondary-results-renderer, ytd-compact-video-renderer, ytd-compact-autoplay-renderer')) {
								shouldProcess = true;
								hasNewVideoElements = true;
								
								// If we're on a watch page and this is sidebar content, also setup scroll listener
								if (window.location.href.includes('/watch')) {
									setTimeout(() => {
										setupSidebarScrollListener();
									}, 100);
								}
								break;
							}
						}
					}
				}
				if (shouldProcess) break;
			}

			// Only process if we found genuinely new video elements
			if (shouldProcess && hasNewVideoElements) {
				debouncedProcessElements();
			}
		}, 200); // 200ms debounce for the observer itself
	});

	// Use more conservative observation settings
	state.observer.observe(document.body, { 
		childList: true, 
		subtree: true,
		// Only observe child list changes, not attributes or character data
		attributes: false,
		characterData: false
	});
}

/**
 * Setup YouTube-specific event listeners
 */
function setupYouTubeEventListeners() {
	// Listen for YouTube SPA navigation events
	window.addEventListener("yt-navigate-start", handleYouTubeNavigation);
	window.addEventListener("yt-navigate-finish", handleYouTubeNavigation);
	
	// Special handling for watch page sidebar loading
	window.addEventListener("yt-navigate-finish", () => {
		// Check if we're on a watch page
		if (window.location.href.includes('/watch')) {
			// Wait a bit longer for sidebar to load on watch pages
			setTimeout(() => {
				debouncedProcessElements();
				// Also do a force check
				setTimeout(() => {
					forceCheckWatchPage();
					// Setup sidebar scroll listener
					setupSidebarScrollListener();
				}, 1000);
			}, 500);
		}
	});
	
	// Additional watch page detection via URL changes
	let watchPageLastUrl = location.href;
	const watchPageChecker = () => {
		const currentUrl = location.href;
		if (currentUrl !== watchPageLastUrl) {
			watchPageLastUrl = currentUrl;
			if (currentUrl.includes('/watch')) {
				setTimeout(() => {
					forceCheckWatchPage();
				}, 1000);
			}
		}
	};
	
	// Check every 2 seconds for URL changes (backup)
	setInterval(watchPageChecker, 2000);
	
	// Listen for browser navigation events
	window.addEventListener("popstate", handleYouTubeNavigation);
	window.addEventListener("hashchange", handleYouTubeNavigation);
	
	// Listen for scroll events to catch infinite scroll content loading
	let scrollTimeout = null;
	const handleScroll = () => {
		// Clear existing timeout
		if (scrollTimeout) {
			clearTimeout(scrollTimeout);
		}
		
		// Debounce scroll processing
		scrollTimeout = setTimeout(() => {
			// Only process if we're near the bottom of the page (infinite scroll trigger)
			const scrollPosition = window.scrollY + window.innerHeight;
			const documentHeight = document.documentElement.scrollHeight;
			const distanceFromBottom = documentHeight - scrollPosition;
			
			// If we're within 1000px of the bottom, check for new content
			if (distanceFromBottom < 1000) {
				debouncedProcessElements();
			}
		}, 500);
	};
	
	window.addEventListener("scroll", handleScroll, { passive: true });
	
	// Additional backup: periodically check for new elements when scrolling stops
	let lastScrollTime = 0;
	const checkAfterScroll = () => {
		const now = Date.now();
		lastScrollTime = now;
		setTimeout(() => {
			// If no scroll happened in the last 1 second, do a final check
			if (Date.now() - lastScrollTime >= 950) {
				debouncedProcessElements();
			}
		}, 1000);
	};
	
	window.addEventListener("scroll", checkAfterScroll, { passive: true });
	
	// Also listen for window resize which can trigger layout changes
	window.addEventListener("resize", () => {
		setTimeout(() => {
			debouncedProcessElements();
		}, 300);
	});

	// Listen for page state changes
	document.addEventListener("readystatechange", () => {
		if (document.readyState === "complete") {
			debouncedProcessElements();
		}
	});

	// Listen for URL changes (pushState/popState) with improved detection
	let lastUrl = location.href;
	const urlChangeObserver = new MutationObserver(() => {
		const url = location.href;
		if (url !== lastUrl) {
			lastUrl = url;
			handleYouTubeNavigation();
		}
	});
	
	// Observe document title changes as YouTube often updates title on navigation
	urlChangeObserver.observe(document.querySelector('title') || document.head, { 
		childList: true, 
		subtree: true, 
		characterData: true 
	});
	
	// Also observe the main content area for structural changes
	const mainContentObserver = new MutationObserver((mutations) => {
		let significantChange = false;
		
		for (const mutation of mutations) {
			// Check for removal or addition of major container elements
			if (mutation.type === 'childList') {
				for (const node of [...mutation.addedNodes, ...mutation.removedNodes]) {
					if (node.nodeType === 1 && (
						node.matches('ytd-browse, ytd-watch-flexy, ytd-search') ||
						node.querySelector('ytd-browse, ytd-watch-flexy, ytd-search')
					)) {
						significantChange = true;
						break;
					}
				}
			}
			if (significantChange) break;
		}
		
		if (significantChange) {
			handleYouTubeNavigation();
		}
	});
	
	// Observe the main app container
	const appContainer = document.querySelector('ytd-app');
	if (appContainer) {
		mainContentObserver.observe(appContainer, {
			childList: true,
			subtree: false // Only watch direct children to avoid too many events
		});
	}
}

/**
 * Initialize the extension
 */
async function initialize() {
	if (state.isInitialized) {
		return;
	}

	console.log("[Felo] Initializing YouTube Felo Search extension...");

	try {
		// Load user settings first
		await loadUserSettings();
		
		// Setup storage change listener
		chrome.storage.onChanged.addListener((changes, namespace) => {
			if (namespace === 'sync' || namespace === 'local') {
				// 약간의 지연을 두고 설정 재로드
				setTimeout(async () => {
					await loadUserSettings();
					// Remove all existing buttons and re-process
					removeAllAIButtons();
					state.processedElements = new WeakSet();
					// 기존 processed 상태 초기화
					try {
						const processedElements = document.querySelectorAll('[data-felo-processed="true"]');
						processedElements.forEach(el => {
							delete el.dataset.feloProcessed;
						});
					} catch (error) {
						// Ignore errors during cleanup
					}
					debouncedProcessElements();
				}, 100);
			}
		});
		
		// Setup event listeners
		setupYouTubeEventListeners();
		
		// Setup mutation observer
		setupMutationObserver();
		
		// Initial processing
		await processAllElements();
		
		// If we're already on a watch page, do additional check
		if (window.location.href.includes('/watch')) {
			setTimeout(() => {
				forceCheckWatchPage();
			}, 2000);
		}

		state.isInitialized = true;
		console.log("[Felo] Extension initialized successfully");

	} catch (error) {
		console.error("[Felo] Failed to initialize extension:", error);
	}
}

/**
 * Cleanup function
 */
function cleanup() {
	console.log("[Felo] Cleaning up extension...");
	
	// Remove all buttons
	removeAllAIButtons();
	
	if (state.observer) {
		state.observer.disconnect();
		state.observer = null;
	}
	
	if (state.debounceTimer) {
		clearTimeout(state.debounceTimer);
		state.debounceTimer = null;
	}
	
	if (state.retryTimer) {
		clearInterval(state.retryTimer);
		state.retryTimer = null;
	}
	
	// Remove YouTube event listeners
	window.removeEventListener("yt-navigate-start", handleYouTubeNavigation);
	window.removeEventListener("yt-navigate-finish", handleYouTubeNavigation);
	window.removeEventListener("popstate", handleYouTubeNavigation);
	window.removeEventListener("hashchange", handleYouTubeNavigation);
	
	state.isInitialized = false;
}

// === INITIALIZATION ===

// Start initialization when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initialize);
} else {
	initialize();
}

// Cleanup on page unload
window.addEventListener("beforeunload", cleanup);

/**
 * Force check for watch page elements (more aggressive)
 */
function forceCheckWatchPage() {
	// Check if we're actually on a watch page
	if (!window.location.href.includes('/watch')) {
		return;
	}
	
	// Check for main video title
	const titleSelectors = [
		"h1.ytd-watch-metadata > yt-formatted-string",
		"#video-title.ytd-watch-metadata", 
		"#info-contents h1 yt-formatted-string",
		"h1.title",
		"ytd-watch-metadata h1"
	];
	
	let mainTitle = null;
	for (const selector of titleSelectors) {
		mainTitle = document.querySelector(selector);
		if (mainTitle) {
			break;
		}
	}
	
	if (mainTitle && 
		mainTitle.offsetParent !== null && 
		!state.processedElements.has(mainTitle) && 
		mainTitle.dataset.feloProcessed !== 'true') {
		addButtonToElement(mainTitle, true);
	}
	
	// Check for sidebar
	const sidebarSelectors = [
		"#secondary",
		"ytd-watch-next-secondary-results-renderer",
		"#related",
		"#secondary-inner"
	];
	
	let sidebar = null;
	for (const selector of sidebarSelectors) {
		sidebar = document.querySelector(selector);
		if (sidebar) {
			break;
		}
	}
	
	if (sidebar) {
		// Look for video elements in sidebar
		const videoElements = sidebar.querySelectorAll(CONFIG.SELECTORS.potentialElements.join(", "));
		
		videoElements.forEach((el, index) => {
			if (!state.processedElements.has(el) && el.dataset.feloProcessed !== 'true') {
				addButtonToElement(el, false);
			}
		});
		
		// If no standard elements found, try aggressive search
		if (videoElements.length === 0) {
			const allLinks = sidebar.querySelectorAll('a[href*="/watch?v="], a[href*="/shorts/"]');
			
			const processedContainers = new Set();
			allLinks.forEach((link, index) => {
				let container = link.closest('div, ytd-compact-video-renderer, ytd-video-renderer');
				if (container && !processedContainers.has(container) && !container.querySelector(`.${CONFIG.CLASSES.buttonContainer}`)) {
					processedContainers.add(container);
					addButtonToElement(container, false);
				}
			});
		}
		
		// Setup sidebar scroll listener for future content
		setupSidebarScrollListener();
	}
}

/**
 * Setup sidebar scroll listener for watch pages
 */
function setupSidebarScrollListener() {
	// Remove existing sidebar listeners
	if (window.sidebarScrollTimeout) {
		clearTimeout(window.sidebarScrollTimeout);
	}
	
	// Find sidebar container
	const sidebarSelectors = [
		"#secondary",
		"ytd-watch-next-secondary-results-renderer", 
		"#related",
		"#secondary-inner"
	];
	
	let sidebarContainer = null;
	for (const selector of sidebarSelectors) {
		sidebarContainer = document.querySelector(selector);
		if (sidebarContainer) {
			break;
		}
	}
	
	if (!sidebarContainer) {
		return;
	}
	
	// Create sidebar scroll handler
	const handleSidebarScroll = (event) => {
		if (window.sidebarScrollTimeout) {
			clearTimeout(window.sidebarScrollTimeout);
		}
		
		window.sidebarScrollTimeout = setTimeout(() => {
			// Only process sidebar area
			const newVideos = sidebarContainer.querySelectorAll(CONFIG.SELECTORS.potentialElements.join(", "));
			const unprocessedVideos = Array.from(newVideos).filter(el => 
				!state.processedElements.has(el) && 
				el.dataset.feloProcessed !== 'true' && 
				el.offsetParent !== null
			);
			
			if (unprocessedVideos.length > 0) {
				unprocessedVideos.forEach(video => {
					addButtonToElement(video, false);
				});
			}
			
			// Also try aggressive search for new elements
			const newLinks = sidebarContainer.querySelectorAll('a[href*="/watch?v="], a[href*="/shorts/"]');
			const processedContainers = new Set();
			
			newLinks.forEach(link => {
				let container = link.closest('div, ytd-compact-video-renderer, ytd-video-renderer');
				if (container && 
					!processedContainers.has(container) && 
					!state.processedElements.has(container) &&
					container.dataset.feloProcessed !== 'true' &&
					!container.querySelector(`.${CONFIG.CLASSES.buttonContainer}`)) {
					
					processedContainers.add(container);
					addButtonToElement(container, false);
				}
			});
			
		}, 300);
	};
	
	// Add scroll listener to sidebar
	sidebarContainer.addEventListener('scroll', handleSidebarScroll, { passive: true });
	
	// Also listen to window scroll (in case sidebar scrolls with main page)
	window.addEventListener('scroll', () => {
		if (window.location.href.includes('/watch')) {
			handleSidebarScroll();
		}
	}, { passive: true });
}
