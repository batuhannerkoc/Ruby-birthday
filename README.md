# 🌹 Ruby Birthday Gallery

Vintage editorial magazine temalı doğum günü fotoğraf galerisi.
Shared gallery — herkes birbirinin fotoğrafını görür.

---

## Dosyalar

```
ruby-birthday/
├── index.html   — Ana sayfa
├── style.css    — Tüm stiller
├── app.js       — Kamera + Firebase galeri
└── README.md    — Bu dosya
```

---

## Firebase Kurulumu (Adım adım, ~5 dakika)

### 1. Firebase projesi oluştur

1. https://console.firebase.google.com adresine git
2. Google hesabınla giriş yap
3. **"Add project"** → proje adı yaz (örn. `ruby-birthday`) → Continue
4. Google Analytics'i **kapatabilirsin** → **"Create project"**

---

### 2. Realtime Database aç

1. Sol menüde **"Realtime Database"** → **"Create database"**
2. Bölge seç: **"Europe (belgium)"** → Next
3. Security rules: **"Start in test mode"** seç → **"Enable"**

> ⚠️ Test mode 30 gün açık kalır — partiden sonra database'i silebilirsin.

---

### 3. Web uygulaması ekle ve config al

1. Sol üstte ⚙️ simgesi → **"Project settings"**
2. Aşağı kaydır → **"Your apps"** → `</>` (Web) ikonuna tıkla
3. App nickname yaz (örn. `ruby-web`) → **"Register app"**
4. Karşına çıkan `firebaseConfig` objesini kopyala:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ruby-birthday-xxxx.firebaseapp.com",
  databaseURL: "https://ruby-birthday-xxxx-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ruby-birthday-xxxx",
  storageBucket: "ruby-birthday-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

### 4. app.js içine yapıştır

`app.js` dosyasını aç ve en üstteki `firebaseConfig` bloğunu kendi değerlerinle değiştir:

```js
// ── 🔧 FIREBASE CONFIG ─────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSy...",        // ← buraya
  authDomain:        "ruby-birthday-xxxx.firebaseapp.com",
  databaseURL:       "https://ruby-birthday-xxxx-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "ruby-birthday-xxxx",
  storageBucket:     "ruby-birthday-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

---

## Deploy

### Seçenek A — Kendi sunucun
- Üç dosyayı (`index.html`, `style.css`, `app.js`) aynı klasöre yükle
- **HTTPS zorunlu** — kamera için gerekli (modern hosting'lerde default açık)

### Seçenek B — Netlify (ücretsiz, 2 dk)
1. https://netlify.com → **"Add new site"** → **"Deploy manually"**
2. `ruby-birthday` klasörünü sürükle bırak
3. URL hazır: `https://xxxxx.netlify.app`

### Seçenek C — GitHub Pages (ücretsiz)
1. Yeni repo oluştur, 3 dosyayı root'a push'la
2. Settings → Pages → Source: main branch
3. URL: `https://kullaniciadi.github.io/repo-adi`

---

## QR Kod

Site URL'ini al ve şuradan QR üret:
- https://qr-code-generator.com
- https://goqr.me

PNG olarak indir, yazdır, masalara koy 🎉

---

## Kamera Notları

- HTTPS gerektirir (tüm modern hosting'lerde default)
- İlk açılışta kamera izni ister
- iPhone (Safari) ve Android (Chrome) çalışır
- Flip butonu ön/arka kamera geçişi yapar

---

Happy Birthday Ruby! 🌹
