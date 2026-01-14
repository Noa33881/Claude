// Detect browser language automatically
function detectBrowserLanguage() {
    // Supported languages in our app
    const supportedLanguages = ['en', 'tr', 'da', 'es', 'fr', 'de', 'pt', 'ru', 'pl', 'it', 'nl'];

    // Get browser language (e.g., "tr-TR", "en-US", "da-DK")
    const browserLang = navigator.language || navigator.userLanguage;

    // Extract the main language code (e.g., "tr" from "tr-TR")
    const langCode = browserLang.split('-')[0].toLowerCase();

    // Check if we support this language
    if (supportedLanguages.includes(langCode)) {
        return langCode;
    }

    // Default to English if language not supported
    return 'en';
}

// Load translations - auto-detect language if not set
let currentLang = localStorage.getItem('preferredLanguage') || detectBrowserLanguage();

// DOM Elements
const serverInput = document.getElementById('serverInput');
const searchBtn = document.getElementById('searchBtn');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const languageSelect = document.getElementById('languageSelect');
const playersSection = document.getElementById('playersSection');
const playersList = document.getElementById('playersList');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load translations script
    loadTranslations();

    // Set initial language
    languageSelect.value = currentLang;

    // Save detected language to localStorage
    if (!localStorage.getItem('preferredLanguage')) {
        localStorage.setItem('preferredLanguage', currentLang);
    }

    // Create stars
    createStars();

    // Event Listeners
    searchBtn.addEventListener('click', findServerIP);
    serverInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            findServerIP();
        }
    });

    languageSelect.addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem('preferredLanguage', currentLang);
        updateLanguage();
    });
});

// Load translations dynamically
function loadTranslations() {
    const script = document.createElement('script');
    script.src = 'translations.js';
    script.onload = () => {
        updateLanguage();
    };
    document.head.appendChild(script);
}

// Update all text on page based on selected language
function updateLanguage() {
    if (typeof translations === 'undefined' || !translations[currentLang]) {
        return;
    }

    const lang = translations[currentLang];

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (lang[key]) {
            if (element.tagName === 'INPUT') {
                element.placeholder = lang[key];
            } else if (element.tagName === 'TITLE') {
                element.textContent = lang[key];
            } else {
                element.textContent = lang[key];
            }
        }
    });

    // Update placeholder separately
    const placeholderKey = serverInput.getAttribute('data-i18n-placeholder');
    if (placeholderKey && lang[placeholderKey]) {
        serverInput.placeholder = lang[placeholderKey];
    }

    // Update meta tags
    updateMetaTags(lang);

    // Update HTML lang attribute
    document.documentElement.lang = currentLang;
}

// Update SEO meta tags
function updateMetaTags(lang) {
    if (lang.meta_title) {
        document.title = lang.meta_title;
        updateMetaTag('name', 'title', lang.meta_title);
        updateMetaTag('property', 'og:title', lang.meta_title);
        updateMetaTag('property', 'twitter:title', lang.meta_title);
    }

    if (lang.meta_description) {
        updateMetaTag('name', 'description', lang.meta_description);
        updateMetaTag('property', 'og:description', lang.meta_description);
        updateMetaTag('property', 'twitter:description', lang.meta_description);
    }

    if (lang.meta_keywords) {
        updateMetaTag('name', 'keywords', lang.meta_keywords);
    }
}

function updateMetaTag(attr, name, content) {
    let element = document.querySelector(`meta[${attr}="${name}"]`);
    if (element) {
        element.setAttribute('content', content);
    }
}

// Create animated stars
function createStars() {
    const starsContainer = document.getElementById('starsContainer');
    const numberOfStars = 200;

    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.opacity = Math.random();
        starsContainer.appendChild(star);
    }
}

// Get current translation
function t(key) {
    if (typeof translations === 'undefined' || !translations[currentLang]) {
        return key;
    }
    return translations[currentLang][key] || key;
}

// Extract server ID from input
function extractServerID(input) {
    input = input.trim();

    // If it's a full URL
    if (input.includes('cfx.re/join/')) {
        const match = input.match(/cfx\.re\/join\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }

    // If it's just the server ID
    if (/^[a-zA-Z0-9]+$/.test(input)) {
        return input;
    }

    return null;
}

// Main function to find server IP
async function findServerIP() {
    const input = serverInput.value;

    if (!input) {
        showError(t('error_invalid_format'));
        return;
    }

    const serverID = extractServerID(input);

    if (!serverID) {
        showError(t('error_invalid_format'));
        return;
    }

    // Show loading, hide others
    showLoading();
    hideResult();
    hideError();

    try {
        // Fetch from our Node.js backend API
        const response = await fetch(`/api/server/${serverID}`);

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || t('error_not_found'));
        }

        displayResult(data.server, data.players || []);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || t('error_general'));
    } finally {
        hideLoading();
    }
}

// Display server information
function displayResult(server, players = []) {
    // Update server name with status indicator
    const serverNameEl = document.getElementById('serverName');
    serverNameEl.innerHTML = `
        <span class="server-status" aria-label="Server Online"></span>
        ${server.name || 'Unknown Server'}
    `;

    // Update server info
    document.getElementById('serverIP').textContent = server.ip || 'Not Found';
    document.getElementById('serverPort').textContent = server.port || 'Not Found';
    document.getElementById('serverPlayers').textContent = `${server.players}/${server.maxPlayers}`;
    document.getElementById('serverID').textContent = server.id;
    document.getElementById('connectCommand').textContent = server.connectCommand;

    // Display players list
    displayPlayers(players);

    showResult();
}

// Display players list
function displayPlayers(players) {
    if (!players || players.length === 0) {
        playersSection.classList.add('hidden');
        return;
    }

    playersSection.classList.remove('hidden');
    playersList.innerHTML = '';

    players.forEach((player, index) => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';

        const ping = player.ping ? `${player.ping}ms` : 'N/A';
        const pingColor = player.ping ? (player.ping < 50 ? '#10b981' : player.ping < 100 ? '#f59e0b' : '#ef4444') : '#6b7280';

        playerItem.innerHTML = `
            <div class="player-info">
                <span class="player-icon">👤</span>
                <span class="player-name">${escapeHtml(player.name || `Player ${index + 1}`)}</span>
            </div>
            <span class="player-ping" style="color: ${pingColor}">${ping}</span>
        `;
        playersList.appendChild(playerItem);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Copy to clipboard function - FIXED
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element not found:', elementId);
        return;
    }

    const text = element.textContent || element.innerText;

    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess(element);
        }).catch(err => {
            console.error('Clipboard API failed:', err);
            fallbackCopy(text, element);
        });
    } else {
        // Fallback for older browsers
        fallbackCopy(text, element);
    }
}

// Fallback copy method
function fallbackCopy(text, element) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess(element);
        } else {
            alert('Kopyalama başarısız oldu!');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Kopyalama desteklenmiyor!');
    }

    document.body.removeChild(textArea);
}

// Show copy success feedback
function showCopySuccess(element) {
    const originalText = element.textContent;
    const copyText = t ? t('copied') : 'Copied!';

    element.textContent = copyText;
    element.style.color = '#10b981';

    setTimeout(() => {
        element.textContent = originalText;
        element.style.color = '#e0e6ff';
    }, 2000);
}

// UI Helper functions
function showLoading() {
    loadingDiv.classList.remove('hidden');
}

function hideLoading() {
    loadingDiv.classList.add('hidden');
}

function showResult() {
    resultDiv.classList.remove('hidden');
}

function hideResult() {
    resultDiv.classList.add('hidden');
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

// Analytics helper (for future use)
function trackSearch(serverID) {
    // Add Google Analytics or other tracking here
    if (typeof gtag !== 'undefined') {
        gtag('event', 'server_search', {
            'event_category': 'search',
            'event_label': serverID
        });
    }
}
