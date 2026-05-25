// ─────────────────────────────────────────────────────────────
//  Roberta Birthday Gallery — Y2K FASHION MAGAZINE EDITION
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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

// İtalyanca Editoryal Sloganlar
const magazineSlogans = [
  "INQUADRA L'OBIETTIVO! ⚡", 
  "SEI BELLISSIMA! 👑", 
  "SOLO VIBES DA POPSTAR 🎤", 
  "THAT'S HOT! 🔥",
  "FASCINO DA COPERTINA 💄",
  "SEI UNA ROCKSTAR! 🎸"
];

const show = el => el.classList.remove("hide");
const hide = el => el.classList.add("hide");

const setStatus = (msg) => {
  statusEl.textContent = msg;
  if (!msg.includes("APRI") && !msg.includes("Errore") && !msg.includes("Salvataggio")) {
    setTimeout(() => {
      if (!ctrlSnap.classList.contains("hide")) {
        statusEl.textContent = magazineSlogans[Math.floor(Math.random() * magazineSlogans.length)];
      }
    }, 3000);
  }
};

// ── CONFETTI FALLBACK ─────────────────────────────────────────
function explodeConfetti() {
  for(let i = 0; i < 35; i++) {
    setTimeout(() => {
      const emoji = document.createElement("div");
      emoji.textContent = ["✨", "💖", "⭐", "⚡", "🌸", "🎀"][Math.floor(Math.random() * 6)];
      emoji.style.position = "fixed";
      emoji.style.left = Math.random() * window.innerWidth + "px";
      emoji.style.top = "-20px";
      emoji.style.fontSize = Math.random() * 20 + 15 + "px";
      emoji.style.zIndex = "1001";
      emoji.style.pointerEvents = "none";
      emoji.style.animation = `fall ${Math.random() * 2 + 1.5}s linear forwards`;
      document.body.appendChild(emoji);
      setTimeout(() => emoji.remove(), 2500);
    }, i * 60);
  }
}

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

// ── AUTOMATIC MAGAZINE LOGO KATMANI ──
async function addEditorialBranding(imageDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      canvas.width = 1080;
      canvas.height = 1440;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const fontSize = Math.floor(canvas.width * 0.055);
      ctx.font = `black ${fontSize}px Impact, sans-serif`;
      
      // ROBERTA MAG Logosu
      ctx.fillStyle = "#ff007f";
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText("ROBERTA MAG", 30, canvas.height - 30);
      
      // Sağ Alt Köşe Issue Yazısı
      ctx.font = `italic ${fontSize * 0.55}px Georgia`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "right";
      ctx.fillText("EDIZIONE 2026 ✦", canvas.width - 30, canvas.height - 35);
      
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = imageDataUrl;
  });
}

// ── GALLERY (Realtime Database Listener) ──────────────────────
onValue(ref(db, "photos"), snap => {
  const data = snap.val();
  if (!data) {
    galleryGrid.innerHTML = `<p class="gallery-empty">Ancora nessuna copertina — sii il primo ✦</p>`;
    galleryCount.textContent = "";
    return;
  }
  const photos = Object.values(data).sort((a,b) => b.ts - a.ts).slice(0, 30);
  galleryCount.textContent = photos.length + (photos.length === 1 ? " COPERTINA" : " COPERTINE");
  galleryGrid.innerHTML = "";
  photos.forEach((p, i) => {
    const c = document.createElement("div");
    c.className = "g-card";
    c.style.animationDelay = (i * 0.04) + "s";
    c.innerHTML = `<img src="${p.data}" alt="Foto ${i+1}" loading="lazy"><p class="g-card-cap">EDIZIONE SPECIALE 2026</p>`;
    c.onclick = () => { lbImg.src = p.data; lightbox.classList.add("on"); document.body.style.overflow="hidden"; };
    galleryGrid.appendChild(c);
  });
});

// ── CAMERA OPERATIONAL ────────────────────────────────────────
async function openCamera() {
  setStatus("APERTURA DELLO STUDIO... ✨");
  try {
    if (stream) stream.getTracks().forEach(t => t.stop());
    
    let constraints = {
      video: { 
        facingMode: { ideal: facingMode },
        width: { ideal: 1440 },
        height: { ideal: 1080 }
      },
      audio: false
    };
    
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.style.display = "block";
    await video.play();
    
    if(facingMode === "user") {
      video.style.transform = "scaleX(-1)";
    } else {
      video.style.transform = "scaleX(1)";
    }

    document.getElementById("viewfinder").classList.remove("hide");
    vfIdle.style.display = "none";
    polaroid.style.display = "none";
    polaroid.classList.add("hide");
    hide(ctrlOpen); show(ctrlSnap);
    setStatus(magazineSlogans[Math.floor(Math.random() * magazineSlogans.length)]);
  } catch (e) {
    console.error(e);
    setStatus("Errore della fotocamera. Usa Safari o Chrome!");
  }
}

// ── TAKE PHOTO PROCESS ────────────────────────────────────────
async function takePhoto() {
  canvas.width  = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  
  if (facingMode === "user") { 
    ctx.translate(canvas.width, 0); 
    ctx.scale(-1, 1); 
  }
  
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const videoAspect = videoWidth / videoHeight;
  const canvasAspect = canvas.width / canvas.height;
  
  let sx, sy, sWidth, sHeight;
  if (videoAspect > canvasAspect) {
    sHeight = videoHeight;
    sWidth = videoHeight * canvasAspect;
    sx = (videoWidth - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = videoWidth;
    sHeight = videoWidth / canvasAspect;
    sx = 0;
    sy = (videoHeight - sHeight) / 2;
  }

  ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
  
  if (facingMode === "user") { 
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
  }
  
  let photoData = canvas.toDataURL("image/jpeg", 0.85);
  
  photoData = await addEditorialBranding(photoData);
  lastPhoto = photoData;
  
  flash.classList.add("go");
  setTimeout(() => flash.classList.remove("go"), 250);
  
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 950;
    gainNode.gain.value = 0.08;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.25);
    oscillator.stop(audioCtx.currentTime + 0.25);
  } catch(e) {}
  
  preview.src = lastPhoto;
  polaroid.classList.remove("hide");
  polaroid.style.display = "block";
  video.style.display = "none";
  hide(ctrlSnap); show(ctrlPreview);
  setStatus("MERAVIGLIOSA! SALVA O RIFACCI 💋");
}

async function savePhoto() {
  if (!lastPhoto) return;
  $("btn-save").disabled = true;
  setStatus("SALVATAGGIO... 💾");
  try {
    await push(ref(db, "photos"), { data: lastPhoto, ts: Date.now() });
    lastPhoto = null; preview.src = "";
    polaroid.style.display = "none";
    video.style.display = "block";
    hide(ctrlPreview); show(ctrlSnap);
    
    explodeConfetti();
    setStatus("COPERTINA PUBBLICATA! SEI UNA SUPERSTAR 🌟");
    
    $("gallery").scrollIntoView({ behavior: "smooth" });
  } catch(e) {
    console.error(e);
    setStatus("Errore durante il salvataggio.");
  }
  $("btn-save").disabled = false;
}

function retakePhoto() {
  lastPhoto = null; preview.src = "";
  polaroid.style.display = "none";
  video.style.display = "block";
  hide(ctrlPreview); show(ctrlSnap);
  setStatus("METTITI IN POSA! ⚡");
}

// ── LIGHTBOX OPERATIONS ───────────────────────────────────────
$("lb-close").onclick = () => { lightbox.classList.remove("on"); lbImg.src=""; document.body.style.overflow=""; };
lightbox.onclick = e => { if(e.target===lightbox){ lightbox.classList.remove("on"); lbImg.src=""; document.body.style.overflow=""; } };

// ── EVENTS BINDING ────────────────────────────────────────────
$("btn-open").onclick  = openCamera;
$("btn-snap").onclick  = takePhoto;
$("btn-flip").onclick  = () => { 
  facingMode = facingMode === "user" ? "environment" : "user"; 
  openCamera(); 
};
$("btn-save").onclick  = savePhoto;
$("btn-retake").onclick = retakePhoto;
