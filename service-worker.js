/**
 * Service Worker - Background script
 * Handles translation requests, keyboard shortcuts, and page translation
 * ES MODULE - Uses imports from utils/
 */

// ==================== IMPORTS ====================
import { GEMINI_API_KEY } from './utils/constants.js';
import { Translator } from './utils/translator.js';
import { Storage } from './utils/storage.js';

// ==================== SERVICE WORKER LOGIC ====================

// Translator instance
let translatorInstance = null;

function getTranslator(apiKey) {
  if (!translatorInstance) {
    translatorInstance = new Translator(apiKey || GEMINI_API_KEY);
  } else if (apiKey) {
    translatorInstance.updateApiKey(apiKey);
  }
  return translatorInstance;
}

// Extension yüklendiğinde
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 Çevir Extension yüklendi');

  // API key kontrolü
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn('⚠️ API KEY ayarlanmamış! Lütfen utils/constants.js dosyasını yapılandırın.');
  }
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
  if (command === 'translate-selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'translate-shortcut',
        });
      }
    });
  }
});

// Content script'ten gelen mesajları dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    handleTranslation(request.text, sendResponse);
    return true; // Async response için
  }

  if (request.action === 'translate-batch') {
    handleBatchTranslation(request.texts, sendResponse);
    return true;
  }

  if (request.action === 'save-to-history') {
    Storage.addToHistory(request.original, request.translation)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'get-history') {
    Storage.getHistory()
      .then((history) => sendResponse({ success: true, history: history }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'clear-history') {
    Storage.clearHistory()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return false;
});

/**
 * Tek metin çevirisi
 */
async function handleTranslation(text, sendResponse) {
  try {
    // Constants.js'den API key kullan
    const translator = getTranslator(GEMINI_API_KEY);

    // Çevir
    const result = await translator.translate(text);

    // Başarılıysa history'ye ekle
    if (result.success) {
      await Storage.addToHistory(text, result.translation);
    }

    sendResponse(result);
  } catch (error) {
    console.error('Translation error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Beklenmeyen bir hata oluştu',
    });
  }
}

/**
 * Batch çeviri (sayfa çevirisi için)
 */
async function handleBatchTranslation(texts, sendResponse) {
  try {
    console.log('🔄 Batch translation başladı:', texts.length, 'metin');
    const translator = getTranslator(GEMINI_API_KEY);
    const translations = [];

    // Her metni sırayla çevir
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];

      if (!text || text.trim().length === 0) {
        translations.push({ success: true, translation: text });
        continue;
      }

      const result = await translator.translate(text);

      if (result.success) {
        console.log(
          `✅ Çeviri ${i + 1}/${texts.length}:`,
          text.substring(0, 50),
          '→',
          result.translation.substring(0, 50),
        );
        translations.push({ success: true, translation: result.translation });
      } else {
        // API quota hatası kontrolü
        if (
          result.error &&
          (result.error.includes('quota') ||
            result.error.includes('Quota') ||
            result.error.includes('429'))
        ) {
          console.error('🚫 API Quota limit aşıldı!');
          // Kalan metinler için hata ekle
          for (let j = i; j < texts.length; j++) {
            translations.push({
              success: false,
              error: 'API quota limit aşıldı. Lütfen yarın tekrar deneyin.',
              original: texts[j],
            });
          }
          break; // Döngüyü kır, başka istek gönderme
        }

        console.error(
          `❌ Çeviri ${i + 1}/${texts.length} başarısız:`,
          result.error,
        );
        translations.push({
          success: false,
          error: result.error,
          original: text,
        });
      }
    }

    console.log(
      '✅ Batch translation tamamlandı:',
      translations.length,
      'çeviri',
    );
    sendResponse({
      success: true,
      translations: translations,
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Toplu çeviri başarısız oldu',
    });
  }
}
