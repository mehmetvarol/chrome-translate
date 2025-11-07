import { GEMINI_API_KEY, GEMINI_API_URL, TARGET_LANGUAGE, MAX_TEXT_LENGTH, TRANSLATION_TIMEOUT } from './constants.js';

/**
 * Gemini API ile çeviri yapar
 * Zarif, hızlı ve context-aware translation
 */
export class Translator {
  constructor(apiKey = GEMINI_API_KEY) {
    this.apiKey = apiKey;
  }

  /**
   * Metni Türkçe'ye çevirir
   * @param {string} text - Çevrilecek metin
   * @returns {Promise<{translation: string, success: boolean, error?: string}>}
   */
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
      return { success: false, error: 'API key ayarlanmamış. Lütfen popup\'tan API key ekleyin.' };
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

  /**
   * API key'i günceller
   * @param {string} newKey
   */
  updateApiKey(newKey) {
    this.apiKey = newKey;
  }
}

// Singleton instance
let translatorInstance = null;

export function getTranslator(apiKey) {
  if (!translatorInstance) {
    translatorInstance = new Translator(apiKey);
  } else if (apiKey) {
    translatorInstance.updateApiKey(apiKey);
  }
  return translatorInstance;
}
