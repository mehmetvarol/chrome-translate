/**
 * Popup Script - Simplified for page translation control
 * NO IMPORTS - All code inline
 */

// ==================== STORAGE UTILITIES ====================

const STORAGE_KEYS = {
  HISTORY: 'translation_history'
};

async function getHistory() {
  const response = await chrome.runtime.sendMessage({ action: 'get-history' });
  return response.success ? response.history : [];
}

async function clearHistoryStorage() {
  return chrome.runtime.sendMessage({ action: 'clear-history' });
}

// ==================== POPUP LOGIC ====================

// DOM Elements
const translatePageBtn = document.getElementById('translatePageBtn');
const togglePageBtn = document.getElementById('togglePageBtn');
const pageTranslationStatus = document.getElementById('pageTranslationStatus');
const clearHistoryBtn = document.getElementById('clearHistory');
const historyContainer = document.getElementById('historyContainer');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await checkPageTranslationStatus();
  await loadHistory();
  setupEventListeners();
});

/**
 * Event Listeners
 */
function setupEventListeners() {
  // Translate page button
  translatePageBtn.addEventListener('click', translateCurrentPage);

  // Toggle page translation button
  togglePageBtn.addEventListener('click', togglePageTranslation);

  // Clear history
  clearHistoryBtn.addEventListener('click', clearHistory);
}

/**
 * Check if current page is translated
 */
async function checkPageTranslationStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) return;

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'get-page-translation-status'
    });

    if (response.isTranslated) {
      // Show toggle button instead of translate button
      translatePageBtn.style.display = 'none';
      togglePageBtn.style.display = 'flex';

      // Show stats
      const stats = response.stats;
      pageTranslationStatus.innerHTML = `
        <div class="status-success">
          ✓ Sayfa çevrildi: ${stats.translated}/${stats.total} metin
        </div>
      `;
      pageTranslationStatus.style.display = 'block';
    } else {
      translatePageBtn.style.display = 'flex';
      togglePageBtn.style.display = 'none';
      pageTranslationStatus.style.display = 'none';
    }

  } catch (error) {
    console.error('Cannot check page status:', error);
    // Ignore errors (probably content script not loaded yet)
  }
}

/**
 * Translate current page
 */
async function translateCurrentPage() {
  try {
    translatePageBtn.disabled = true;
    translatePageBtn.innerHTML = `
      <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      Çevriliyor...
    `;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('Active tab not found');
    }

    await chrome.tabs.sendMessage(tab.id, {
      action: 'translate-page'
    });

    // Update UI
    setTimeout(async () => {
      translatePageBtn.style.display = 'none';
      togglePageBtn.style.display = 'flex';
      await checkPageTranslationStatus();
    }, 500);

  } catch (error) {
    console.error('Translation error:', error);
    pageTranslationStatus.innerHTML = `
      <div class="status-error">
        ❌ Hata: ${error.message}
      </div>
    `;
    pageTranslationStatus.style.display = 'block';

    translatePageBtn.disabled = false;
    translatePageBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 8l6 6m-7 0l6-6 2-3M2 5h12M7 2h1m14 20l-5-10-5 10m2-4h6"/>
      </svg>
      Bu Sayfayı Çevir
    `;
  }
}

/**
 * Toggle page translation (back to original)
 */
async function togglePageTranslation() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('Active tab not found');
    }

    await chrome.tabs.sendMessage(tab.id, {
      action: 'toggle-page-translation'
    });

    // Update UI
    setTimeout(async () => {
      togglePageBtn.style.display = 'none';
      translatePageBtn.style.display = 'flex';
      pageTranslationStatus.style.display = 'none';
    }, 500);

  } catch (error) {
    console.error('Toggle error:', error);
  }
}

/**
 * Load translation history
 */
async function loadHistory() {
  try {
    const history = await getHistory();

    if (history.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
            <path d="M5 8l6 6m-7 0l6-6 2-3M2 5h12M7 2h1m14 20l-5-10-5 10m2-4h6"/>
          </svg>
          <p>Henüz çeviri yapmadınız</p>
        </div>
      `;
      return;
    }

    historyContainer.innerHTML = history.map(item => `
      <div class="history-item">
        <div class="history-item-header">
          <span class="history-timestamp">${formatTimestamp(item.timestamp)}</span>
          <button class="history-copy" data-text="${escapeHtml(item.translation)}" title="Kopyala">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        <div class="history-original">${escapeHtml(item.original)}</div>
        <div class="history-translation">${escapeHtml(item.translation)}</div>
      </div>
    `).join('');

    // Add copy event listeners
    document.querySelectorAll('.history-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = e.currentTarget.getAttribute('data-text');
        copyToClipboard(text, e.currentTarget);
      });
    });

  } catch (error) {
    console.error('Geçmiş yüklenemedi:', error);
  }
}

/**
 * Clear translation history
 */
async function clearHistory() {
  if (!confirm('Tüm çeviri geçmişini silmek istediğinize emin misiniz?')) {
    return;
  }

  try {
    await clearHistoryStorage();
    await loadHistory();
  } catch (error) {
    console.error('Geçmiş temizlenemedi:', error);
  }
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    button.style.background = '#10b981';
    button.style.color = 'white';

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.background = '';
      button.style.color = '';
    }, 1500);
  });
}

/**
 * Format timestamp to readable format
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
