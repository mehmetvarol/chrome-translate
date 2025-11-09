/**
 * Service Worker - Background script
 * Handles translation requests, keyboard shortcuts, and page translation
 * NO IMPORTS - All code inline for compatibility
 */

// ==================== CONSTANTS ====================

const GEMINI_API_KEY = "AIzaSyCbUw01dHYNrCDU1XwYpSwFD6fUXylssPc";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const TARGET_LANGUAGE = "Türkçe";
const MAX_TEXT_LENGTH = 5000;
const TRANSLATION_TIMEOUT = 10000; // 10 seconds

// Storage Keys
const STORAGE_KEYS = {
  API_KEY: "gemini_api_key",
  HISTORY: "translation_history",
  SETTINGS: "user_settings"
};

const MAX_HISTORY_ITEMS = 50;

// ==================== TRANSLATOR ====================

class Translator {
  constructor(apiKey = GEMINI_API_KEY) {
    this.apiKey = apiKey;
  }

  async translate(text) {
    // Validation
    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Metin boş olamaz' };
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return { success: false, error: `Metin çok uzun (max ${MAX_TEXT_LENGTH} karakter)` };
    }

    // API Key kontrolü
    if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return { success: false, error: 'API key ayarlanmamış.' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT);

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Aşağıdaki metni Türkçe'ye çevir. Sadece çeviriyi ver, başka açıklama ekleme. Eğer metin zaten Türkçe ise, bunu belirt ve düzeltilmiş halini ver.\n\nMetin: "${text}"`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!translation) {
        throw new Error('Çeviri alınamadı');
      }

      return {
        success: true,
        translation: translation,
        original: text
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Çeviri zaman aşımına uğradı' };
      }

      return {
        success: false,
        error: error.message || 'Çeviri başarısız oldu'
      };
    }
  }

  updateApiKey(newKey) {
    this.apiKey = newKey;
  }
}

// Singleton instance
let translatorInstance = null;

function getTranslator(apiKey) {
  if (!translatorInstance) {
    translatorInstance = new Translator(apiKey);
  } else if (apiKey) {
    translatorInstance.updateApiKey(apiKey);
  }
  return translatorInstance;
}

// ==================== STORAGE ====================

class Storage {
  static async addToHistory(original, translation) {
    const history = await this.getHistory();

    const newEntry = {
      id: Date.now(),
      original: original,
      translation: translation,
      timestamp: new Date().toISOString()
    };

    history.unshift(newEntry);

    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }

    return chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history });
  }

  static async getHistory() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
    return result[STORAGE_KEYS.HISTORY] || [];
  }

  static async clearHistory() {
    return chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] });
  }
}

// ==================== SERVICE WORKER LOGIC ====================

// Extension yüklendiğinde
chrome.runtime.onInstalled.addListener(() => {
  // Extension yüklendi
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
  if (command === 'translate-selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'translate-shortcut'
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
      error: error.message || 'Beklenmeyen bir hata oluştu'
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
        console.log(`✅ Çeviri ${i + 1}/${texts.length}:`, text.substring(0, 50), '→', result.translation.substring(0, 50));
        translations.push({ success: true, translation: result.translation });
      } else {
        // API quota hatası kontrolü
        if (result.error && (result.error.includes('quota') || result.error.includes('Quota') || result.error.includes('429'))) {
          console.error('🚫 API Quota limit aşıldı!');
          // Kalan metinler için hata ekle
          for (let j = i; j < texts.length; j++) {
            translations.push({
              success: false,
              error: 'API quota limit aşıldı. Lütfen yarın tekrar deneyin.',
              original: texts[j]
            });
          }
          break; // Döngüyü kır, başka istek gönderme
        }

        console.error(`❌ Çeviri ${i + 1}/${texts.length} başarısız:`, result.error);
        translations.push({ success: false, error: result.error, original: text });
      }
    }

    console.log('✅ Batch translation tamamlandı:', translations.length, 'çeviri');
    sendResponse({
      success: true,
      translations: translations
    });

  } catch (error) {
    console.error('Batch translation error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Toplu çeviri başarısız oldu'
    });
  }
}
