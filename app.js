// ─────────────────────────────────────────────────────────────
//  Roberta Birthday Gallery — Y2K EDITION with Confetti & Stickers
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, onValue, limitToLast } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ── 🔧 FIREBASE CONFIG ────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCKlzpAdvNUul5q8zUj3TUj8OwhG_sA9KI",
  authDomain: "ruby-birthday.firebaseapp.com",
  databaseURL: "https://ruby-birthday-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ruby-birthday",
  storageBucket: "ruby-birthday.firebasestorage.app",
  messagingSenderId: "703828486361",
  appId: "1:703828486361:web:93100040166ed8a315f6c8"
};
// ─────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

const $ = id => document.getElementById(id);

const video       = $("video");
const vfIdle      = $("vf-idle");
const canvas      = $("canvas");
const flash       = $("flash");
const polaroid    = $("polaroid-wrap");
const preview     = $("preview");
const ctrlOpen    = $("ctrl-open");
const ctrlSnap    = $("ctrl-snap");
const ctrlPreview = $("ctrl-preview");
const statusEl    = $("booth-status");
const galleryGrid = $("gallery-grid");
const galleryCount= $("gallery-count");
const lightbox    = $("lightbox");
const lbImg       = $("lb-img");

let stream     = null;
let facingMode = "user";
let lastPhoto  = null;

// Y2K mesajları ✨
const y2kMessages = [
  "Ayy çok tatlısın! 💕", 
  "Yıldız gibi poz ver! ⭐", 
  "SLAY QUEEN! 👑", 
  "Britney vibes! 🎤", 
  "Too hot! 🔥", 
  "That's hot! 🥵",
  "Glamour queen! 💄",
  "You're a rockstar! 🎸"
];

const show = el => el.classList.remove("hide");
const hide = el => el.classList.add("hide");

const setStatus = (msg) => {
  statusEl.textContent = msg;
  // Her 3 saniyede bir random mesaj göster (eğer kamera açıksa)
  if (!msg.includes("Apri") && !msg.includes("Errore")) {
    setTimeout(() => {
      if (!ctrlSnap.classList.contains("hide")) {
        statusEl.textContent = y2kMessages[Math.floor(Math.random() * y2kMessages.length)];
      }
    }, 3000);
  }
};

// ── CONFETTI ──────────────────────────────────────────────────
function explodeConfetti() {
  const canvas = document.createElement("canvas");
  canvas.id = "confetti-canvas";
  document.body.appendChild(canvas);
  
  const duration = 15 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
  
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    
    if (timeLeft <= 0) {
      clearInterval(interval);
      const confettiCanvas = document.getElementById("confetti-canvas");
      if (confettiCanvas) confettiCanvas.remove();
      return;
    }
    
    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

// Basit confetti (eğer confetti kütüphanesi yoksa çalışsın)
window.confetti = window.confetti || function(options) {
  // Fallback - emoji yağdır
  for(let i = 0; i < 30; i++) {
    setTimeout(() => {
      const emoji = document.createElement("div");
      emoji.textContent = ["✨", "🎉", "💖", "⭐", "🌸", "💕", "🎀"][Math.floor(Math.random() * 7)];
      emoji.style.position = "fixed";
      emoji.style.left = Math.random() * window.innerWidth + "px";
      emoji.style.top = "-20px";
      emoji.style.fontSize = Math.random() * 20 + 15 + "px";
      emoji.style.zIndex = "1001";
      emoji.style.pointerEvents = "none";
      emoji.style.animation = `fall ${Math.random() * 2 + 2}s linear forwards`;
      document.body.appendChild(emoji);
      setTimeout(() => emoji.remove(), 3000);
    }, i * 50);
  }
};

// CSS animasyonu ekle
if (!document.querySelector("#confetti-style")) {
  const style = document.createElement("style");
  style.id = "confetti-style";
  style.textContent = `
    @keyframes fall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ── BASİT STICKER EKLEME (Fotoğrafa kalp bas) ────────────────
async function addStickerToPhoto(imageDataUrl, stickerType = "heart") {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      // Sticker çiz (sağ alt köşe)
      const stickerSize = Math.min(img.width, img.height) * 0.15;
      const x = img.width - stickerSize - 10;
      const y = img.height - stickerSize - 10;
      
      if (stickerType === "heart") {
        ctx.font = `${stickerSize}px Arial`;
        ctx.fillStyle = "#FF69B4";
        ctx.fillText("❤️", x, y + stickerSize);
      } else if (stickerType === "star") {
        ctx.font = `${stickerSize}px Arial`;
        ctx.fillStyle = "#FFD700";
        ctx.fillText("⭐", x, y + stickerSize);
      }
      
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = imageDataUrl;
  });
}

// ── Gallery (sadece son 30 fotoğraf) ─────────────────────────
onValue(ref(db, "photos"), snap => {
  const data = snap.val();
  if (!data) {
    galleryGrid.innerHTML = `<p class="gallery-empty">Henüz fotoğraf yok — ilk sen ol ✦</p>`;
    galleryCount.textContent = "";
    return;
  }
  const photos = Object.values(data).sort((a,b) => b.ts - a.ts).slice(0, 30);
  galleryCount.textContent = photos.length + (photos.length === 1 ? " anı" : " anı");
  galleryGrid.innerHTML = "";
  photos.forEach((p, i) => {
    const c = document.createElement("div");
    c.className = "g-card";
    c.style.animationDelay = (i * 0.04) + "s";
    c.innerHTML = `<img src="${p.data}" alt="Foto ${i+1}" loading="lazy"><p class="g-card-cap">Roberta ✦ 2026</p>`;
    c.onclick = () => { lbImg.src = p.data; lightbox.classList.add("on"); document.body.style.overflow="hidden"; };
    galleryGrid.appendChild(c);
  });
});

// ── Camera (geliştirilmiş hata yönetimi) ─────────────────────
async function openCamera() {
  setStatus("Fotokabin açılıyor... ✨");
  try {
    if (stream) stream.getTracks().forEach(t => t.stop());
    
    let constraints = {
      video: { 
        facingMode: { exact: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };
    
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn("Exact constraint failed, trying ideal:", err);
      constraints = {
        video: { 
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    }
    
    video.srcObject = stream;
    video.style.display = "block";
    await video.play();
    document.getElementById("viewfinder").classList.remove("hide");
    vfIdle.style.display = "none";
    polaroid.style.display = "none";
    polaroid.classList.add("hide");
    hide(ctrlOpen); show(ctrlSnap);
    setStatus(y2kMessages[Math.floor(Math.random() * y2kMessages.length)]);
  } catch (e) {
    console.error(e);
    if (e.name === "NotAllowedError") {
      setStatus("Kamera izni vermelisin, yoksa fotoğraf çekemem 💔 Ayarlardan izin ver!");
    } else if (e.name === "NotFoundError") {
      setStatus("Kamera bulunamadı 😢 Telefonunda kamera var mı?");
    } else {
      setStatus("Kamera açılamadı. Safari veya Chrome'da dene!");
    }
  }
}

// ── Fotoğraf çek + efekt + sticker ───────────────────────────
async function takePhoto() {
  canvas.width  = video.videoWidth  || 1080;
  canvas.height = video.videoHeight || 1440;
  const ctx = canvas.getContext("2d");
  if (facingMode === "user") { 
    ctx.translate(canvas.width, 0); 
    ctx.scale(-1, 1); 
  }
  ctx.drawImage(video, 0, 0);
  if (facingMode === "user") { 
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
  }
  
  let photoData = canvas.toDataURL("image/jpeg", 0.85);
  
  // Rastgele sticker ekle (kalp veya yıldız)
  const stickerType = Math.random() > 0.5 ? "heart" : "star";
  photoData = await addStickerToPhoto(photoData, stickerType);
  
  lastPhoto = photoData;
  
  // Flaş efekti (pembe)
  flash.classList.add("go");
  setTimeout(() => flash.classList.remove("go"), 200);
  
  // Shutter sesi (tiz bir bip)
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.1;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch(e) { console.log("Ses çalınamadı"); }
  
  preview.src = lastPhoto;
  polaroid.classList.remove("hide");
  polaroid.style.display = "flex";
  video.style.display = "none";
  hide(ctrlSnap); show(ctrlPreview);
  setStatus("Ti piace? Aşkım! Kaydet ya da yeniden çek 🌹");
}

async function savePhoto() {
  if (!lastPhoto) return;
  $("btn-save").disabled = true;
  setStatus("Kaydediliyor... 💾");
  try {
    await push(ref(db, "photos"), { data: lastPhoto, ts: Date.now() });
    lastPhoto = null; preview.src = "";
    polaroid.style.display = "none";
    video.style.display = "block";
    hide(ctrlPreview); show(ctrlSnap);
    
    // KONFETİ PATLAT! 🎉
    explodeConfetti();
    setStatus("Galeriye eklendi! 🎉 Sen bir superstar'sın! 🌟");
    
    $("gallery").scrollIntoView({ behavior: "smooth" });
  } catch(e) {
    console.error(e);
    setStatus("Kaydetme hatası. Firebase config'ini kontrol et!");
  }
  $("btn-save").disabled = false;
}

function retakePhoto() {
  lastPhoto = null; preview.src = "";
  polaroid.style.display = "none";
  video.style.display = "block";
  hide(ctrlPreview); show(ctrlSnap);
  setStatus("Tekrar dene! Pozunu ayarla 😊");
}

// ── Lightbox ──────────────────────────────────────────────────
$("lb-close").onclick = () => { lightbox.classList.remove("on"); lbImg.src=""; document.body.style.overflow=""; };
lightbox.onclick = e => { if(e.target===lightbox){ lightbox.classList.remove("on"); lbImg.src=""; document.body.style.overflow=""; } };

// ── Events ────────────────────────────────────────────────────
$("btn-open").onclick  = openCamera;
$("btn-snap").onclick  = takePhoto;
$("btn-flip").onclick  = () => { 
  facingMode = facingMode === "user" ? "environment" : "user"; 
  openCamera(); 
  setStatus("Kamera değişti! 📸");
};
$("btn-save").onclick  = savePhoto;
$("btn-retake").onclick = retakePhoto;