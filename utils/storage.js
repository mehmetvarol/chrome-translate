import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from './constants.js';

/**
 * Chrome Storage API wrapper
 * Elegant and type-safe storage operations
 */
export class Storage {

  /**
   * API key'i kaydeder
   */
  static async saveApiKey(apiKey) {
    return chrome.storage.local.set({ [STORAGE_KEYS.API_KEY]: apiKey });
  }

  /**
   * API key'i alır
   */
  static async getApiKey() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
    return result[STORAGE_KEYS.API_KEY] || null;
  }

  /**
   * Çeviri geçmişine ekler
   */
  static async addToHistory(original, translation) {
    const history = await this.getHistory();

    const newEntry = {
      id: Date.now(),
      original: original,
      translation: translation,
      timestamp: new Date().toISOString()
    };

    // En yeni başta olacak şekilde ekle
    history.unshift(newEntry);

    // Limit aşılırsa eski kayıtları sil
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }

    return chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history });
  }

  /**
   * Çeviri geçmişini alır
   */
  static async getHistory() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
    return result[STORAGE_KEYS.HISTORY] || [];
  }

  /**
   * Geçmişi temizler
   */
  static async clearHistory() {
    return chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] });
  }

  /**
   * Ayarları kaydeder
   */
  static async saveSettings(settings) {
    return chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  }

  /**
   * Ayarları alır
   */
  static async getSettings() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return result[STORAGE_KEYS.SETTINGS] || {
      autoTranslate: false,
      showHistory: true,
      soundEnabled: false
    };
  }
}
