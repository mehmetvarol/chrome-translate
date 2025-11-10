// 🔑 API Configuration
// ⚠️ Bu dosyayı utils/constants.js olarak kopyalayın ve kendi API anahtarınızı ekleyin
// Gemini API key almak için: https://makersuite.google.com/app/apikey
export const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

// API Endpoints
export const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Translation Settings
export const TARGET_LANGUAGE = "Türkçe";
export const MAX_TEXT_LENGTH = 5000;
export const TRANSLATION_TIMEOUT = 10000; // 10 seconds

// UI Constants
export const BUTTON_OFFSET = { x: 10, y: -10 };
export const POPUP_MAX_WIDTH = 400;
export const POPUP_MAX_HEIGHT = 300;

// Animation Durations (ms)
export const ANIMATION = {
  BUTTON_APPEAR: 200,
  POPUP_OPEN: 300,
  FADE: 150,
};

// Storage Keys
export const STORAGE_KEYS = {
  API_KEY: "gemini_api_key",
  HISTORY: "translation_history",
  SETTINGS: "user_settings",
};

// History Settings
export const MAX_HISTORY_ITEMS = 50;
