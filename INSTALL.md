# 📦 Kurulum Rehberi

Bu dokümanda **Çevir** extension'ını Chrome'a nasıl yükleyeceğinizi adım adım anlatıyoruz.

---

## ⚠️ Başlamadan Önce

Extension çalışması için **Gemini API Key** gereklidir. Ücretsiz alabilirsiniz.

---

## 📋 Adım 1: Gemini API Key Alın

1. Tarayıcınızda şu adresi açın:
   ```
   https://makersuite.google.com/app/apikey
   ```

2. Google hesabınızla giriş yapın

3. **"Create API Key"** veya **"Get API Key"** butonuna tıklayın

4. Açılan sayfada:
   - Yeni bir Google Cloud projesi seçin veya oluşturun
   - **"Create API key in new project"** seçeneğine tıklayın

5. API key'iniz oluşturuldu!
   - **KOPYALAYIN** ve güvenli bir yere kaydedin
   - Bu key'i kimseyle paylaşmayın

📝 **Not**: Gemini API ücretsiz tier:
- ✅ Aylık 60 istek/dakika
- ✅ Günlük 1,500 istek limit
- ✅ Kredi kartı gerektirmez

---

## 📥 Adım 2: Extension Dosyalarını İndirin

### Opsiy on A: Git Clone (Önerilen)

Terminal açın ve şu komutu çalıştırın:

```bash
git clone [REPOSITORY_URL]
cd translate
```

### Opsiyon B: ZIP İndirme

1. Repository sayfasında **"Code"** butonuna tıklayın
2. **"Download ZIP"** seçeneğini seçin
3. ZIP dosyasını indirin ve çıkartın
4. Çıkarılan `translate` klasörünü bulun

---

## 🔧 Adım 3: Chrome'a Extension Yükleyin

1. **Chrome tarayıcınızı açın**

2. Adres çubuğuna şunu yazın ve Enter'a basın:
   ```
   chrome://extensions/
   ```

3. Sağ üst köşede **"Developer mode"** toggle'ını **AÇIN** (enable)

   ![Developer Mode](https://developer.chrome.com/static/docs/extensions/mv3/getstarted/images/devmode.png)

4. Sol üstte görünen **"Load unpacked"** butonuna tıklayın

5. Açılan dosya seçicide:
   - İndirdiğiniz `translate` klasörünü bulun
   - Klasörü seçin (içine girmeden)
   - **"Select"** veya **"Aç"** butonuna tıklayın

6. Extension yüklendi! ✅

   Artık `chrome://extensions/` sayfasında **"Çevir - Akıllı Türkçe Çeviri"** extension'ını görebilirsiniz.

---

## 🔑 Adım 4: API Key'i Ayarlayın

1. Chrome toolbar'da (adres çubuğunun yanında) **Çevir extension icon'una** tıklayın

   > Icon'u göremiyorsa puzzle (🧩) ikonuna tıklayın ve listeden bulun

2. Açılan popup'ta:
   - **"API Key"** input alanına Adım 1'de kopyaladığınız Gemini API key'i yapıştırın
   - **"Kaydet"** butonuna tıklayın

3. ✅ "API Key başarıyla kaydedildi!" mesajını göreceksiniz

---

## ✨ Adım 5: İlk Çevirinizi Yapın!

### Test etmek için:

1. Herhangi bir web sayfasına gidin (örn: wikipedia.org/wiki/Artificial_intelligence)

2. Bir metni **mouse ile seçin**

3. Seçimin yanında beliren **"Çevir"** butonuna tıklayın

4. 🎉 Çeviri popup'ı açılacak!

### Klavye kısayolu ile:

1. Bir metin seçin
2. **Windows/Linux**: `Ctrl + Shift + T`
   **Mac**: `Cmd + Shift + T`
3. Anında çeviri!

---

## 🐛 Sorun mu Yaşıyorsunuz?

### "API key ayarlanmamış" hatası

**Çözüm**:
- Extension icon'una tıklayın
- API key'inizi girin ve kaydedin
- Sayfayı yenileyin (F5)

### Translate butonu görünmüyor

**Çözüm**:
- `chrome://extensions/` sayfasına gidin
- Extension'ın **AÇIK** (enabled) olduğundan emin olun
- Sayfayı yenileyin (F5)
- Eğer hala görünmüyorsa, Developer Console'u açın (F12) ve hata mesajı var mı kontrol edin

### "Çeviri başarısız oldu" hatası

**Çözüm**:
- İnternet bağlantınızı kontrol edin
- API key'in doğru girildiğinden emin olun
- Gemini API limitinizi aşmadığınızı kontrol edin

### Extension yüklenmiyor

**Çözüm**:
- Developer mode'un AÇIK olduğundan emin olun
- Doğru klasörü seçtiğinizden emin olun (içinde `manifest.json` olmalı)
- Chrome'u yeniden başlatın

---

## 🎯 Extension'ı Kaldırma

1. `chrome://extensions/` sayfasına gidin
2. **"Çevir"** extension'ını bulun
3. **"Remove"** butonuna tıklayın
4. Onaylayın

Tüm veriler (API key, geçmiş) silinecektir.

---

## 🔄 Extension'ı Güncelleme

1. Yeni dosyaları indirin (git pull veya ZIP)
2. `chrome://extensions/` sayfasında
3. **"Çevir"** extension'ında **reload (🔄)** ikonuna tıklayın

---

## 📞 Yardıma mı İhtiyacınız Var?

- README.md dosyasındaki SSS bölümüne bakın
- GitHub Issues'da soru sorun
- Debug için Chrome DevTools Console'u kontrol edin

---

**Keyifli çeviriler! ✨**
