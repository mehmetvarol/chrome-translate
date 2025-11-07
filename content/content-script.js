/**
 * Content Script - Text selection ve UI injection
 * Her web sayfasında çalışır, text seçimlerini yakalar
 * PLUS: Full page translation
 */

// ==================== PAGE TRANSLATOR UTILITIES ====================

// Çevrilmeyecek tag'ler
const EXCLUDED_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED',
  'CODE', 'PRE', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO'
]);

// Extension'ın kendi elementleri
const EXTENSION_CLASS_PREFIX = 'cevir-';

/**
 * Sayfadaki çevrilebilir text node'ları bulur
 */
function extractTranslatableTexts() {
  const textsToTranslate = [];
  const textNodes = [];

  // TreeWalker ile tüm text node'ları bul
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Parent elementi kontrol et
        const parent = node.parentElement;

        if (!parent) return NodeFilter.FILTER_REJECT;

        // Extension'ın kendi elementlerini atla
        if (parent.className &&
            typeof parent.className === 'string' &&
            parent.className.includes(EXTENSION_CLASS_PREFIX)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Excluded tag'leri atla
        if (EXCLUDED_TAGS.has(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Hidden elementleri atla
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }

        // Boş veya sadece whitespace içeren metinleri atla
        const text = node.textContent.trim();
        if (text.length === 0 || text.length < 3) {
          return NodeFilter.FILTER_REJECT;
        }

        // Sadece sayı veya özel karakterleri atla
        if (/^[\d\s\W]+$/.test(text)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  // Tüm valid text node'ları topla
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();

    // Zaten çevrilmiş mi kontrol et
    if (!node.parentElement.hasAttribute('data-original')) {
      textsToTranslate.push(text);
      textNodes.push(node);
    }
  }

  return { textsToTranslate, textNodes };
}

/**
 * Metinleri batch'lere ayırır (API limiti için)
 */
function createBatches(texts, batchSize = 10) {
  const batches = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Çevirileri DOM'a uygular
 */
function applyTranslations(textNodes, translations) {
  let successCount = 0;
  let failureCount = 0;

  textNodes.forEach((node, index) => {
    if (!translations[index]) return;

    const translation = translations[index];

    if (translation.success && translation.translation) {
      // Orijinal metni sakla
      const parent = node.parentElement;
      if (!parent.hasAttribute('data-original')) {
        parent.setAttribute('data-original', node.textContent);
        parent.setAttribute('data-translated', 'true');
      }

      // Çeviriyi uygula
      node.textContent = translation.translation;
      successCount++;
    } else {
      failureCount++;
      console.warn('Translation failed for:', node.textContent, translation.error);
    }
  });

  return { successCount, failureCount };
}

/**
 * Sayfayı orijinal diline geri döndürür
 */
function restoreOriginalTexts() {
  const translatedElements = document.querySelectorAll('[data-translated="true"]');
  let restoredCount = 0;

  translatedElements.forEach(element => {
    const original = element.getAttribute('data-original');
    if (original) {
      // İçerideki text node'u bul ve güncelle
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNode = walker.nextNode();
      if (textNode) {
        textNode.textContent = original;
        element.removeAttribute('data-translated');
        restoredCount++;
      }
    }
  });

  return restoredCount;
}

/**
 * Sayfa çevrilmiş mi kontrol eder
 */
function isPageTranslated() {
  return document.querySelectorAll('[data-translated="true"]').length > 0;
}

/**
 * İstatistikleri döner
 */
function getTranslationStats() {
  const translated = document.querySelectorAll('[data-translated="true"]').length;
  const { textsToTranslate } = extractTranslatableTexts();
  const total = textsToTranslate.length + translated;

  return {
    translated,
    total,
    remaining: textsToTranslate.length,
    percentage: total > 0 ? Math.round((translated / total) * 100) : 0
  };
}

// ==================== MAIN CONTENT SCRIPT ====================

let translateButton = null;
let translatePopup = null;
let selectedText = '';
let selectionRange = null;

// Page translation state
let isTranslating = false;
let translationCancelled = false;
let pageTranslationBar = null;

// Initialization
initialize();

function initialize() {
  console.log('✨ Çevir content script loaded');

  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keydown', handleKeyDown);

  // Keyboard shortcut'tan gelen mesajları dinle
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translate-shortcut') {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        translateText(selection.toString().trim());
      }
    }

    if (request.action === 'translate-page') {
      translateWholePage();
      sendResponse({ success: true });
    }

    if (request.action === 'toggle-page-translation') {
      togglePageTranslation();
      sendResponse({ success: true });
    }

    if (request.action === 'cancel-translation') {
      cancelPageTranslation();
      sendResponse({ success: true });
    }

    if (request.action === 'get-page-translation-status') {
      sendResponse({
        isTranslated: isPageTranslated(),
        stats: getTranslationStats()
      });
      return true;
    }
  });
}

/**
 * Text seçimini yakalar
 */
function handleTextSelection(event) {
  // Popup veya button üzerindeyse ignore et
  if (event.target.closest('.cevir-translate-button') ||
      event.target.closest('.cevir-translate-popup')) {
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 0) {
      selectedText = text;
      selectionRange = selection.getRangeAt(0);
      showTranslateButton(event.pageX, event.pageY);
    } else {
      hideTranslateButton();
      hideTranslatePopup();
    }
  }, 10);
}

/**
 * ESC tuşu ile popupları kapatır
 */
function handleKeyDown(event) {
  if (event.key === 'Escape') {
    hideTranslateButton();
    hideTranslatePopup();
  }
}

/**
 * Translate butonunu gösterir
 */
function showTranslateButton(x, y) {
  hideTranslateButton();

  translateButton = document.createElement('div');
  translateButton.className = 'cevir-translate-button';
  translateButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 8l6 6m-7 0l6-6 2-3M2 5h12M7 2h1m14 20l-5-10-5 10m2-4h6"/>
    </svg>
    <span>Çevir</span>
  `;

  // Position ayarla
  translateButton.style.left = `${x + 10}px`;
  translateButton.style.top = `${y - 10}px`;

  // Event listeners
  translateButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    translateText(selectedText);
  });

  document.body.appendChild(translateButton);

  // Animation trigger
  requestAnimationFrame(() => {
    translateButton.classList.add('cevir-show');
  });
}

/**
 * Translate butonunu gizler
 */
function hideTranslateButton() {
  if (translateButton) {
    translateButton.classList.remove('cevir-show');
    setTimeout(() => {
      translateButton?.remove();
      translateButton = null;
    }, 200);
  }
}

/**
 * Çeviri işlemini başlatır
 */
async function translateText(text) {
  hideTranslateButton();
  showTranslatePopup(text);

  try {
    // Background script'e çeviri isteği gönder
    const response = await chrome.runtime.sendMessage({
      action: 'translate',
      text: text
    });

    if (response.success) {
      updatePopupContent(response.translation, text);
    } else {
      showPopupError(response.error || 'Çeviri başarısız oldu');
    }

  } catch (error) {
    showPopupError('Bağlantı hatası: ' + error.message);
  }
}

/**
 * Translate popup'ı gösterir (loading state)
 */
function showTranslatePopup(text) {
  hideTranslatePopup();

  translatePopup = document.createElement('div');
  translatePopup.className = 'cevir-translate-popup';

  // Position hesapla
  const rect = selectionRange?.getBoundingClientRect() || { top: 100, left: 100, right: 200 };
  const popupX = Math.min(rect.left, window.innerWidth - 420);
  const popupY = rect.top + window.scrollY - 10;

  translatePopup.style.left = `${popupX}px`;
  translatePopup.style.top = `${popupY}px`;
  translatePopup.style.transform = 'translateY(-100%)';

  // Loading state
  translatePopup.innerHTML = `
    <div class="cevir-popup-header">
      <div class="cevir-loading-pulse"></div>
      <button class="cevir-close-btn" aria-label="Kapat">×</button>
    </div>
    <div class="cevir-popup-body">
      <div class="cevir-loading-skeleton">
        <div class="cevir-skeleton-line"></div>
        <div class="cevir-skeleton-line"></div>
        <div class="cevir-skeleton-line short"></div>
      </div>
    </div>
  `;

  // Close button
  translatePopup.querySelector('.cevir-close-btn').addEventListener('click', hideTranslatePopup);

  document.body.appendChild(translatePopup);

  // Animation
  requestAnimationFrame(() => {
    translatePopup.classList.add('cevir-show');
  });

  // Click outside to close
  setTimeout(() => {
    document.addEventListener('click', outsideClickHandler);
  }, 100);
}

/**
 * Popup içeriğini çeviri ile günceller
 */
function updatePopupContent(translation, original) {
  if (!translatePopup) return;

  translatePopup.innerHTML = `
    <div class="cevir-popup-header">
      <span class="cevir-popup-title">Türkçe Çeviri</span>
      <button class="cevir-close-btn" aria-label="Kapat">×</button>
    </div>
    <div class="cevir-popup-body">
      <div class="cevir-original-text">${escapeHtml(original)}</div>
      <div class="cevir-divider"></div>
      <div class="cevir-translated-text">${escapeHtml(translation)}</div>
    </div>
    <div class="cevir-popup-footer">
      <button class="cevir-copy-btn" data-text="${escapeHtml(translation)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Kopyala
      </button>
    </div>
  `;

  // Event listeners
  translatePopup.querySelector('.cevir-close-btn').addEventListener('click', hideTranslatePopup);
  translatePopup.querySelector('.cevir-copy-btn').addEventListener('click', handleCopy);
}

/**
 * Hata mesajını gösterir
 */
function showPopupError(errorMessage) {
  if (!translatePopup) return;

  translatePopup.innerHTML = `
    <div class="cevir-popup-header cevir-error">
      <span class="cevir-popup-title">❌ Hata</span>
      <button class="cevir-close-btn" aria-label="Kapat">×</button>
    </div>
    <div class="cevir-popup-body">
      <div class="cevir-error-message">${escapeHtml(errorMessage)}</div>
    </div>
  `;

  translatePopup.querySelector('.cevir-close-btn').addEventListener('click', hideTranslatePopup);
}

/**
 * Popup'ı gizler
 */
function hideTranslatePopup() {
  if (translatePopup) {
    translatePopup.classList.remove('cevir-show');
    document.removeEventListener('click', outsideClickHandler);
    setTimeout(() => {
      translatePopup?.remove();
      translatePopup = null;
    }, 300);
  }
}

/**
 * Dışarı tıklama handler
 */
function outsideClickHandler(event) {
  if (translatePopup && !translatePopup.contains(event.target) &&
      !translateButton?.contains(event.target)) {
    hideTranslatePopup();
  }
}

/**
 * Kopyala butonu handler
 */
function handleCopy(event) {
  const button = event.currentTarget;
  const text = button.getAttribute('data-text');

  navigator.clipboard.writeText(text).then(() => {
    // Success feedback
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Kopyalandı!
    `;
    button.classList.add('cevir-copied');

    setTimeout(() => {
      if (button && translatePopup) {
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Kopyala
        `;
        button.classList.remove('cevir-copied');
      }
    }, 2000);
  });
}

/**
 * HTML escape utility
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== PAGE TRANSLATION ====================

/**
 * Sayfanın tamamını çevirir
 */
async function translateWholePage() {
  if (isTranslating) {
    console.log('Translation already in progress');
    return;
  }

  // Zaten çevrilmiş mi?
  if (isPageTranslated()) {
    console.log('Page already translated');
    return;
  }

  isTranslating = true;
  translationCancelled = false;

  // Progress bar göster
  showPageTranslationBar();

  try {
    // Çevrilebilir metinleri bul
    updateProgressBar('Sayfa analiz ediliyor...', 0);
    const { textsToTranslate, textNodes } = extractTranslatableTexts();

    if (textsToTranslate.length === 0) {
      throw new Error('Çevrilebilir metin bulunamadı');
    }

    console.log(`Found ${textsToTranslate.length} texts to translate`);

    // Batch'lere ayır (10'ar 10'ar)
    const batches = createBatches(textsToTranslate, 10);
    const allTranslations = [];

    // Her batch'i çevir
    for (let i = 0; i < batches.length; i++) {
      if (translationCancelled) {
        throw new Error('Çeviri iptal edildi');
      }

      const batch = batches[i];
      const progress = Math.round(((i + 1) / batches.length) * 100);

      updateProgressBar(
        `Çevriliyor... (${i + 1}/${batches.length} grup)`,
        progress
      );

      // Batch'i service worker'a gönder
      const response = await chrome.runtime.sendMessage({
        action: 'translate-batch',
        texts: batch
      });

      if (response.success) {
        allTranslations.push(...response.translations);
      } else {
        console.error('Batch translation failed:', response.error);
        // Başarısız olanları da ekle (orijinal metinle)
        batch.forEach(text => {
          allTranslations.push({ success: false, translation: text });
        });
      }

      // API rate limit için kısa bekle
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (translationCancelled) {
      throw new Error('Çeviri iptal edildi');
    }

    // Çevirileri uygula
    updateProgressBar('Çeviriler uygulanıyor...', 100);
    const { successCount, failureCount } = applyTranslations(textNodes, allTranslations);

    // Başarı mesajı göster
    updateProgressBar(
      `✓ ${successCount} metin çevrildi ${failureCount > 0 ? `(${failureCount} hata)` : ''}`,
      100,
      true
    );

    setTimeout(() => {
      hidePageTranslationBar();
    }, 3000);

  } catch (error) {
    console.error('Page translation error:', error);
    updateProgressBar(`❌ Hata: ${error.message}`, 0, false, true);

    setTimeout(() => {
      hidePageTranslationBar();
    }, 5000);
  } finally {
    isTranslating = false;
  }
}

/**
 * Sayfa çevirisini toggle eder (orijinal/çeviri)
 */
function togglePageTranslation() {
  if (isPageTranslated()) {
    // Orijinale döndür
    const restoredCount = restoreOriginalTexts();
    console.log(`Restored ${restoredCount} texts to original`);

    // Feedback göster
    showPageTranslationBar();
    updateProgressBar(`↺ ${restoredCount} metin orijinal diline döndürüldü`, 100, true);
    setTimeout(() => {
      hidePageTranslationBar();
    }, 2000);
  } else {
    // Çevir
    translateWholePage();
  }
}

/**
 * Devam eden çeviriyi iptal eder
 */
function cancelPageTranslation() {
  translationCancelled = true;
  isTranslating = false;
  hidePageTranslationBar();
}

/**
 * Progress bar'ı gösterir
 */
function showPageTranslationBar() {
  if (pageTranslationBar) return;

  pageTranslationBar = document.createElement('div');
  pageTranslationBar.className = 'cevir-page-translation-bar';
  pageTranslationBar.innerHTML = `
    <div class="cevir-progress-content">
      <div class="cevir-progress-text">Hazırlanıyor...</div>
      <div class="cevir-progress-bar-container">
        <div class="cevir-progress-bar-fill" style="width: 0%"></div>
      </div>
    </div>
    <button class="cevir-progress-cancel" aria-label="İptal">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // Cancel button
  pageTranslationBar.querySelector('.cevir-progress-cancel').addEventListener('click', () => {
    cancelPageTranslation();
  });

  document.body.appendChild(pageTranslationBar);

  // Animation
  requestAnimationFrame(() => {
    pageTranslationBar.classList.add('cevir-show');
  });
}

/**
 * Progress bar'ı günceller
 */
function updateProgressBar(text, progress, isComplete = false, isError = false) {
  if (!pageTranslationBar) return;

  const textEl = pageTranslationBar.querySelector('.cevir-progress-text');
  const fillEl = pageTranslationBar.querySelector('.cevir-progress-bar-fill');
  const cancelBtn = pageTranslationBar.querySelector('.cevir-progress-cancel');

  if (textEl) textEl.textContent = text;
  if (fillEl) fillEl.style.width = `${progress}%`;

  if (isComplete) {
    pageTranslationBar.classList.add('cevir-complete');
    if (cancelBtn) cancelBtn.style.display = 'none';
  }

  if (isError) {
    pageTranslationBar.classList.add('cevir-error');
  }
}

/**
 * Progress bar'ı gizler
 */
function hidePageTranslationBar() {
  if (pageTranslationBar) {
    pageTranslationBar.classList.remove('cevir-show');
    setTimeout(() => {
      pageTranslationBar?.remove();
      pageTranslationBar = null;
    }, 300);
  }
}
