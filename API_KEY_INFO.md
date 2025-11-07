# 🔑 Gemini API Key - Önemli Bilgiler

## API Key Nerede Eklenir?

Extension'da API key'i **2 farklı şekilde** ekleyebilirsiniz:

### ✅ Yöntem 1: UI Üzerinden (ÖNERİLEN)

1. Chrome'da extension ikonuna tıklayın
2. Açılan popup'ta API key input alanına yapıştırın
3. "Kaydet" butonuna tıklayın
4. Hepsi bu kadar!

**Avantajları:**
- ✅ Kod değiştirmeye gerek yok
- ✅ Güvenli (Chrome storage)
- ✅ Kolayca değiştirilebilir

### 🔧 Yöntem 2: Kod İçinde (Development)

Eğer geliştirme yapıyorsanız:

1. `utils/constants.js` dosyasını açın
2. Şu satırı bulun:
   ```javascript
   export const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
   ```
3. `YOUR_GEMINI_API_KEY_HERE` yerine kendi API key'inizi yazın:
   ```javascript
   export const GEMINI_API_KEY = 'AIzaSyB...your-actual-key...';
   ```
4. Dosyayı kaydedin
5. Extension'ı reload edin

**Uyarı:** ⚠️ Bu yöntemi kullanırsanız:
- Git'e commit etmeyin (API key sızabilir)
- `.gitignore` dosyasını kontrol edin
- Production'da Yöntem 1'i kullanın

---

## 🆓 Gemini API - Ücretsiz mi?

**EVET!** Gemini API ücretsiz tier sunuyor:

### Limitler:
- 📊 **60 istek/dakika**
- 📊 **1,500 istek/gün**
- 📊 **1 milyon token/ay**

### Özellikler:
- ✅ Kredi kartı gerektirmez
- ✅ Kayıt ücretsiz
- ✅ Yeterli kullanım kotası
- ✅ Production için kullanılabilir

Ortalama bir kullanıcı için **tamamen ücretsiz** kullanabilirsiniz.

---

## 🔐 API Key Güvenliği

### Extension içinde API key güvenli mi?

**EVET!** İşte nedeni:

1. **Lokal Storage**: API key'iniz sadece bilgisayarınızda saklanır
2. **Şifreleme**: Chrome storage otomatik şifreler
3. **Hiç paylaşılmaz**: API key asla 3. parti sunuculara gönderilmez
4. **Direkt bağlantı**: Sadece Gemini API'ye direkt istek atılır

### API key'i kimse göremez mi?

Teoride, bilgisayarınıza fiziksel erişimi olan biri Chrome storage'dan çıkarabilir. Bu yüzden:

- ⚠️ API key'i başkalarıyla paylaşmayın
- ⚠️ Güvenilmeyen kişilerin bilgisayarınızı kullanmasına izin vermeyin
- ✅ API key'in sadece "test" amaçlı olduğundan emin olun

### API key sızdırırsam ne olur?

Eğer API key'iniz sızarsa:

1. Başkası sizin API limitinizi kullanabilir
2. Google hesabınıza direkt erişim kazanamazlar (API key hesap şifresi değil)
3. Çözüm: [Google AI Studio](https://makersuite.google.com/app/apikey)'dan eski key'i silin, yeni bir tane oluşturun

---

## 🚀 API Key Nasıl Alınır?

### Adım Adım:

1. **Tarayıcıda Aç:**
   ```
   https://makersuite.google.com/app/apikey
   ```

2. **Google ile Giriş Yap**
   - Herhangi bir Google hesabı kullanabilirsiniz
   - Gmail, Workspace, vs.

3. **"Create API Key" Tıkla**
   - "Create API key in new project" seçeneğini seçin
   - Veya mevcut bir Google Cloud projesini seçin

4. **API Key Oluşturuldu!**
   - Ekrana çıkan key'i KOPYALAYIN
   - Güvenli bir yere kaydedin (şifre yöneticisi önerilir)

5. **Extension'a Ekleyin**
   - Chrome extension popup'ında yapıştırın
   - Kaydet butonuna tıklayın

✅ Hazır!

---

## 📊 Kullanım İstatistikleri

API kullanımınızı buradan kontrol edebilirsiniz:
```
https://console.cloud.google.com/apis/dashboard
```

- Günlük istek sayısı
- Kalan kota
- Hata oranları

---

## ❓ Sık Sorulan Sorular

### API key zorunlu mu?

**Evet.** Extension çeviri için Gemini API kullanıyor, API key olmadan çalışmaz.

### Birden fazla cihazda aynı key kullanabilir miyim?

**Evet.** Aynı API key'i farklı bilgisayarlarınızda kullanabilirsiniz. Limit cihaz başına değil, key başınadır.

### API key'imi değiştirebilir miyim?

**Evet.** İstediğiniz zaman yeni bir API key oluşturup extension'a ekleyebilirsiniz. Eski key'i Google Console'dan silebilirsiniz.

### Limit aşarsam ne olur?

API limitini aşarsanız:
- ❌ Çeviri istekleri hata döner
- 🕐 Bir sonraki limitin sıfırlanmasını beklemeniz gerekir (örn: dakika sonrası, gün sonrası)
- 💰 Veya Google Cloud'da ücretli plan alabilirsiniz (opsiyonel)

### Google hesabım çalınabilir mi?

**Hayır.** API key hesap şifresi değildir. API key sadece Gemini API'yi kullanmaya izin verir, Gmail, Drive vs'ye erişim vermez.

---

## 🔗 Faydalı Linkler

- **API Key Alma:** https://makersuite.google.com/app/apikey
- **Gemini Dokümantasyon:** https://ai.google.dev/docs
- **API Kullanım İstatistikleri:** https://console.cloud.google.com/apis/dashboard
- **Google AI Studio:** https://makersuite.google.com/

---

**Güvenli çeviriler! 🔒✨**
