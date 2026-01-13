// Load translations
let currentLang = localStorage.getItem('preferredLanguage') || 'en';

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
        playerItem.innerHTML = `
            <span class="player-icon">👤</span>
            <span class="player-name">${escapeHtml(player.name || `Player ${index + 1}`)}</span>
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

// Copy to clipboard function
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;

    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalText = element.textContent;
        element.textContent = t('copied');
        element.style.color = '#10b981';

        setTimeout(() => {
            element.textContent = originalText;
            element.style.color = '#e0e6ff';
        }, 2000);
    }).catch(err => {
        console.error('Copy error:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            element.textContent = t('copied');
            setTimeout(() => {
                element.textContent = originalText;
            }, 2000);
        } catch (err) {
            alert('Copy failed');
        }
        document.body.removeChild(textArea);
    });
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
