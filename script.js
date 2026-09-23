const WEDDING_DATE = new Date("2026-12-12T09:00:00+07:00").getTime();
const guestNameEl=document.getElementById("guestName");
const wNameInput=document.getElementById("wName");
const guestPopup=document.getElementById("guestPopup");
const guestInputPopup=document.getElementById("guestInputPopup");
const guestSubmit=document.getElementById("guestSubmit");
const guestPopupError=document.getElementById("guestPopupError");
// Bersihkan sisa localStorage lama biar tidak ke-cache (fix bug refresh tetap nama lama)
try{ localStorage.removeItem("guest_name"); }catch{}
function setGuestName(name){
  const n=name.trim().slice(0,30);
  if(!n) return;
  if(guestNameEl) guestNameEl.textContent=n;
  if(wNameInput) wNameInput.value=n;
}
function getParamName(){
  try{
    const p=new URLSearchParams(location.search);
    const to=p.get("to")||p.get("guest");
    if(to) return decodeURIComponent(to).replace(/\+/g," ").trim().slice(0,30);
  }catch{}
  return "";
}
function showGuestPopup(){ if(guestPopup) guestPopup.classList.add("open"); setTimeout(()=>guestInputPopup?.focus(), 120); }
function hideGuestPopup(){ if(guestPopup) guestPopup.classList.remove("open"); }
(function initGuest(){
  const paramName=getParamName();
  if(paramName){
    setGuestName(paramName);
    hideGuestPopup();
    return;
  }
  // Selalu minta input baru — tidak pakai localStorage (fix bug persist)
  showGuestPopup();
})();
if(guestInputPopup && guestSubmit){
  const validate=()=>{
    const v=guestInputPopup.value.trim();
    const ok=v.length>=2;
    guestSubmit.disabled=!ok;
    if(guestPopupError) guestPopupError.textContent="";
  };
  guestInputPopup.addEventListener("input", validate);
  guestInputPopup.addEventListener("keydown", e=>{
    if(e.key==="Enter" && !guestSubmit.disabled){
      e.preventDefault();
      e.stopPropagation();
      guestSubmit.click();
    }
  });
  guestSubmit.addEventListener("click", ()=>{
    const v=guestInputPopup.value.trim().slice(0,30);
    if(v.length<2){
      if(guestPopupError) guestPopupError.textContent="Mohon isi nama Anda dengan benar (minimal 2 huruf)";
      toast("Mohon lengkapi nama Anda terlebih dahulu");
      return;
    }
    setGuestName(v);
    hideGuestPopup();
    toast("Terima kasih banyak, "+v+" — kami menantikan kehadiran Anda ♡");
  });
}

// Countdown — tick animation
let prev={days:"",hours:"",minutes:"",seconds:""};
function updateCountdown(){
  const now=Date.now(); const diff=WEDDING_DATE-now;
  const els={days:document.getElementById("days"),hours:document.getElementById("hours"),minutes:document.getElementById("minutes"),seconds:document.getElementById("seconds")};
  if(!els.days) return;
  if(diff<=0){ els.days.textContent="00"; els.hours.textContent="00"; els.minutes.textContent="00"; els.seconds.textContent="00"; return; }
  const d=Math.floor(diff/86400000), h=Math.floor((diff%86400000)/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
  const cur={days:String(d).padStart(2,"0"),hours:String(h).padStart(2,"0"),minutes:String(m).padStart(2,"0"),seconds:String(s).padStart(2,"0")};
  ["days","hours","minutes","seconds"].forEach(k=>{
    if(cur[k]!==prev[k]){
      els[k].textContent=cur[k];
      const box=els[k].closest(".cd-box");
      if(box){ box.classList.remove("tick"); void box.offsetWidth; box.classList.add("tick"); setTimeout(()=>box.classList.remove("tick"),380); }
    }
  });
  prev=cur;
}
setInterval(updateCountdown,1000); updateCountdown();

// Toast helper (declare early for music)
const toastEl=document.getElementById("toast");
function toast(m){ if(!toastEl) return; toastEl.textContent=m; toastEl.classList.add("show"); clearTimeout(toastEl._t); toastEl._t=setTimeout(()=>toastEl.classList.remove("show"),2600); }

// Music — auto play on open, toggle via button
const bgMusic=document.getElementById("bgMusic");
const musicBtn=document.getElementById("musicBtn");
let musicOn=false;
function playMusic(){
  if(!bgMusic) return;
  // dummy lagu — fade-in biar tidak kaget
  bgMusic.volume=0;
  const p=bgMusic.play();
  if(p && p.catch) p.catch(()=>{ /* autoplay blocked */ });
  musicOn=true;
  if(musicBtn){ musicBtn.classList.remove("muted"); musicBtn.classList.add("playing"); musicBtn.textContent="♫"; }
  let v=0; const target=0.70; const step=0.03;
  const iv=setInterval(()=>{
    v=Math.min(v+step, target);
    try{ bgMusic.volume=v; }catch{}
    if(v>=target) clearInterval(iv);
  }, 70);
  bgMusic._fadeIv=iv;
}
function pauseMusic(){
  if(!bgMusic) return;
  try{ clearInterval(bgMusic._fadeIv); }catch{}
  bgMusic.pause();
  musicOn=false;
  if(musicBtn){ musicBtn.classList.add("muted"); musicBtn.classList.remove("playing"); musicBtn.textContent="♫"; }
}
if(musicBtn) musicBtn.addEventListener("click", ()=>{
  if(musicOn) { pauseMusic(); toast("Musik dijeda"); }
  else { playMusic(); toast("Musik diputar ♫"); }
});

// Cover open
const cover=document.getElementById("cover"), openBtn=document.getElementById("openBtn");
let opened=false;
function openInvitation(){
  if(opened) return; opened=true;
  window.scrollTo(0,0);
  cover.classList.add("hide");
  document.body.classList.remove("locked");
  // paksa hero di paling atas tanpa perlu scroll manual
  requestAnimationFrame(()=>{
    window.scrollTo({top:0, behavior:"instant"});
    document.getElementById("hero")?.scrollIntoView({behavior:"instant", block:"start"});
  });
  setTimeout(()=>{
    window.scrollTo({top:0, behavior:"instant"});
    document.getElementById("hero")?.scrollIntoView({behavior:"instant", block:"start"});
  }, 90);
  document.querySelectorAll(".hero .reveal").forEach(el=> el.classList.add("in"));
  reveals.forEach(el=> io.observe(el));
  playMusic();
  const topVideo=document.getElementById("topVideo");
  if(topVideo){ topVideo.muted=true; const pv=topVideo.play(); if(pv&&pv.catch) pv.catch(()=>{}); }
  // gallery video 16:9 — controllable play/pause
  document.querySelectorAll(".video-wrap").forEach(wrap=>{
    const v=wrap.querySelector("video");
    const btn=wrap.querySelector(".video-play");
    if(!v) return;
    wrap.classList.add(v.paused ? "paused" : "playing");
    const toggle=()=>{
      if(v.paused){ v.muted=true; v.play().catch(()=>{}); }
      else v.pause();
    };
    wrap.addEventListener("click", toggle);
    if(btn) btn.addEventListener("click", e=>{ e.stopPropagation(); toggle(); });
    v.addEventListener("play", ()=>{ wrap.classList.add("playing"); wrap.classList.remove("paused"); });
    v.addEventListener("pause", ()=>{ wrap.classList.add("paused"); wrap.classList.remove("playing"); });
  });
}
if(openBtn) openBtn.addEventListener("click", openInvitation);
if(cover) cover.addEventListener("click", e=>{ if(e.target===cover) openInvitation(); });
document.addEventListener("keydown", e=>{
  if(guestPopup && guestPopup.classList.contains("open")) return;
  if(!opened&&(e.key==="Enter"||e.key===" ")) openInvitation();
});

// Reveal observer — gallery 1 per 1 lebih lambat
const reveals=document.querySelectorAll(".reveal");
const gItems=document.querySelectorAll(".g-item");
const io=new IntersectionObserver((entries)=>{
  entries.forEach(ent=>{
    if(ent.isIntersecting){
      const el=ent.target;
      if(el.classList.contains("g-item")){
        const idx=Array.from(gItems).indexOf(el);
        const delay=idx * 220;
        setTimeout(()=>{ el.classList.add("in"); io.unobserve(el); }, delay);
      } else {
        el.classList.add("in"); io.unobserve(el);
      }
    }
  });
},{threshold:0.06, rootMargin:"0px 0px -30px 0px"});
if(!cover || cover.classList.contains("hide")){
  reveals.forEach(el=> io.observe(el));
}

// Parallax
const floralHeader=document.querySelector(".floral-header");
let ticking=false;
window.addEventListener("scroll",()=>{
  if(ticking) return; ticking=true;
  requestAnimationFrame(()=>{
    const y=window.scrollY;
    if(floralHeader) floralHeader.style.transform=`translateY(${y*0.12}px)`;
    ticking=false;
  });
},{passive:true});

// Smooth scroll for hero-scroll hint
document.querySelector(".hero-scroll")?.addEventListener("click",()=>{
  document.querySelector(".countdown-band")?.scrollIntoView({behavior:"smooth", block:"start"});
});

// Copy gift — Salin Rekening / Alamat
document.querySelectorAll(".btn-copy").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const targetId=btn.getAttribute("data-copy");
    const directText=btn.getAttribute("data-copy-text");
    let text="";
    if(directText) text=directText;
    else if(targetId){
      const el=document.getElementById(targetId);
      if(el) text=el.textContent.trim();
    } else {
      text=btn.parentElement?.querySelector(".bank-no, .gift-value")?.textContent?.trim() || "";
    }
    if(!text) { toast("Tidak ada yang disalin"); return; }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=>{
        toast("Tersalin: " + text.slice(0,18));
        const orig=btn.textContent; btn.textContent="Tersalin ✓";
        setTimeout(()=>btn.textContent=orig,1600);
      }).catch(()=> fallbackCopy(text, btn));
    } else {
      fallbackCopy(text, btn);
    }
  });
});
function fallbackCopy(text, btn){
  const ta=document.createElement("textarea");
  ta.value=text; ta.style.position="fixed"; ta.style.opacity="0";
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand("copy"); toast("Tersalin: " + text.slice(0,18)); if(btn){ const o=btn.textContent; btn.textContent="Tersalin ✓"; setTimeout(()=>btn.textContent=o,1600);} }catch{ toast("Gagal menyalin"); }
  ta.remove();
}

// Wishes — tanpa backend (localStorage)
const WISH_KEY="wishes_Lisa_Eka";
const wishesForm=document.getElementById("wishes-form"), wishesList=document.getElementById("wishes-list"), wishesEmpty=document.getElementById("wishes-empty"), wName=document.getElementById("wName"), wMessage=document.getElementById("wMessage"), wishesStatus=document.getElementById("wishes-status");
function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function formatTime(ts){
  try{ return new Date(ts).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}); }catch{ return ""; }
}
function renderWishes(items){
  if(!wishesList) return;
  wishesList.innerHTML="";
  if(!items.length){ if(wishesEmpty) wishesEmpty.classList.remove("hidden"); return; }
  if(wishesEmpty) wishesEmpty.classList.add("hidden");
  items.forEach(it=>{
    const li=document.createElement("li");
    li.className="w-item";
    li.innerHTML=`<div class="w-item-head"><span class="w-item-name">${escapeHtml(it.name)}</span><span class="w-item-time">${formatTime(it.time)}</span></div><p class="w-item-msg">${escapeHtml(it.message)}</p>`;
    wishesList.appendChild(li);
  });
}
function loadWishes(){
  try{
    const raw=localStorage.getItem(WISH_KEY);
    if(raw){ const arr=JSON.parse(raw); if(Array.isArray(arr)) return arr; }
  }catch{}
  return [
    {name:"Ayu & Keluarga", message:"Selamat Lisa & Eka! Samawa sampai akhir hayat ♡", time: Date.now()-86400000*2},
    {name:"Riko", message:"Bahagia selalu! Semoga acaranya lancar & penuh cinta.", time: Date.now()-86400000}
  ];
}
let wishesData=loadWishes();
renderWishes(wishesData);
if(wishesForm) wishesForm.addEventListener("submit", e=>{
  e.preventDefault();
  const name=(wName?.value||"").trim().slice(0,30);
  const msg=(wMessage?.value||"").trim().slice(0,200);
  if(!name){ toast("Isi nama dulu ya"); if(wishesStatus){ wishesStatus.textContent="Mohon isi nama"; wishesStatus.style.color="#7a1e2e"; } return; }
  if(!msg){ toast("Tulis ucapannya dulu"); if(wishesStatus){ wishesStatus.textContent="Mohon isi ucapan"; wishesStatus.style.color="#7a1e2e"; } return; }
  const entry={name, message:msg, time: Date.now()};
  wishesData.unshift(entry);
  if(wishesData.length>50) wishesData=wishesData.slice(0,50);
  try{ localStorage.setItem(WISH_KEY, JSON.stringify(wishesData)); }catch{}
  renderWishes(wishesData);
  wishesForm.reset();
  if(wishesStatus){ wishesStatus.textContent=`Matur nuwun ${name}! Ucapanmu sudah tampil ♡`; wishesStatus.style.color="#5b1b1b"; wishesStatus.animate([{transform:"scale(0.96)"},{transform:"scale(1)"}],{duration:300,easing:"cubic-bezier(.34,1.56,.64,1)"}); }
  toast(`Matur nuwun ${name}!`);
  wishesList?.scrollTo({top:0, behavior:"smooth"});
});

// Photo highlight slideshow — auto ganti tiap 3 detik (3 foto)
(function(){
  const slides=document.querySelectorAll(".arch-inner.slideshow .slide");
  const dots=document.querySelectorAll(".slide-dots .dot");
  if(!slides.length) return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let idx=0;
  setInterval(()=>{
    slides[idx].classList.remove("active");
    if(dots[idx]) dots[idx].classList.remove("active");
    idx=(idx+1)%slides.length;
    slides[idx].classList.add("active");
    if(dots[idx]) dots[idx].classList.add("active");
  }, 3000);
})();

// Lightbox
const lb=document.getElementById("lightbox"), lbImg=document.getElementById("lbImg"), lbClose=document.getElementById("lbClose");
document.querySelectorAll(".g-item img").forEach(img=> img.addEventListener("click", ()=>{
  if(!lb||!lbImg) return; lbImg.src=img.src.replace("w=800","w=1200"); lb.classList.add("open"); document.body.style.overflow="hidden";
}));
function closeLb(){ if(lb) lb.classList.remove("open"); document.body.style.overflow=""; }
if(lbClose) lbClose.addEventListener("click", closeLb);
if(lb) lb.addEventListener("click", e=>{ if(e.target===lb) closeLb(); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeLb(); });
