// Define selectors globally
const potentialElements = [
	"ytd-rich-grid-media",
	"ytd-video-renderer",
	"ytd-compact-video-renderer",
	"ytd-grid-video-renderer",
	"ytd-playlist-panel-video-renderer",
	"ytd-reel-video-renderer",
	"ytd-rich-item-renderer",
];
const potentialElementsSelector = potentialElements.join(", ");
const standardVideoLinkSelectors = "a#video-title, #video-title-link";
const shortsLockupLinkSelector = "a.shortsLockupViewModelHostEndpoint";
const shortsReelLinkSelectors =
	'a#endpoint[href*="/shorts/"], .reel-player-overlay-action a[href*="/shorts/"]';
const watchTitleSelectors =
	"h1.ytd-watch-metadata > yt-formatted-string, #video-title.ytd-watch-metadata, #info-contents h1 yt-formatted-string";

// --- Helper Function to get Element Info (Type and Base Element) ---
function getElementInfo(targetElement) {
	let baseElement = null;
	let elementType = "unknown";

	if (targetElement.matches("ytd-reel-video-renderer")) {
		elementType = "shortsReel";
		baseElement = targetElement;
	} else if (targetElement.matches("ytm-shorts-lockup-view-model")) {
		elementType = "shortsLockup";
		baseElement = targetElement;
	} else if (targetElement.matches("ytd-rich-item-renderer")) {
		const shortsLockup = targetElement.querySelector(
			"ytm-shorts-lockup-view-model",
		);
		const gridMedia = targetElement.querySelector("ytd-rich-grid-media");
		if (shortsLockup) {
			elementType = "shortsLockup";
			baseElement = shortsLockup;
		} else if (gridMedia) {
			const innerShorts = gridMedia.querySelector(
				"ytm-shorts-lockup-view-model",
			);
			if (innerShorts) {
				elementType = "shortsLockup";
				baseElement = innerShorts;
			} else {
				elementType = "standardVideo";
				baseElement = gridMedia; // Base is the grid media itself
			}
		}
	} else if (targetElement.matches("ytd-rich-grid-media")) {
		const innerShorts = targetElement.querySelector(
			"ytm-shorts-lockup-view-model",
		);
		if (innerShorts) {
			elementType = "shortsLockup";
			baseElement = innerShorts;
		} else {
			elementType = "standardVideo";
			baseElement = targetElement; // Base is the grid media itself
		}
	} else if (
		targetElement.matches(
			"ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-playlist-panel-video-renderer",
		)
	) {
		elementType = "standardVideo";
		baseElement = targetElement;
	} else if (targetElement.matches(watchTitleSelectors)) {
		elementType = "watchTitle";
		baseElement = targetElement;
	}

	return { elementType, baseElement };
}

// --- Helper Function to Extract Video URL from a determined baseElement ---
function getVideoUrlFromElement(baseElement, elementType) {
	if (!baseElement || elementType === "unknown") return null;

	let videoUrl = null;
	let titleLinkElement = null;

	if (elementType === "watchTitle") {
		videoUrl = window.location.href;
	} else if (elementType === "shortsLockup") {
		titleLinkElement = baseElement.querySelector(shortsLockupLinkSelector);
		if (titleLinkElement) videoUrl = titleLinkElement.href;
	} else if (elementType === "shortsReel") {
		try {
			// Data object approach first
			const dataHost = baseElement.querySelector("#overlay") || baseElement;
			const endpointData =
				dataHost?.__data?.navigationEndpoint ||
				dataHost?.__data?.data?.navigationEndpoint ||
				dataHost?.__data?.endpoint;
			if (endpointData?.commandMetadata?.webCommandMetadata?.url) {
				videoUrl = endpointData.commandMetadata.webCommandMetadata.url;
			} else if (endpointData?.watchEndpoint?.videoId) {
				videoUrl = `/shorts/${endpointData.watchEndpoint.videoId}`;
			}
		} catch (e) {
			/* ignore */
		}
		if (!videoUrl) {
			// DOM fallback
			titleLinkElement = baseElement.querySelector(shortsReelLinkSelectors);
			if (titleLinkElement) videoUrl = titleLinkElement.href;
		}
	} else if (elementType === "standardVideo") {
		// Handles renderers and grid media containing standard video
		titleLinkElement = baseElement.querySelector(standardVideoLinkSelectors);
		if (titleLinkElement) videoUrl = titleLinkElement.href;
	}

	// --- Final check and formatting ---
	if (!videoUrl) return null;
	if (videoUrl.startsWith("/")) videoUrl = `https://www.youtube.com${videoUrl}`;

	if (
		videoUrl.includes("youtube.com/watch") ||
		videoUrl.includes("youtube.com/shorts/")
	) {
		return videoUrl;
	}
	return null;
}

// --- Helper Function to Find Button Placement ---
function findButtonPlacement(baseElement, elementType) {
	if (!baseElement || elementType === "unknown")
		return { container: null, insertionPoint: null };

	let container = null;
	let insertionPoint = null;

	if (elementType === "watchTitle") {
		container =
			baseElement.closest(
				"#title, #info-contents > ytd-video-primary-info-renderer > #container > #info > #info-text",
			) || document.querySelector("#info-contents #info-text");
	} else if (elementType === "shortsLockup") {
		const subhead = baseElement.querySelector(
			"div.shortsLockupViewModelHostMetadataSubhead",
		);
		if (subhead) {
			container = subhead.parentNode;
			insertionPoint = subhead.nextSibling;
		} else {
			container = baseElement.querySelector(
				".shortsLockupViewModelHostOutsideMetadata",
			);
		}
	} else if (elementType === "shortsReel") {
		container =
			baseElement.querySelector(
				"#metadata-line, #factoids, .reel-video-meta-info",
			) || baseElement.querySelector(".reel-player-overlay-actions, #actions");
	} else if (elementType === "standardVideo") {
		// Try specific containers first (works for renderers and grid-media)
		container = baseElement.querySelector(
			":scope > #meta, " + // Grid media often has #meta directly under
				"#meta, " + // Common container
				"#metadata-line, " + // Common in compact/list view
				"#info.ytd-video-meta-block, " + // Sometimes used
				"#meta .ytd-video-meta-block, " + // Common pattern
				"#details .metadata, " + // Another pattern
				"#meta #metadata-line, " + // Nested metadata line
				"ytd-video-meta-block#meta", // Explicit combo
		);
		if (!container) {
			container = baseElement.querySelector(":scope > #details, #details");
			if (!container) {
				container = baseElement.querySelector(
					":scope > #dismissible, #dismissible",
				);
			}
		}
		if (!container) {
			// Fallback using closest from title
			const titleLink = baseElement.querySelector(standardVideoLinkSelectors);
			if (titleLink) {
				container = titleLink.closest(
					"#info, #details, #meta, .meta, #dismissible",
				);
				if (!container) {
					// Last resort
					container = titleLink.parentNode;
				}
			}
		}
	}

	return { container, insertionPoint };
}

// --- Main Function to Add/Check Button ---
function addFeloButton(targetElement, useLocationHref = false) {
	// 1. Get Element Info
	const { elementType, baseElement } = useLocationHref
		? { elementType: "watchTitle", baseElement: targetElement }
		: getElementInfo(targetElement);

	if (!baseElement || elementType === "unknown") {
		// console.log('[Felo Button] Could not identify element type or base element for:', targetElement);
		return;
	}

	// 2. Find Placement
	const { container: buttonContainer, insertionPoint } = findButtonPlacement(
		baseElement,
		elementType,
	);

	if (!buttonContainer) {
		// console.warn('[Felo Button] Button container could not be determined for:', baseElement, 'Type:', elementType);
		return;
	}

	// 3. Check if Button Already Exists
	let existingButton = buttonContainer.querySelector(
		":scope > .felo-search-button",
	);
	if (
		!existingButton &&
		elementType === "shortsLockup" &&
		insertionPoint &&
		insertionPoint.previousSibling?.matches(
			"div.shortsLockupViewModelHostMetadataSubhead",
		)
	) {
		if (
			insertionPoint.previousSibling.nextElementSibling?.classList.contains(
				"felo-search-button",
			)
		) {
			existingButton = insertionPoint.previousSibling.nextElementSibling;
		}
	}
	if (!existingButton) {
		existingButton = buttonContainer.querySelector(".felo-search-button"); // Broader check
	}

	if (existingButton) {
		// console.log('[Felo Button] Button already exists in container:', buttonContainer);
		return; // Don't add another button
	}

	// 4. Create and Add New Button (only if it doesn't exist)
	// console.log('[Felo Button] Creating new button in:', buttonContainer);
	const button = document.createElement("button");
	button.classList.add("felo-search-button");

	try {
		const icon = document.createElement("img");
		icon.src = chrome.runtime.getURL("icons/icon.svg");
		icon.alt = chrome.i18n.getMessage("iconAltText");
		icon.classList.add("felo-icon"); // Add class for styling

		// Handle image loading error
		icon.onerror = () => {
			// console.warn("[Felo Button] Failed to load icon image:", icon.src);
			console.warn(chrome.i18n.getMessage("errorIconLoad"), icon.src);
			// button.textContent = "🔍felo"; // Fallback to text using i18n
			button.innerHTML = ""; // Clear button content before setting text
			// button.appendChild(document.createTextNode("🔍felo"));
			button.appendChild(
				document.createTextNode(chrome.i18n.getMessage("fallbackButtonText")),
			);
		};

		button.appendChild(icon);
		// button.appendChild(document.createTextNode(" " + chrome.i18n.getMessage("buttonText")));
		button.appendChild(
			document.createTextNode(` ${chrome.i18n.getMessage("buttonText")}`),
		); // Use template literal
	} catch (e) {
		// console.error("[Felo Button] Error getting icon URL or creating button content:", e);
		console.error(chrome.i18n.getMessage("errorIconUrl"), e);
		// button.textContent = "🔍felo"; // Fallback to text if URL fails using i18n
		button.textContent = chrome.i18n.getMessage("fallbackButtonText");
	}

	// button.textContent = "🔍felo"; // Removed
	// const icon = document.createElement("img"); // Moved inside try
	// try { // Restructured try block
	// 	icon.src = chrome.runtime.getURL("icons/icon.svg");
	// } catch (e) {
	// 	console.error("[Felo Button] Error getting icon URL:", e);
	// 	icon.alt = "Felo Search"; // Fallback text if URL fails
	// }
	// icon.alt = "Felo Search"; // Moved inside try
	// icon.style.width = "16px"; // Remove inline style
	// icon.style.height = "16px"; // Remove inline style
	// icon.style.verticalAlign = "middle"; // Remove inline style
	// button.appendChild(icon); // Moved inside try

	// button.classList.add("felo-search-button"); // Moved up
	if (elementType === "shortsLockup" || elementType === "shortsReel") {
		button.classList.add("felo-shorts-button");
	}

	button.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		const clickedButton = event.currentTarget;
		// Find the closest *initial* container element type the button could be in
		const initialElement = clickedButton.closest(
			`${potentialElementsSelector}, #info-contents`,
		); // Add watch page container

		if (initialElement) {
			// Re-determine element info based on the container found on click
			const {
				elementType: clickedElementType,
				baseElement: clickedBaseElement,
			} =
				initialElement.id === "info-contents" ||
				initialElement.closest("#info-contents #info-text")
					? {
							elementType: "watchTitle",
							baseElement:
								clickedButton.closest(watchTitleSelectors) ||
								document.querySelector(watchTitleSelectors),
						}
					: getElementInfo(initialElement);

			const urlToOpen = getVideoUrlFromElement(
				clickedBaseElement,
				clickedElementType,
			);

			if (urlToOpen) {
				const feloSearchUrl = `https://felo.ai/search?q=${encodeURIComponent(urlToOpen)}`;
				window.open(feloSearchUrl, "_blank");
			} else {
				// console.warn(
				// 	"[Felo Button] Could not extract valid URL on click from:",
				// 	clickedBaseElement,
				// 	"Type:",
				// 	clickedElementType,
				// );
				console.warn(
					chrome.i18n.getMessage("errorNoUrl"),
					clickedBaseElement,
					"Type:",
					clickedElementType,
				);
			}
		} else {
			// Fallback for main watch page if somehow closest fails
			const currentUrl = window.location.href;
			if (currentUrl.includes("youtube.com/watch")) {
				console.warn(
					// "[Felo Button] Could not find parent element, using current page URL as fallback.",
					chrome.i18n.getMessage("errorFindParent"), // Using a similar error message key
				);
				const feloSearchUrl = `https://felo.ai/search?q=${encodeURIComponent(currentUrl)}`;
				window.open(feloSearchUrl, "_blank");
			} else {
				// console.warn(
				// 	"[Felo Button] Could not find parent video element and not on watch page.",
				// );
				console.warn(chrome.i18n.getMessage("errorFindParent"));
			}
		}
	});

	// Insert the button
	try {
		if (insertionPoint) {
			buttonContainer.insertBefore(button, insertionPoint);
		} else {
			buttonContainer.appendChild(button);
		}
	} catch (error) {
		// console.error(
		// 	"[Felo Button] Error inserting button",
		// 	error,
		// 	"Container:",
		// 	buttonContainer,
		// );
		console.error(
			chrome.i18n.getMessage("errorInsertButton"),
			error,
			"Container:",
			buttonContainer,
		);
	}
}

// --- processPageElements: Iterates and calls addFeloButton ---
function processPageElements() {
	for (const element of document.querySelectorAll(potentialElementsSelector)) {
		if (element.offsetParent !== null) {
			addFeloButton(element, false);
		}
	}

	// Handle main watch page title separately
	const mainTitleElement = document.querySelector(watchTitleSelectors);
	if (mainTitleElement && mainTitleElement.offsetParent !== null) {
		addFeloButton(mainTitleElement, true);
	}
}

// --- observeDOMChanges and initialScan remain the same ---
function observeDOMChanges() {
	const targetNode = document.body;
	const observer = new MutationObserver((mutationsList) => {
		let potentiallyRelevantChange = false;
		for (const mutation of mutationsList) {
			if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
				for (const node of mutation.addedNodes) {
					// Check if node itself matches or contains matching elements
					if (
						node.nodeType === 1 &&
						(node.matches(potentialElementsSelector) ||
							node.querySelector(potentialElementsSelector))
					) {
						potentiallyRelevantChange = true;
						break;
					}
				}
			}
			if (potentiallyRelevantChange) break;
		}
		if (potentiallyRelevantChange) {
			window.requestAnimationFrame(processPageElements);
		}
	});
	observer.observe(targetNode, { childList: true, subtree: true });
}
function initialScan() {
	setTimeout(() => {
		window.requestAnimationFrame(processPageElements);
	}, 500);
}
initialScan();
observeDOMChanges();

// Removed debugging logs and refactored structure
// Moved element type/base element determination to getElementInfo
// Moved URL extraction to getVideoUrlFromElement
// Moved button container finding to findButtonPlacement
// Simplified addFeloButton structure
// Defined selector constants
