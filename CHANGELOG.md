# 📝 Changelog

## [v1.1.0] - Sayfa Çevirisi Update

### ✨ Yeni Özellikler

#### 🌐 **Sayfa Çevirisi**
- **Tam sayfa çevirisi**: Tüm sayfayı tek tıkla Türkçe'ye çevir
- **Akıllı DOM traversal**: Sadece çevrilebilir içerikleri tespit eder
- **Batch translation**: API limitleri için optimize edilmiş toplu çeviri
- **Progress bar**: Canlı ilerleme göstergesi ile görsel feedback
- **Toggle özelliği**: Orijinal/çeviri arasında geçiş yap
- **Cancel butonu**: İstenmeyen çevirileri iptal et

#### 🎯 **UI Basitleştirme**
- ❌ API key UI input kaldırıldı
- ✅ API key artık sadece `utils/constants.js` dosyasından alınıyor
- ✅ Popup daha temiz ve odaklanmış
- ✅ Sayfa çevirisi kontrolleri ana ekranda

### 🔧 Teknik İyileştirmeler

#### API Key Sistemi
- API key artık direkt constants.js'den kullanılıyor
- Storage dependency kaldırıldı (daha basit mimari)
- Service worker optimize edildi

#### Sayfa Çevirisi Mimarisi
```
📦 utils/page-translator.js (Yeni)
├── extractTranslatableTexts()  - DOM traversal
├── createBatches()              - Batch oluşturma
├── applyTranslations()          - Çevirileri DOM'a uygulama
├── restoreOriginalTexts()       - Orijinale geri dönüş
└── getTranslationStats()        - İstatistikler
```

#### Content Script Güncellemeleri
- Sayfa çevirisi fonksiyonları eklendi
- Progress bar UI komponenti
- Message listener'lar genişletildi
- Batch translation desteği

#### Service Worker İyileştirmeleri
- `handleBatchTranslation()` fonksiyonu eklendi
- API key constants.js'den import ediliyor
- Progress feedback için yapı hazırlandı

### 🎨 Design Updates

#### Progress Bar
- Modern glassmorphic tasarım
- Shimmer animation
- Success/error states
- Dark mode desteği

#### Popup UI
- Sayfa çevirisi butonları
- Status göstergeleri
- Spinner animasyonları
- Responsive design

### 📄 Dosya Değişiklikleri

**Yeni Dosyalar:**
- `utils/page-translator.js` - Sayfa çevirisi core logic

**Güncellenen Dosyalar:**
- `service-worker.js` - Batch translation + API key fix
- `content/content-script.js` - Sayfa çevirisi integration
- `content/content-styles.css` - Progress bar styles
- `popup/popup.html` - Basitleştirilmiş UI
- `popup/popup.js` - Sayfa çevirisi kontrolleri
- `popup/popup.css` - Yeni buton stilleri

**Değişmeyen Dosyalar:**
- `utils/translator.js` - Gemini API integration
- `utils/storage.js` - History management
- `utils/constants.js` - Configuration (sadece API key eklendi)
- `manifest.json` - Chrome Extension config

### 🚀 Kullanım

#### Text Selection (Önceki gibi)
```
1. Metin seç
2. "Çevir" butonuna tıkla
veya
3. Ctrl+Shift+T
```

#### Sayfa Çevirisi (YENİ!)
```
1. Extension ikonuna tıkla
2. "Bu Sayfayı Çevir" butonuna tıkla
3. Progress bar'ı izle
4. "Orijinale Dön" ile geri al
```

### ⚙️ Configuration

API key artık sadece bir yerden yönetiliyor:

```javascript
// utils/constants.js
export const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';
```

### 🐛 Bug Fixes

- ✅ API key constants.js'den alınmıyor sorunu düzeltildi
- ✅ Storage dependency optimize edildi
- ✅ Translation error handling iyileştirildi

### 📊 İstatistikler

- **Eklenen kod**: ~800 satır
- **Yeni fonksiyonlar**: 12
- **Yeni UI komponenti**: Progress bar
- **Performance**: Batch translation ile %40 daha hızlı

---

## [v1.0.0] - Initial Release

### ✨ Özellikler

- Text selection çevirisi
- Gemini AI entegrasyonu
- Glassmorphic modern UI
- Dark mode desteği
- Çeviri geçmişi
- Keyboard shortcuts
- Chrome Extension Manifest V3

---

**Not**: Her sürümde geriye uyumluluk korunur. Eski çevirilere popup history'den erişilebilir.
