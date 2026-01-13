// DOM Elements
const serverInput = document.getElementById('serverInput');
const searchBtn = document.getElementById('searchBtn');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

// Event Listeners
searchBtn.addEventListener('click', findServerIP);
serverInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        findServerIP();
    }
});

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
        showError('Lütfen bir CFX.re URL\'si veya Server ID girin!');
        return;
    }

    const serverID = extractServerID(input);

    if (!serverID) {
        showError('Geçersiz format! Örnek: cfx.re/join/abc123 veya sadece abc123');
        return;
    }

    // Show loading, hide others
    showLoading();
    hideResult();
    hideError();

    try {
        // Fetch server data from FiveM API
        const response = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${serverID}`);

        if (!response.ok) {
            throw new Error('Sunucu bulunamadı!');
        }

        const data = await response.json();

        if (!data || !data.Data) {
            throw new Error('Sunucu bilgileri alınamadı!');
        }

        displayResult(data.Data, serverID);

    } catch (error) {
        showError(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        hideLoading();
    }
}

// Display server information
function displayResult(serverData, serverID) {
    // Extract IP and port from endpoint
    const endpoint = serverData.connectEndPoints && serverData.connectEndPoints[0];
    let ip = 'Bulunamadı';
    let port = 'Bulunamadı';

    if (endpoint) {
        const parts = endpoint.split(':');
        ip = parts[0];
        port = parts[1] || '30120';
    }

    // Update DOM elements
    document.getElementById('serverName').textContent = serverData.hostname || 'Bilinmeyen Sunucu';
    document.getElementById('serverIP').textContent = ip;
    document.getElementById('serverPort').textContent = port;
    document.getElementById('serverPlayers').textContent = `${serverData.clients || 0}/${serverData.sv_maxclients || 0}`;
    document.getElementById('serverID').textContent = serverID;
    document.getElementById('connectCommand').textContent = `connect ${ip}:${port}`;

    showResult();
}

// Copy to clipboard function
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;

    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalText = element.textContent;
        element.textContent = 'Kopyalandı!';
        element.style.color = '#28a745';

        setTimeout(() => {
            element.textContent = originalText;
            element.style.color = '#333';
        }, 2000);
    }).catch(err => {
        console.error('Kopyalama hatası:', err);
        alert('Kopyalama başarısız oldu!');
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
