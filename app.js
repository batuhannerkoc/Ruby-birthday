// ─────────────────────────────────────────────────────────────
//  Roberta Birthday Gallery — app.js
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ── 🔧 FIREBASE CONFIG — sostituisci con i tuoi valori ────────
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
let facingMode = "user"; // selfie di default su mobile
let lastPhoto  = null;

const show = el => el.classList.remove("hide");
const hide = el => el.classList.add("hide");
const setStatus = msg => statusEl.textContent = msg;

// ── Gallery ───────────────────────────────────────────────────
onValue(ref(db, "photos"), snap => {
  const data = snap.val();
  if (!data) {
    galleryGrid.innerHTML = `<p class="gallery-empty">Nessuna foto ancora — sii il primo ✦</p>`;
    galleryCount.textContent = "";
    return;
  }
  const photos = Object.values(data).sort((a,b) => b.ts - a.ts);
  galleryCount.textContent = photos.length + (photos.length === 1 ? " ricordo" : " ricordi");
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

// ── Camera ────────────────────────────────────────────────────
async function openCamera() {
  setStatus("Apertura fotocamera…");
  try {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1440 } },
      audio: false
    });
    video.srcObject = stream;
    video.style.display = "block";
    await video.play();
    document.getElementById("viewfinder").classList.remove("hide");
    vfIdle.style.display = "none";
    polaroid.style.display = "none";
    polaroid.classList.add("hide");
    hide(ctrlOpen); show(ctrlSnap);
    setStatus("Sorridi! 😊");
  } catch (e) {
    setStatus(e.name === "NotAllowedError"
      ? "Consenti l'accesso alla fotocamera nelle impostazioni."
      : "Impossibile aprire la fotocamera. Prova con Safari o Chrome.");
  }
}

function takePhoto() {
  canvas.width  = video.videoWidth  || 1080;
  canvas.height = video.videoHeight || 1440;
  const ctx = canvas.getContext("2d");
  if (facingMode === "user") { ctx.translate(canvas.width,0); ctx.scale(-1,1); }
  ctx.drawImage(video, 0, 0);
  lastPhoto = canvas.toDataURL("image/jpeg", 0.85);
  flash.classList.add("go");
  setTimeout(() => flash.classList.remove("go"), 150);
  preview.src = lastPhoto;
  polaroid.classList.remove("hide");
  polaroid.style.display = "flex";
  video.style.display = "none";
  hide(ctrlSnap); show(ctrlPreview);
  setStatus("Ti piace? Salvala o rifalla! 🌹");
}

async function savePhoto() {
  if (!lastPhoto) return;
  $("btn-save").disabled = true;
  setStatus("Salvataggio…");
  try {
    await push(ref(db, "photos"), { data: lastPhoto, ts: Date.now() });
    lastPhoto = null; preview.src = "";
    polaroid.style.display = "none";
    video.style.display = "block";
    hide(ctrlPreview); show(ctrlSnap);
    setStatus("Aggiunta alla galleria! 🎉");
    $("gallery").scrollIntoView({ behavior: "smooth" });
  } catch(e) {
    setStatus("Errore nel salvataggio. Controlla la configurazione Firebase.");
  }
  $("btn-save").disabled = false;
}

function retakePhoto() {
  lastPhoto = null; preview.src = "";
  polaroid.style.display = "none";
  video.style.display = "block";
  hide(ctrlPreview); show(ctrlSnap);
  setStatus("Sorridi! 😊");
}

// ── Lightbox ──────────────────────────────────────────────────
$("lb-close").onclick = () => { lightbox.classList.remove("on"); lbImg.src=""; document.body.style.overflow=""; };
lightbox.onclick = e => { if(e.target===lightbox){ lightbox.classList.remove("on"); lbImg.src=""; document.body.style.overflow=""; } };

// ── Events ────────────────────────────────────────────────────
$("btn-open").onclick  = openCamera;
$("btn-snap").onclick  = takePhoto;
$("btn-flip").onclick  = () => { facingMode = facingMode==="user"?"environment":"user"; openCamera(); };
$("btn-save").onclick  = savePhoto;
$("btn-retake").onclick= retakePhoto;
