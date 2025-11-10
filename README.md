# 🌐 Çevir - Akıllı Türkçe Çeviri

**Modern, hızlı ve zarif Chrome extension ile seçtiğiniz metni anında Türkçe'ye çevirin.**

Gemini AI ile güçlendirilmiş, glassmorphic tasarım dili ile tasarlanmış premium çeviri deneyimi.

---

## ✨ Özellikler

- **⚡ Anında Çeviri**: Metni seçin, çevirin. Zero delay.
- **🎨 Modern UI**: Glassmorphic design, smooth animations
- **🌙 Dark Mode**: Otomatik sistem teması desteği
- **📋 Akıllı Geçmiş**: Son 50 çeviri otomatik kaydedilir
- **⌨️ Klavye Kısayolu**: `Ctrl+Shift+T` (Mac: `Cmd+Shift+T`)
- **🔒 Gizlilik**: API key'iniz sadece sizin cihazınızda saklanır
- **🎯 Context-Aware**: Gemini AI ile bağlama uygun çeviriler

---

## 🚀 Kurulum

### 1. Gemini API Key Alın

1. [Google AI Studio](https://makersuite.google.com/app/apikey) sayfasına gidin
2. "Create API Key" butonuna tıklayın
3. API key'inizi kopyalayın

### 2. Extension'ı Yükleyin

1. Bu repository'yi indirin veya clone edin:
   ```bash
   git clone [repository-url]
   cd chrome-translate
   ```

2. **API anahtarınızı yapılandırın**:
   ```bash
   # constants.example.js'i constants.js olarak kopyalayın
   cp utils/constants.example.js utils/constants.js
   ```

3. `utils/constants.js` dosyasını herhangi bir editörle açın ve `YOUR_API_KEY_HERE` yerine kendi API anahtarınızı yazın:
   ```javascript
   export const GEMINI_API_KEY = "BURAYA_KENDI_API_KEYINIZI_YAPIŞTIRIN";
   ```

   ⚠️ **ÖNEMLİ**: `utils/constants.js` dosyası `.gitignore`'da yer alır ve asla git'e commit edilmez!

4. Chrome'da şu adrese gidin: `chrome://extensions/`

5. Sağ üstteki **"Developer mode"** toggle'ını açın

6. **"Load unpacked"** butonuna tıklayın

7. `chrome-translate` klasörünü seçin

✅ Hazırsınız! Artık çeviri yapabilirsiniz.

---

## 💡 Kullanım

### Yöntem 1: Mouse ile

1. Herhangi bir web sayfasında metin seçin
2. Beliren **"Çevir"** butonuna tıklayın
3. Çeviriyi görün ve kopyalayın

### Yöntem 2: Klavye Kısayolu

1. Metin seçin
2. `Ctrl+Shift+T` (Mac: `Cmd+Shift+T`) tuşlarına basın
3. Anında çeviri alın

---

## 🎨 Özellikler Detayı

### Glassmorphic UI

Modern, saydam ve blur efektli tasarım. Hem light hem dark mode'da kusursuz uyum.

### Akıllı Konumlandırma

Popup, seçtiğiniz metnin yanında otomatik olarak konumlanır. Ekran dışına taşmaz.

### Smooth Animations

Her etkileşim, dikkatle tasarlanmış animasyonlarla desteklenmiştir:
- Button appear: Scale + fade
- Popup open: Slide + fade
- Success states: Color transition
- Loading: Shimmer skeleton

### Translation History

- Son 50 çeviri otomatik kaydedilir
- Timestamp ile organize
- Tek tıkla kopyalama
- Geçmişi temizleme özelliği

---

## 🏗️ Teknik Mimari

```
chrome-translate/
├── manifest.json              # Chrome Extension Manifest V3 (ES Module support)
├── service-worker.js          # Background script (ES Module - imports utils/)
├── content/
│   ├── content-script.js      # Selection detection, UI injection
│   └── content-styles.css     # Glassmorphic components
├── popup/
│   ├── popup.html             # Settings & history panel
│   ├── popup.js               # State management
│   └── popup.css              # Modern design system
├── utils/
│   ├── translator.js          # Gemini API integration (ES Module)
│   ├── storage.js             # Chrome storage wrapper (ES Module)
│   ├── constants.js           # Configuration (GİTİGNORE - API key burada!)
│   └── constants.example.js   # Example config (şablon dosya)
└── assets/
    └── icons/                 # Extension icons
```

### Teknolojiler

- **Manifest V3**: En güncel Chrome Extension standardı
- **ES Modules**: Modern JavaScript modül sistemi (service worker "type": "module")
- **Gemini AI**: Google'ın Gemini 2.5 Flash modeli
- **CSS Animations**: GPU-accelerated smooth transitions
- **Chrome Storage API**: Secure local storage
- **TreeWalker API**: Efficient DOM traversal for page translation

---

## 🔧 Geliştirme

### API Key Konfigürasyonu

⚠️ **ÖNEMLİ GÜVENLİK NOTU**: API anahtarınızı asla git repository'sine commit etmeyin!

Bu proje **ES Module** yapısı kullanır ve API key'i güvenli şekilde constants.js dosyasından import eder:

**Yapılandırma Adımları**:

1. `utils/constants.example.js` dosyasını `utils/constants.js` olarak kopyalayın:
   ```bash
   cp utils/constants.example.js utils/constants.js
   ```

2. `utils/constants.js` dosyasını açın ve API key'inizi ekleyin:
   ```javascript
   export const GEMINI_API_KEY = 'BURAYA_KENDI_API_KEYINIZI_YAPIŞTIRIN';
   ```

3. Extension'ı Chrome'da yeniden yükleyin

**Not**: `utils/constants.js` dosyası `.gitignore`'da yer almaktadır ve git'e commit edilmeyecektir.

**Manifest V3 + ES Modules**: Bu proje modern Chrome Extension yapısı kullanır. Service worker "type": "module" olarak yapılandırılmıştır ve ES6 import/export kullanır.

### Icon Güncelleme

Icon dosyaları `assets/icons/` klasöründe. Şu boyutlarda PNG dosyaları kullanın:
- `icon16.png` - Toolbar icon
- `icon48.png` - Extension management
- `icon128.png` - Chrome Web Store

SVG'den PNG oluşturmak için:
```bash
# ImageMagick kullanarak
convert -background none -resize 16x16 icon.svg icon16.png
convert -background none -resize 48x48 icon.svg icon48.png
convert -background none -resize 128x128 icon.svg icon128.png
```

### Debug

1. `chrome://extensions/` sayfasında extension'ın yanındaki **"Details"** butonuna tıklayın
2. **"Inspect views: service worker"** linkine tıklayın (Background script console)
3. Web sayfasında sağ tık → **"Inspect"** → **"Console"** (Content script logs)

---

## 🎯 Sık Sorulan Sorular

### API key güvenli mi?

Evet. API key'iniz:
- ✅ Sadece sizin bilgisayarınızda (Chrome storage) saklanır
- ✅ Hiçbir sunucuya gönderilmez
- ✅ Sadece Gemini API'ye direkt istek atmak için kullanılır

### Ücretsiz mi?

Evet! Gemini API ücretsiz tier sunuyor:
- ✅ Aylık 60 istek/dakika
- ✅ Günlük 1,500 istek
- ✅ Kredi kartı gerektirmez

### Hangi dilleri destekliyor?

Şu anda sadece **Türkçe'ye çeviri** yapıyor. Kaynak dil otomatik algılanır (İngilizce, Fransızca, Almanca, vb.).

### Offline çalışır mı?

Hayır, çeviri için internet bağlantısı gerekiyor (Gemini API cloud-based).

---

## 🐛 Sorun Giderme

### "API key ayarlanmamış" hatası

→ Extension popup'ından API key'inizi ekleyin ve kaydedin.

### "Çeviri başarısız oldu" hatası

→ İnternet bağlantınızı kontrol edin
→ API key'in doğru olduğundan emin olun
→ Gemini API limitinizi aşmadığınızdan emin olun

### Button görünmüyor

→ Sayfayı yenileyin (F5)
→ Extension'ın aktif olduğunu kontrol edin
→ Developer console'da hata olup olmadığına bakın

---

## 📝 Lisans

Bu proje MIT lisansı altında açık kaynak olarak sunulmuştur.

---

## 🌟 Katkıda Bulunun

Pull request'ler memnuniyetle karşılanır! Özellikle:

- 🎨 UI/UX iyileştirmeleri
- 🌐 Çoklu dil desteği
- ⚡ Performance optimizasyonları
- 🐛 Bug fix'ler

---

## 💬 İletişim

Sorularınız veya önerileriniz için issue açabilirsiniz.

---

**Gemini AI ile güçlendirilmiştir ✨**

Kod yazmaya gelmedik. Evrende iz bırakmaya geldik. 🚀
