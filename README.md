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
   cd translate
   ```

2. Chrome'da şu adrese gidin: `chrome://extensions/`

3. Sağ üstteki **"Developer mode"** toggle'ını açın

4. **"Load unpacked"** butonuna tıklayın

5. `translate` klasörünü seçin

### 3. API Key'i Ayarlayın

1. Extension ikonuna tıklayın
2. Gemini API Key'inizi yapıştırın
3. **"Kaydet"** butonuna tıklayın

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
translate/
├── manifest.json              # Chrome Extension Manifest V3
├── service-worker.js          # Background script (çeviri orchestration)
├── content/
│   ├── content-script.js      # Selection detection, UI injection
│   └── content-styles.css     # Glassmorphic components
├── popup/
│   ├── popup.html             # Settings & history panel
│   ├── popup.js               # State management
│   └── popup.css              # Modern design system
├── utils/
│   ├── translator.js          # Gemini API integration
│   ├── storage.js             # Chrome storage wrapper
│   └── constants.js           # Configuration
└── assets/
    └── icons/                 # Extension icons
```

### Teknolojiler

- **Manifest V3**: En güncel Chrome Extension standardı
- **Gemini AI**: Google'ın en gelişmiş dil modeli
- **ES Modules**: Modern JavaScript architecture
- **CSS Animations**: GPU-accelerated smooth transitions
- **Chrome Storage API**: Secure local storage

---

## 🔧 Geliştirme

### API Key Konfigürasyonu

API key'i iki şekilde ayarlayabilirsiniz:

**1. UI üzerinden** (Önerilen):
- Extension popup'ında API key alanına yapıştırın

**2. Kod içinde** (Development):
- `utils/constants.js` dosyasını açın
- `GEMINI_API_KEY` değişkenini güncelleyin:

```javascript
export const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';
```

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
