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
 * IMPROVED: Node referansları yerine XPath kullan (React sayfaları için)
 */
function extractTranslatableTexts() {
  const textsToTranslate = [];
  const nodeInfo = []; // Node yerine node bilgisi sakla

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
    const parent = node.parentElement;

    // Zaten çevrilmiş mi kontrol et
    if (parent && !parent.__translated) {
      textsToTranslate.push(text);

      // Node bilgisini sakla (direkt referans yerine)
      nodeInfo.push({
        node: node,
        parent: parent,
        originalText: text,
        // Unique identifier olarak parent'a ID ekle
        parentId: parent.dataset.translateId || (parent.dataset.translateId = 'trans-' + Date.now() + '-' + Math.random())
      });
    }
  }

  return { textsToTranslate, textNodes: nodeInfo };
}

/**
 * Sayfadaki çevrilebilir attribute'ları bulur (placeholder, alt, title, aria-label)
 */
function extractTranslatableAttributes() {
  const attributesToTranslate = [];
  const attributeElements = [];

  // Çevrilecek attribute'lar ve selector'ları
  const attributeSelectors = [
    { selector: 'input[placeholder], textarea[placeholder]', attr: 'placeholder' },
    { selector: 'img[alt]', attr: 'alt' },
    { selector: '[title]', attr: 'title' },
    { selector: '[aria-label]', attr: 'aria-label' }
  ];

  attributeSelectors.forEach(({ selector, attr }) => {
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      // Extension'ın kendi elementlerini atla
      if (element.className &&
          typeof element.className === 'string' &&
          element.className.includes(EXTENSION_CLASS_PREFIX)) {
        return;
      }

      // Hidden elementleri atla
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return;
      }

      const value = element.getAttribute(attr);
      if (value && value.trim().length >= 3) {
        // Zaten çevrilmiş mi kontrol et
        const dataAttr = `data-original-${attr}`;
        if (!element.hasAttribute(dataAttr)) {
          attributesToTranslate.push(value.trim());
          attributeElements.push({ element, attr });
        }
      }
    });
  });

  return { attributesToTranslate, attributeElements };
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
 * IMPROVED: nodeInfo kullan (node + metadata)
 */
function applyTranslations(nodeInfoArray, translations) {
  let successCount = 0;
  let failureCount = 0;

  nodeInfoArray.forEach((nodeInfo, index) => {
    if (!translations[index]) {
      console.warn(`Translation missing for index ${index}`);
      failureCount++;
      return;
    }

    const translation = translations[index];

    if (!translation.success || !translation.translation) {
      console.warn(`Translation failed for index ${index}:`, translation.error || 'No translation');
      failureCount++;
      return;
    }

    try {
      const { node, parent } = nodeInfo;

      // Node ve parent hala DOM'da mı kontrol et
      if (!document.body.contains(node) || !document.body.contains(parent)) {
        console.warn(`Node or parent not in DOM anymore for index ${index}`);
        failureCount++;
        return;
      }

      // Orijinal metni sakla
      if (!node.__originalText) {
        node.__originalText = node.textContent;
      }

      // Parent'ı işaretle
      if (!parent.__translated) {
        parent.__translated = true;
        parent.setAttribute('data-translated', 'true');
      }

      // Çeviriyi uygula
      node.textContent = translation.translation;
      successCount++;

    } catch (error) {
      console.error(`Translation application error at index ${index}:`, error);
      failureCount++;
    }
  });

  console.log(`✅ applyTranslations completed: ${successCount} success, ${failureCount} failed out of ${nodeInfoArray.length} total`);
  return { successCount, failureCount };
}

/**
 * Attribute çevirilerini uygular (placeholder, alt, title, aria-label)
 */
function applyAttributeTranslations(attributeElements, translations) {
  let successCount = 0;
  let failureCount = 0;

  attributeElements.forEach(({ element, attr }, index) => {
    if (!translations[index]) return;

    const translation = translations[index];

    if (translation.success && translation.translation) {
      // Orijinal attribute değerini sakla
      const dataAttr = `data-original-${attr}`;
      if (!element.hasAttribute(dataAttr)) {
        element.setAttribute(dataAttr, element.getAttribute(attr));
        element.setAttribute('data-attr-translated', 'true');
      }

      // Çeviriyi uygula
      element.setAttribute(attr, translation.translation);
      successCount++;
    } else {
      failureCount++;
    }
  });

  return { successCount, failureCount };
}

/**
 * Sayfayı orijinal diline geri döndürür (metinler ve attribute'lar)
 */
function restoreOriginalTexts() {
  let restoredCount = 0;

  // Text çevirilerini geri yükle
  const translatedElements = document.querySelectorAll('[data-translated="true"]');
  translatedElements.forEach(element => {
    // İçerideki TÜM text node'ları bul ve geri yükle
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let textNode;
    while (textNode = walker.nextNode()) {
      // Orijinal metni geri yükle
      if (textNode.__originalText) {
        textNode.textContent = textNode.__originalText;
        delete textNode.__originalText;
        restoredCount++;
      }
    }

    // Parent'tan flag'leri temizle
    delete element.__translated;
    element.removeAttribute('data-translated');
    if (element.dataset.translateId) {
      delete element.dataset.translateId;
    }
  });

  // Attribute çevirilerini geri yükle
  const attributeTranslatedElements = document.querySelectorAll('[data-attr-translated="true"]');
  attributeTranslatedElements.forEach(element => {
    const attributes = ['placeholder', 'alt', 'title', 'aria-label'];

    attributes.forEach(attr => {
      const dataAttr = `data-original-${attr}`;
      const original = element.getAttribute(dataAttr);

      if (original) {
        element.setAttribute(attr, original);
        element.removeAttribute(dataAttr);
        restoredCount++;
      }
    });

    element.removeAttribute('data-attr-translated');
  });

  return restoredCount;
}

/**
 * Sayfa çevrilmiş mi kontrol eder
 */
function isPageTranslated() {
  const hasTextTranslations = document.querySelectorAll('[data-translated="true"]').length > 0;
  const hasAttrTranslations = document.querySelectorAll('[data-attr-translated="true"]').length > 0;
  return hasTextTranslations || hasAttrTranslations;
}

/**
 * İstatistikleri döner
 */
function getTranslationStats() {
  const translatedTexts = document.querySelectorAll('[data-translated="true"]').length;
  const translatedAttrs = document.querySelectorAll('[data-attr-translated="true"]').length;
  const translated = translatedTexts + translatedAttrs;

  const { textsToTranslate } = extractTranslatableTexts();
  const { attributesToTranslate } = extractTranslatableAttributes();
  const total = textsToTranslate.length + attributesToTranslate.length + translated;

  return {
    translated,
    total,
    remaining: textsToTranslate.length + attributesToTranslate.length,
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
    // Chrome runtime kontrolü
    if (!chrome.runtime || !chrome.runtime.id) {
      throw new Error('Extension context invalidated. Lütfen sayfayı yenileyin.');
    }

    // Background script'e çeviri isteği gönder
    const response = await chrome.runtime.sendMessage({
      action: 'translate',
      text: text
    });

    if (response && response.success) {
      updatePopupContent(response.translation, text);
    } else {
      showPopupError(response?.error || 'Çeviri başarısız oldu');
    }

  } catch (error) {
    showPopupError('Bağlantı hatası: ' + error.message);
  }
}

/**
 * Popup'ı sürüklenebilir yapar
 */
function makeDraggable(popup, dragHandle) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;

  dragHandle.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    // Close ve copy butonlarına tıklanırsa drag başlatma
    if (e.target.closest('.cevir-close-btn') || e.target.closest('.cevir-copy-btn')) {
      return;
    }

    // Transform'u kaldırmadan önce gerçek pozisyonu hesapla
    const rect = popup.getBoundingClientRect();

    // Popup'ın gerçek görünen pozisyonunu al (transform dahil)
    const computedLeft = rect.left + window.scrollX;
    const computedTop = rect.top + window.scrollY;

    // Transform'u kaldır ve pozisyonu ayarla
    popup.style.left = `${computedLeft}px`;
    popup.style.top = `${computedTop}px`;
    popup.style.transform = 'none';

    // Yeni rect değerini al (transform kaldırıldıktan sonra)
    const newRect = popup.getBoundingClientRect();
    initialX = e.clientX - newRect.left;
    initialY = e.clientY - newRect.top;

    isDragging = true;
    dragHandle.style.cursor = 'grabbing';
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      // Ekran sınırlarını kontrol et
      const maxX = window.innerWidth - popup.offsetWidth;
      const maxY = window.innerHeight - popup.offsetHeight;

      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY + window.scrollY));

      popup.style.left = `${currentX}px`;
      popup.style.top = `${currentY}px`;
      // Transform zaten dragStart'ta kaldırıldı
    }
  }

  function dragEnd() {
    isDragging = false;
    dragHandle.style.cursor = 'move';
  }
}

/**
 * Popup'ı yeniden boyutlandırılabilir yapar (resizable)
 */
function makeResizable(popup, resizeHandle) {
  const MIN_WIDTH = 300;
  const MAX_WIDTH = 800;
  const MIN_HEIGHT = 150;
  const MAX_HEIGHT = 600;

  let isResizing = false;
  let startX, startY;
  let startWidth, startHeight;

  resizeHandle.addEventListener('mousedown', startResize);
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);

  function startResize(e) {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;

    // Mevcut boyutları al
    const rect = popup.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;

    e.preventDefault();
    e.stopPropagation();
  }

  function resize(e) {
    if (!isResizing) return;

    e.preventDefault();

    // Yeni boyutları hesapla
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newWidth = startWidth + deltaX;
    let newHeight = startHeight + deltaY;

    // Min/max sınırlarını uygula
    newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
    newHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, MAX_HEIGHT));

    // Viewport sınırlarını kontrol et
    const rect = popup.getBoundingClientRect();
    const maxWidthFromViewport = window.innerWidth - rect.left - 20;
    const maxHeightFromViewport = window.innerHeight - rect.top - 20;

    newWidth = Math.min(newWidth, maxWidthFromViewport);
    newHeight = Math.min(newHeight, maxHeightFromViewport);

    // Boyutları uygula
    popup.style.width = `${newWidth}px`;
    popup.style.height = `${newHeight}px`;
  }

  function stopResize() {
    isResizing = false;
  }
}

/**
 * Popup için en uygun konumu hesaplar (smart positioning)
 */
function calculateOptimalPosition(selectionRect) {
  const POPUP_WIDTH = 400;
  const POPUP_HEIGHT = 250; // Ortalama popup yüksekliği
  const SPACING = 10; // Selection ile popup arasındaki boşluk

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  // Seçili metnin viewport'taki konumu
  const selectionTop = selectionRect.top;
  const selectionBottom = selectionRect.bottom;
  const selectionLeft = selectionRect.left;
  const selectionRight = selectionRect.right;
  const selectionCenterX = (selectionLeft + selectionRight) / 2;

  // Mevcut alanları hesapla
  const spaceAbove = selectionTop;
  const spaceBelow = viewportHeight - selectionBottom;
  const spaceLeft = selectionLeft;
  const spaceRight = viewportWidth - selectionRight;

  let finalX, finalY, transform;

  // 1. Öncelik: ÜSTTE (varsayılan)
  if (spaceAbove >= POPUP_HEIGHT + SPACING) {
    finalX = Math.max(SPACING, Math.min(selectionCenterX - POPUP_WIDTH / 2, viewportWidth - POPUP_WIDTH - SPACING));
    finalY = selectionTop + scrollY - SPACING;
    transform = 'translateY(-100%)';
  }
  // 2. ALTTA
  else if (spaceBelow >= POPUP_HEIGHT + SPACING) {
    finalX = Math.max(SPACING, Math.min(selectionCenterX - POPUP_WIDTH / 2, viewportWidth - POPUP_WIDTH - SPACING));
    finalY = selectionBottom + scrollY + SPACING;
    transform = 'translateY(0)';
  }
  // 3. SAĞDA (dikey olarak ortalanmış)
  else if (spaceRight >= POPUP_WIDTH + SPACING) {
    finalX = selectionRight + scrollX + SPACING;
    finalY = Math.max(SPACING + scrollY, Math.min(
      (selectionTop + selectionBottom) / 2 + scrollY - POPUP_HEIGHT / 2,
      viewportHeight + scrollY - POPUP_HEIGHT - SPACING
    ));
    transform = 'translateY(0)';
  }
  // 4. SOLDA (dikey olarak ortalanmış)
  else if (spaceLeft >= POPUP_WIDTH + SPACING) {
    finalX = selectionLeft + scrollX - POPUP_WIDTH - SPACING;
    finalY = Math.max(SPACING + scrollY, Math.min(
      (selectionTop + selectionBottom) / 2 + scrollY - POPUP_HEIGHT / 2,
      viewportHeight + scrollY - POPUP_HEIGHT - SPACING
    ));
    transform = 'translateY(0)';
  }
  // 5. Fallback: Ekranın ortasında
  else {
    finalX = Math.max(SPACING, (viewportWidth - POPUP_WIDTH) / 2);
    finalY = Math.max(SPACING + scrollY, (viewportHeight - POPUP_HEIGHT) / 2 + scrollY);
    transform = 'translateY(0)';
  }

  return { x: finalX, y: finalY, transform };
}

/**
 * Translate popup'ı gösterir (loading state)
 */
function showTranslatePopup() {
  hideTranslatePopup();

  translatePopup = document.createElement('div');
  translatePopup.className = 'cevir-translate-popup';

  // Position hesapla (smart positioning)
  const rect = selectionRange?.getBoundingClientRect() || {
    top: window.innerHeight / 2,
    bottom: window.innerHeight / 2 + 20,
    left: window.innerWidth / 2,
    right: window.innerWidth / 2 + 100
  };

  const position = calculateOptimalPosition(rect);
  translatePopup.style.left = `${position.x}px`;
  translatePopup.style.top = `${position.y}px`;
  translatePopup.style.transform = position.transform;

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
    <div class="cevir-resize-handle"></div>
  `;

  // Close button
  translatePopup.querySelector('.cevir-close-btn').addEventListener('click', hideTranslatePopup);

  // Draggable özelliği ekle
  const header = translatePopup.querySelector('.cevir-popup-header');
  makeDraggable(translatePopup, header);

  // Resizable özelliği ekle
  const resizeHandle = translatePopup.querySelector('.cevir-resize-handle');
  makeResizable(translatePopup, resizeHandle);

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
    <div class="cevir-resize-handle"></div>
  `;

  // Event listeners
  translatePopup.querySelector('.cevir-close-btn').addEventListener('click', hideTranslatePopup);
  translatePopup.querySelector('.cevir-copy-btn').addEventListener('click', handleCopy);

  // Draggable özelliği yeniden ekle
  const header = translatePopup.querySelector('.cevir-popup-header');
  makeDraggable(translatePopup, header);

  // Resizable özelliği yeniden ekle
  const resizeHandle = translatePopup.querySelector('.cevir-resize-handle');
  makeResizable(translatePopup, resizeHandle);
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
    <div class="cevir-resize-handle"></div>
  `;

  translatePopup.querySelector('.cevir-close-btn').addEventListener('click', hideTranslatePopup);

  // Draggable özelliği yeniden ekle
  const header = translatePopup.querySelector('.cevir-popup-header');
  makeDraggable(translatePopup, header);

  // Resizable özelliği yeniden ekle
  const resizeHandle = translatePopup.querySelector('.cevir-resize-handle');
  makeResizable(translatePopup, resizeHandle);
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
 * Sayfanın tamamını çevirir (metinler + attribute'lar)
 */
async function translateWholePage() {
  if (isTranslating) {
    return;
  }

  // Zaten çevrilmiş mi?
  if (isPageTranslated()) {
    return;
  }

  isTranslating = true;
  translationCancelled = false;

  // Progress bar göster
  showPageTranslationBar();

  try {
    // 1. Çevrilebilir metinleri bul
    updateProgressBar('Sayfa analiz ediliyor...', 0);
    const { textsToTranslate, textNodes } = extractTranslatableTexts();
    const { attributesToTranslate, attributeElements } = extractTranslatableAttributes();

    const totalItems = textsToTranslate.length + attributesToTranslate.length;

    console.log('📊 Analiz sonuçları:', {
      textsToTranslate: textsToTranslate.length,
      attributesToTranslate: attributesToTranslate.length,
      totalItems
    });

    if (totalItems === 0) {
      throw new Error('Çevrilebilir içerik bulunamadı');
    }

    // 2. TÜM çevrilecek metinleri birleştir (text + attribute)
    const allTexts = [...textsToTranslate, ...attributesToTranslate];
    const batches = createBatches(allTexts, 10);
    const allTranslations = [];

    // 3. Her batch'i çevir
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
      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          throw new Error('Extension context invalidated. Lütfen sayfayı yenileyin.');
        }

        const response = await chrome.runtime.sendMessage({
          action: 'translate-batch',
          texts: batch
        });

        if (response && response.success) {
          console.log(`✅ Batch ${i + 1} çevrildi:`, response.translations.length, 'öğe');
          allTranslations.push(...response.translations);
        } else {
          console.error('Batch translation failed:', response?.error);
          // Başarısız olanları da ekle (orijinal metinle)
          batch.forEach(text => {
            allTranslations.push({ success: false, translation: text });
          });
        }
      } catch (batchError) {
        console.error('Batch translation error:', batchError);
        // Hata durumunda orijinal metinleri ekle
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

    // 4. Çevirileri uygula
    updateProgressBar('Çeviriler uygulanıyor...', 100);

    console.log('📝 Toplam çeviri sayısı:', allTranslations.length);
    console.log('📝 İlk 3 çeviri örneği:', allTranslations.slice(0, 3));
    console.log('📝 Text node sayısı:', textNodes.length);

    // Text çevirilerini uygula
    const textTranslations = allTranslations.slice(0, textsToTranslate.length);
    console.log('📝 Text çevirileri uygulanacak:', textTranslations.length);
    const textResult = applyTranslations(textNodes, textTranslations);
    console.log('✅ Text çevirileri uygulandı:', textResult);

    // DOM'da değişiklik oldu mu kontrol et
    const translatedCount = document.querySelectorAll('[data-translated="true"]').length;
    console.log('📊 DOM\'da işaretlenen element sayısı:', translatedCount);

    // Attribute çevirilerini uygula
    const attrTranslations = allTranslations.slice(textsToTranslate.length);
    const attrResult = applyAttributeTranslations(attributeElements, attrTranslations);
    console.log('✅ Attribute çevirileri uygulandı:', attrResult);

    const totalSuccess = textResult.successCount + attrResult.successCount;
    const totalFailure = textResult.failureCount + attrResult.failureCount;

    // Başarı mesajı göster
    updateProgressBar(
      `✓ ${totalSuccess} öğe çevrildi ${totalFailure > 0 ? `(${totalFailure} hata)` : ''}`,
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
