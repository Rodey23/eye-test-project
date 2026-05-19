/* Online Eye Test — Screening Check (Privacy-first, local-only)
   - US1: screening-not-diagnosis (consent + results)
   - US2: guided setup + eye covering + position
   - US3: practice round
   - US4: per-eye testing
   - US5: results + next steps + urgent guidance
   - US6: export summary (print/PDF)
   - US7: accessibility: large text, high contrast, audio, controls, reduced motion
   - US8: no identifiers; local storage only
   - US9: admin content versioning is in admin.html (local JSON)
*/

const VIEWS = ["home","consent","access","setup","correction","calibration","position","practice","eyeOrder","test","help","results","export","how"];

const DEFAULT_PACK = {
  version: "optotypes-v1",
  letters: ["E","F","P","T","O","Z","L","D","C","N","H","K","R","S","V","U","Y","A"]
};

const DEFAULT_SAFETY = {
  version: "safety-v1",
  urgent: ["Sudden flashes of light or new floaters","A curtain/shadow across vision","Severe eye pain or headache","Sudden loss of vision","Eye injury or chemical exposure"]
};

const TAP_CHOICES = ["E","F","P","T","O","Z","L","D","C","N","H","K"];

const LEVELS = [
  { label: "20/60", sizePx: 185 },
  { label: "20/50", sizePx: 165 },
  { label: "20/40", sizePx: 145 },
  { label: "20/30", sizePx: 125 },
  { label: "20/25", sizePx: 110 },
  { label: "20/20", sizePx: 95  },
];

const state = {
  lang: "en",
  consent: { c1:false, c2:false, c3:false, timestamp:null },
  accessibility: { textSize:"standard", contrast:"standard", audioRead:false, audioSafety:false, answerMethod:"type", reducedMotion:false },
  setup: { lightingStable:false, noGlare:false, brightnessOk:false, steadySeating:false },
  correction: "none",
  calibration: { skipped:false, scale:1.0 },
  position: { atDistance:false, lettersReadable:false, wontMoveCloser:false },

  pack: DEFAULT_PACK,
  safety: DEFAULT_SAFETY,

  flow: { view:"home", eyeOrder:"right_first", currentEye:null },
  test: {
    itemsPerEye: 12,
    currentItem: 0,
    currentLevel: 2,
    streak: 0,
    eyeData: {
      left:  { responses:[], bestLevel: 0 },
      right: { responses:[], bestLevel: 0 },
    }
  }
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ---------------- i18n ---------------- */
const I18N = {
  en: {
    "top.help":"Help",
    "ui.back":"Back",
    "ui.continue":"Continue",
    "ui.submit":"Submit",
    "ui.cantSee":"I can’t see clearly",
    "ui.pauseHelp":"Pause & help",
    "ui.exit":"Exit",
    "ui.home":"Home",

    "home.title":"Check your distance vision at home",
    "home.subtitle":"A short screening check to notice possible changes. It does not diagnose eye disease.",
    "home.urgentTitle":"Urgent symptoms:",
    "home.urgentText":"If you have flashes/floaters, a curtain shadow, severe pain, sudden loss of vision, or injury — seek urgent care.",
    "home.badgePrivacy":"No account • No name",
    "home.badgeDevice":"Works best on laptop/tablet",
    "home.badgeExport":"Printable summary for clinician",
    "home.start":"Start the check",
    "home.how":"How it works",
    "home.privacyTitle":"Privacy-first:",
    "home.privacyText":"Results stay on your device unless you choose to export.",
    "home.safetyTitle":"Urgent symptoms:",
    "home.safetyText":"If you have flashes/floaters, a curtain shadow, severe pain, sudden loss of vision, or injury — seek urgent care.",
    "home.quickTitle":"Quick setup checklist",
    "home.quick1":"Stable lighting, low glare",
    "home.quick2":"Keep a steady distance",
    "home.quick3":"Cover one eye gently (don’t press)",
    "home.quick4":"Takes ~3–5 minutes",
    "home.accessibility":"Accessibility options",

    "consent.title":"Before you start",
    "consent.subtitle":"This is a screening check — it cannot diagnose conditions. Home setup affects accuracy.",
    "consent.redTitle":"Stop and seek urgent advice if you have red-flag symptoms",
    "consent.r1":"Sudden flashes of light or new floaters",
    "consent.r2":"A curtain/shadow across vision",
    "consent.r3":"Severe eye pain or headache",
    "consent.r4":"Sudden loss of vision",
    "consent.r5":"Eye injury or chemical exposure",
    "consent.redflagsTitle":"Stop and seek urgent advice if you have:",
    "consent.rf1":"Sudden flashes of light or new floaters",
    "consent.rf2":"A curtain/shadow across vision",
    "consent.rf3":"Severe eye pain or headache",
    "consent.rf4":"Sudden loss of vision",
    "consent.rf5":"Eye injury or chemical exposure",
    "consent.confirm":"Confirm to continue",
    "consent.c1":"I understand this is a screening check, not a diagnosis",
    "consent.c2":"I understand my home setup affects reliability",
    "consent.c3":"I understand urgent symptoms need urgent care regardless of results",

    "access.title":"Accessibility",
    "access.subtitle":"Choose what makes the check easier and safer for you.",
    "access.textSize":"Text size",
    "access.contrast":"Contrast",
    "access.high":"High contrast",
    "access.answer":"Answer method",
    "access.audioRead":"Read instructions aloud",
    "access.audioSafety":"Repeat safety reminders on help screen",
    "access.standard":"Standard",
    "access.large":"Large",
    "access.highContrast":"High contrast",
    "access.audio":"Audio guidance",
    "access.readAloud":"Read guidance aloud",
    "access.repeatSafety":"Repeat safety reminder in Help",
    "access.controls":"Controls",
    "access.type":"Type the letter",
    "access.tap":"Tap large buttons",
    "access.reducedMotion":"Reduce motion/animations",
    "access.keys":"Keyboard: Enter = submit, Esc/H = help, R = restart eye.",

    "setup.title":"Get comfortable (1 minute)",
    "setup.subtitle":"This makes your result more reliable.",
    "setup.l1":"Indoor lighting is stable",
    "setup.l2":"No glare/reflections on screen",
    "setup.l3":"Brightness feels comfortable",
    "setup.l4":"Sitting position is steady",
    "setup.tipTitle":"Tip:",
    "setup.tipText":"If you struggle, don’t lean closer — reduce glare or improve lighting instead.",

    "correction.title":"Glasses or contacts?",
    "correction.subtitle":"Your result depends on whether you’re wearing your distance correction.",
    "correction.o1":"Wearing distance glasses now",
    "correction.o2":"Have glasses but not wearing today",
    "correction.o3":"No glasses or contact lenses",
    "correction.o4":"Not sure",
    "cover.title":"Cover one eye safely",
    "cover.l1":"Use your palm or a clean card/tissue",
    "cover.l2":"Do not press on your eyelid",
    "cover.l3":"Keep both eyes open behind the cover",
    "cover.l4":"Make sure the uncovered eye feels clear",

    "cal.title":"Calibration (recommended)",
    "cal.subtitle":"Match the box to a bank card/ID held against your screen.",
    "cal.box":"Match this box to your card",
    "cal.dec":"− Smaller",
    "cal.inc":"+ Larger",
    "cal.reset":"Reset",
    "cal.skip":"Skip calibration (confidence will be lower)",

    "pos.title":"Confirm your position",
    "pos.subtitle":"Try to keep the same distance the whole time.",
    "pos.c1":"I am at the measured distance now",
    "pos.c2":"Lighting is stable and readable",
    "pos.c3":"I will not move closer during the check",
    "pos.remTitle":"Reminder:",
    "pos.remText":"Moving closer can make the result look better than it really is.",

    "prac.title":"Quick practice",
    "prac.subtitle":"One sample item, so you know what to do.",
    "prac.placeholder":"Type the letter",

    "eye.title":"Which eye first?",
    "eye.subtitle":"You will test each eye separately.",
    "eye.r":"Right eye first",
    "eye.rhint":"cover left eye",
    "eye.l":"Left eye first",
    "eye.lhint":"cover right eye",
    "eye.tip":"Tip: cover gently and keep both eyes open.",
    "eye.start":"Start",

    "test.placeholder":"Type the letter",

    "help.title":"Help (quick fixes)",
    "help.common":"Common issues",
    "help.i1":"Moving closer to the screen",
    "help.i2":"Glare/reflections",
    "help.i3":"Wrong eye covered",
    "help.i4":"Low lighting",
    "help.actions":"Try this",
    "help.b1":"Recheck distance",
    "help.b2":"Reduce glare",
    "help.b3":"Eye covering steps",
    "help.urgentTitle":"Urgent reminder:",
    "help.urgentText":"If you have flashes/floaters, a curtain shadow, severe pain, sudden loss of vision, or injury — seek urgent care.",
    "help.resume":"Resume",
    "help.restart":"Restart this eye",

    "res.title":"Your results",
    "res.left":"Left eye",
    "res.right":"Right eye",
    "res.conf":"Confidence",
    "res.meaningTitle":"What this means",
    "res.meaningText":"This is a screening check, not a diagnosis. Results can vary with distance, glare and lighting.",
    "res.nextTitle":"Next steps",
    "res.n1":"Reduced vision: book an optometrist appointment.",
    "res.n2":"Urgent symptoms: seek urgent advice regardless of these results.",
    "res.n3":"Routine care: consider a full eye exam every 1–2 years.",
    "res.export":"Save / print summary",
    "res.retake":"Retake",

    "exp.title":"Export summary",
    "exp.subtitle":"Designed to be easy to share with an optometrist.",
    "exp.i1":"Date/time of test",
    "exp.i2":"Device type",
    "exp.i3":"Glasses/contacts context",
    "exp.i4":"Calibration status",
    "exp.i5":"Per-eye scores",
    "exp.i6":"Confidence flags",
    "exp.i7":"Limitations + next steps",
    "exp.privacyTitle":"Privacy:",
    "exp.privacyText":"No personal details are included unless you add notes yourself.",
    "exp.pdf":"Download / Save as PDF",
    "exp.print":"Print",

    "how.title":"How it works",
    "how.s1t":"Safety + consent",
    "how.s1d":"You confirm limits and red-flag guidance.",
    "how.s2t":"Accessibility",
    "how.s2d":"Text size, contrast, audio, controls.",
    "how.s3t":"Guided setup",
    "how.s3d":"Lighting, glare, steady seating.",
    "how.s4t":"Calibration",
    "how.s4d":"Optional sizing to improve confidence.",
    "how.s5t":"Practice",
    "how.s5d":"One sample item before scoring.",
    "how.s6t":"Per-eye test",
    "how.s6d":"Each eye is tested separately.",
    "how.s7t":"Results + export",
    "how.s7d":"Clear next steps and printable summary."
  },

  // Lightweight ES/FR (enough to show feature; you can extend later)
  es: { "top.help":"Ayuda", "ui.back":"Atrás", "ui.continue":"Continuar", "ui.submit":"Enviar", "ui.cantSee":"No veo con claridad", "ui.pauseHelp":"Pausa y ayuda", "ui.exit":"Salir", "ui.home":"Inicio",
        "home.title":"Comprueba tu visión a distancia en casa", "home.subtitle":"Una comprobación de cribado breve. No diagnostica enfermedades.", "home.start":"Empezar", "home.how":"Cómo funciona",
        "consent.title":"Antes de empezar", "consent.subtitle":"Esto es una comprobación de cribado, no un diagnóstico.", "access.title":"Accesibilidad", "setup.title":"Preparación (1 minuto)",
        "res.title":"Tus resultados", "exp.title":"Exportar resumen", "how.title":"Cómo funciona" },
  fr: { "top.help":"Aide", "ui.back":"Retour", "ui.continue":"Continuer", "ui.submit":"Valider", "ui.cantSee":"Je ne vois pas clairement", "ui.pauseHelp":"Pause & aide", "ui.exit":"Quitter", "ui.home":"Accueil",
        "home.title":"Vérifiez votre vision de loin à domicile", "home.subtitle":"Un dépistage court. Ce n’est pas un diagnostic.", "home.start":"Commencer", "home.how":"Comment ça marche",
        "consent.title":"Avant de commencer", "consent.subtitle":"Ceci est un dépistage, pas un diagnostic.", "access.title":"Accessibilité", "setup.title":"Préparation (1 minute)",
        "res.title":"Vos résultats", "exp.title":"Exporter le résumé", "how.title":"Comment ça marche" }
};

function t(key, fallbackText){
  const langTable = I18N[state.lang] || {};
  const enTable = I18N.en || {};
  const hit = langTable[key] ?? enTable[key];
  // If the translation key is missing, keep the existing text from HTML as a safe fallback.
  return (hit !== undefined && hit !== null && String(hit).trim() !== "") ? hit : (fallbackText ?? key);
}
function applyI18n(){
  $$("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n, el.textContent));
  $$("[data-i18n-ph]").forEach(el => el.placeholder = t(el.dataset.i18nPh, el.placeholder));
}

/* ---------------- storage ---------------- */
function save(){
  sessionStorage.setItem("oet_v2", JSON.stringify(state));
}
function load(){
  const raw = sessionStorage.getItem("oet_v2");
  if(!raw) return;
  try{
    const parsed = JSON.parse(raw);
    deepAssign(state, parsed);
  }catch{}
}
function deepAssign(target, src){
  for(const k of Object.keys(src)){
    if(src[k] && typeof src[k]==="object" && !Array.isArray(src[k])){
      if(!target[k]) target[k] = {};
      deepAssign(target[k], src[k]);
    } else {
      target[k] = src[k];
    }
  }
}

/* ---------------- ui helpers ---------------- */
function toast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(()=> el.classList.add("hidden"), 2200);
}
function speak(text){
  if(!state.accessibility.audioRead) return;
  if(!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
function deviceLabel(){
  const ua = navigator.userAgent;
  if(/tablet/i.test(ua)) return "Tablet browser";
  if(/mobile/i.test(ua)) return "Mobile browser";
  return "Desktop/Laptop browser";
}

function show(view){
  // keep track so Help can return you to where you were
  if(view !== "help") state.flow.prevView = state.flow.view || "home";
  state.flow.view = view;
  VIEWS.forEach(v => {
    const el = document.querySelector(`[data-view="${v}"]`);
    if(el) el.classList.toggle("hidden", v !== view);
  });

  // progress only in test
  $("#progressWrap").classList.toggle("hidden", view !== "test");

  save();
  applyI18n();
}

function applyAccessibility(){
  document.body.classList.toggle("text-large", state.accessibility.textSize === "large");
  document.body.classList.toggle("high-contrast", state.accessibility.contrast === "high");
  document.body.classList.toggle("reduce-motion", state.accessibility.reducedMotion);

  const tap = state.accessibility.answerMethod === "tap";
  $("#practiceTypeRow").classList.toggle("hidden", tap);
  $("#practiceTapRow").classList.toggle("hidden", !tap);
  $("#testTypeRow").classList.toggle("hidden", tap);
  $("#testTapRow").classList.toggle("hidden", !tap);

  buildTapGrids();
}

/* ---------------- content pack loading (Admin US9) ---------------- */
function loadAdminContentIfAny(){
  const pack = localStorage.getItem("oet_pack");
  const safety = localStorage.getItem("oet_safety");
  try{
    if(pack) state.pack = JSON.parse(pack);
    if(safety) state.safety = JSON.parse(safety);
  }catch{}
}

/* ---------------- practice ---------------- */
function submitPractice(answer){
  const expected = $("#practiceLetter").textContent.trim().toUpperCase();
  const got = (answer || "").trim().toUpperCase();
  const fb = $("#practiceFeedback");
  fb.classList.remove("hidden");

  if(got === expected){
    fb.textContent = "Nice — that’s correct. Keep your distance steady for the real check.";
    $("#pracContinue").disabled = false;
    speak("Correct. Keep your distance steady for the real check.");
  } else {
    fb.textContent = `Not quite. The correct answer was "${expected}". Try again.`;
    speak("Not quite. Try again.");
  }
}

/* ---------------- testing engine ---------------- */
function resetEye(eye){
  state.test.currentItem = 0;
  state.test.currentLevel = 2;
  state.test.streak = 0;
  state.test.eyeData[eye].responses = [];
  state.test.eyeData[eye].bestLevel = 0;
}

function beginEye(eye){
  state.flow.currentEye = eye;
  state.test.currentItem = 0;
  state.test.currentLevel = 2;
  state.test.streak = 0;
  $("#nextAfterEye").disabled = true;

  const title = eye === "left" ? "Left eye" : "Right eye";
  $("#testTitle").textContent = title;
  $("#testHint").textContent = (eye === "left") ? "Cover your right eye." : "Cover your left eye.";
  speak(`${title}. ${$("#testHint").textContent}`);

  nextItem();
  updateProgress();
}

function currentLetter(){
  const letters = state.pack?.letters?.length ? state.pack.letters : DEFAULT_PACK.letters;
  const prev = state.test.eyeData[state.flow.currentEye]?.responses?.slice(-1)?.[0]?.letter;
  let ch = letters[Math.floor(Math.random()*letters.length)];
  if(prev && ch === prev){
    ch = letters[(letters.indexOf(ch)+3) % letters.length];
  }
  return ch;
}

function applyOptotypeSize(){
  const lvl = LEVELS[state.test.currentLevel];
  const base = lvl.sizePx;
  const scale = state.calibration.skipped ? 1.0 : state.calibration.scale;
  $("#testLetter").style.fontSize = `${Math.round(base * scale)}px`;
  $("#practiceLetter").style.fontSize = `${Math.round(150 * scale)}px`;
}

function nextItem(){
  applyOptotypeSize();
  $("#testLetter").textContent = currentLetter();
  $("#testInput").value = "";
  $("#testInput").focus();
  $("#itemsLeft").textContent = `${state.test.itemsPerEye - state.test.currentItem} of ${state.test.itemsPerEye} items`;
}

function recordResponse({letter, answer, correct, reason=null}){
  const eye = state.flow.currentEye;
  const lvl = state.test.currentLevel;
  state.test.eyeData[eye].responses.push({
    letter, answer, correct, level: lvl, reason,
    ts: new Date().toISOString()
  });
  if(correct){
    state.test.eyeData[eye].bestLevel = Math.max(state.test.eyeData[eye].bestLevel, lvl);
  }
}

function staircaseAdjust(correct){
  if(correct){
    state.test.streak++;
    if(state.test.streak >= 2){
      state.test.currentLevel = Math.min(LEVELS.length-1, state.test.currentLevel + 1);
      state.test.streak = 0;
    }
  } else {
    state.test.currentLevel = Math.max(0, state.test.currentLevel - 1);
    state.test.streak = 0;
  }
}

function submitTest(answer){
  const letter = $("#testLetter").textContent.trim().toUpperCase();
  const got = (answer || "").trim().toUpperCase();
  const correct = got === letter;

  recordResponse({ letter, answer: got, correct });
  staircaseAdjust(correct);
  state.test.currentItem++;

  updateProgress();

  if(state.test.currentItem >= state.test.itemsPerEye){
    finishEye();
    return;
  }
  nextItem();
}

function finishEye(){
  $("#nextAfterEye").disabled = false;
  toast("Eye completed. You can continue.");
  speak("Eye completed. Press continue.");
  $("#itemsLeft").textContent = `0 of ${state.test.itemsPerEye} items`;
}

function updateProgress(){
  const n = state.test.currentItem;
  const total = state.test.itemsPerEye;
  $("#progressText").textContent = `${n}/${total}`;
  $("#progressEyeLabel").textContent = state.flow.currentEye ? (state.flow.currentEye === "left" ? "Left eye" : "Right eye") : "";
  const pct = Math.round((n/total) * 100);
  $("#progressBar").style.width = `${pct}%`;
}

function computeScore(eye){
  const best = state.test.eyeData[eye].bestLevel || 0;
  return LEVELS[best].label;
}

function confidenceLabel(){
  const env = Object.values(state.setup).filter(Boolean).length;
  const pos = Object.values(state.position).filter(Boolean).length;
  const cal = !state.calibration.skipped ? 1 : 0;
  const consentOk = state.consent.c1 && state.consent.c2 && state.consent.c3;

  let score = 0;
  if(consentOk) score += 2;
  score += Math.min(4, env);
  score += Math.min(3, pos);
  score += cal;

  if(score >= 9) return "High";
  if(score >= 7) return "Medium";
  return "Low";
}

function summarizeChecks(obj){
  const keys = Object.keys(obj);
  const ok = keys.filter(k => obj[k]);
  return `${ok.length}/${keys.length} confirmed`;
}

function buildResults(){
  const left = computeScore("left");
  const right = computeScore("right");
  const conf = confidenceLabel();

  $("#resLeft").textContent = left;
  $("#resRight").textContent = right;
  $("#confLeft").textContent = conf;
  $("#confRight").textContent = conf;

  // print fill
  $("#pDate").textContent = new Date().toLocaleString();
  $("#pLeft").textContent = left;
  $("#pRight").textContent = right;
  $("#pConfLeft").textContent = conf;
  $("#pConfRight").textContent = conf;

  const corrMap = {
    wearing_glasses: "Wearing distance glasses now",
    have_glasses_not_wearing: "Have glasses but not wearing today",
    none: "No glasses or contact lenses",
    not_sure: "Not sure"
  };
  $("#pCorr").textContent = corrMap[state.correction] || state.correction;
  $("#pCal").textContent = state.calibration.skipped ? "Skipped (lower confidence)" : `Completed (scale=${state.calibration.scale.toFixed(2)})`;
  $("#pEnv").textContent = summarizeChecks(state.setup);
  $("#pPos").textContent = summarizeChecks(state.position);
  $("#pDev").textContent = deviceLabel();
}

/* ---------------- tap buttons ---------------- */
function buildTapGrids(){
  const make = (id, handler) => {
    const box = document.getElementById(id);
    if(!box) return;
    box.innerHTML = "";
    TAP_CHOICES.forEach((ch, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tapBtn";
      b.textContent = ch;
      b.title = `Key ${idx+1}`;
      b.addEventListener("click", ()=> handler(ch));
      box.appendChild(b);
    });
  };
  make("practiceTapGrid", (ch)=> submitPractice(ch));
  make("testTapGrid", (ch)=> submitTest(ch));
}

/* ---------------- calibration ---------------- */
const calBase = { w: 320, h: 200 };
function setCalScale(scale){
  state.calibration.scale = Math.max(0.6, Math.min(1.8, scale));
  $("#calRect").style.width = `${Math.round(calBase.w * state.calibration.scale)}px`;
  $("#calRect").style.height = `${Math.round(calBase.h * state.calibration.scale)}px`;
  save();
}

/* ---------------- event wiring ---------------- */
function wire(){
  // top
  const goHome = $("#goHome");
  if(goHome) goHome.addEventListener("click", (e)=>{ e.preventDefault(); show("home"); });
  $("#btnHelpTop").addEventListener("click", ()=> show("help"));

  // Smooth in-page navigation. If the target lives on the home panel,
  // switch back to home first so the section is visible, then scroll to it.
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener("click", (e)=>{
      const href = a.getAttribute("href") || "";
      if(!href.startsWith("#") || href === "#") return;

      const target = document.querySelector(href);
      if(!target) return;

      e.preventDefault();
      const shouldShowHome = !!target.closest('[data-view="home"]');
      const scrollToTarget = () => {
        target.scrollIntoView({behavior: state.accessibility.reducedMotion ? "auto" : "smooth", block: "start"});
        if(typeof target.focus === "function"){
          target.setAttribute('tabindex', '-1');
          target.focus({preventScroll:true});
        }
      };

      if(shouldShowHome && state.flow.view !== "home"){
        show("home");
        requestAnimationFrame(() => requestAnimationFrame(scrollToTarget));
      } else {
        scrollToTarget();
      }
    });
  });

  $("#langSelect").addEventListener("change", ()=>{
    state.lang = $("#langSelect").value;
    save();
    applyI18n();
  });

  // home
  $("#btnStart").addEventListener("click", ()=> show("consent"));
  const btnStart2 = $("#btnStart2");
  if(btnStart2) btnStart2.addEventListener("click", ()=> show("consent"));
  $("#btnHow").addEventListener("click", ()=> show("how"));
  $("#btnAccessibility").addEventListener("click", ()=> show("access"));

  // consent
  const syncConsent = () => {
    const ok = $("#c1").checked && $("#c2").checked && $("#c3").checked;
    $("#consentContinue").disabled = !ok;
  };
  ["c1","c2","c3"].forEach(id=>{
    $("#"+id).addEventListener("change", ()=>{
      state.consent.c1 = $("#c1").checked;
      state.consent.c2 = $("#c2").checked;
      state.consent.c3 = $("#c3").checked;
      if(state.consent.c1 && state.consent.c2 && state.consent.c3){
        state.consent.timestamp = new Date().toISOString();
      }
      syncConsent();
      save();
    });
  });
  $("#backHome1").addEventListener("click", ()=> show("home"));
  $("#consentContinue").addEventListener("click", ()=> show("access"));

  // access
  $("#backConsent").addEventListener("click", ()=> show("consent"));
  $("#accessContinue").addEventListener("click", ()=> show("setup"));

  $$('input[name="textSize"]').forEach(r=>r.addEventListener("change", ()=>{
    state.accessibility.textSize = document.querySelector('input[name="textSize"]:checked').value;
    applyAccessibility(); save();
  }));
  $$('input[name="contrast"]').forEach(r=>r.addEventListener("change", ()=>{
    state.accessibility.contrast = document.querySelector('input[name="contrast"]:checked').value;
    applyAccessibility(); save();
  }));
  $$('input[name="answerMethod"]').forEach(r=>r.addEventListener("change", ()=>{
    state.accessibility.answerMethod = document.querySelector('input[name="answerMethod"]:checked').value;
    applyAccessibility(); save();
  }));
  $("#audioRead").addEventListener("change", ()=>{
    state.accessibility.audioRead = $("#audioRead").checked;
    save();
    if(state.accessibility.audioRead) speak("Audio guidance enabled.");
  });
  $("#audioSafety").addEventListener("change", ()=>{
    state.accessibility.audioSafety = $("#audioSafety").checked;
    save();
  });
  $("#reducedMotion").addEventListener("change", ()=>{
    state.accessibility.reducedMotion = $("#reducedMotion").checked;
    applyAccessibility(); save();
  });

  // setup
  $("#backAccess").addEventListener("click", ()=> show("access"));
  $("#setupContinue").addEventListener("click", ()=> show("correction"));
  $$(".setupCheck").forEach(ch=>ch.addEventListener("change", ()=>{
    state.setup[ch.dataset.key] = ch.checked; save();
  }));

  // correction
  $("#backSetup").addEventListener("click", ()=> show("setup"));
  $("#correctionContinue").addEventListener("click", ()=> show("calibration"));
  $$('input[name="correction"]').forEach(r=>r.addEventListener("change", ()=>{
    state.correction = document.querySelector('input[name="correction"]:checked').value; save();
  }));

  // calibration
  $("#backCorrection").addEventListener("click", ()=> show("correction"));
  $("#calContinue").addEventListener("click", ()=> show("position"));
  $("#calDec").addEventListener("click", ()=> setCalScale(state.calibration.scale - 0.05));
  $("#calInc").addEventListener("click", ()=> setCalScale(state.calibration.scale + 0.05));
  $("#calReset").addEventListener("click", ()=> setCalScale(1.0));
  $("#skipCal").addEventListener("change", ()=>{
    state.calibration.skipped = $("#skipCal").checked; save();
  });

  // position
  $("#backCal").addEventListener("click", ()=> show("calibration"));
  $("#posContinue").addEventListener("click", ()=> show("practice"));
  $$(".posCheck").forEach(ch=>ch.addEventListener("change", ()=>{
    state.position[ch.dataset.key] = ch.checked; save();
  }));

  // practice
  $("#backPos").addEventListener("click", ()=> show("position"));
  $("#practiceSubmit").addEventListener("click", ()=> submitPractice($("#practiceInput").value));
  $("#practiceInput").addEventListener("keydown", (e)=>{ if(e.key==="Enter") submitPractice($("#practiceInput").value); });
  $("#practiceCantSee").addEventListener("click", ()=>{
    const fb = $("#practiceFeedback");
    fb.classList.remove("hidden");
    fb.textContent = "Try improving lighting, reducing glare, and staying at the correct distance.";
    speak("Try improving lighting, reducing glare, and staying at the correct distance.");
  });
  $("#pracContinue").addEventListener("click", ()=> show("eyeOrder"));

  // eye order
  $("#backPractice").addEventListener("click", ()=> show("practice"));
  $("#startTest").addEventListener("click", ()=>{
    state.flow.eyeOrder = document.querySelector('input[name="eyeOrder"]:checked').value;
    resetEye("left"); resetEye("right");

    const first = (state.flow.eyeOrder === "right_first") ? "right" : "left";
    beginEye(first);
    show("test");
  });

  // test
  $("#pauseHelp").addEventListener("click", ()=> show("help"));
  $("#exitToHome").addEventListener("click", ()=> show("home"));
  $("#testSubmit").addEventListener("click", ()=> submitTest($("#testInput").value));
  $("#testInput").addEventListener("keydown", (e)=>{ if(e.key==="Enter") submitTest($("#testInput").value); });
  $("#cantSee").addEventListener("click", ()=>{
    const letter = $("#testLetter").textContent.trim().toUpperCase();
    recordResponse({ letter, answer:"", correct:false, reason:"cannot_see" });
    staircaseAdjust(false);
    state.test.currentItem++;
    updateProgress();
    if(state.test.currentItem >= state.test.itemsPerEye){ finishEye(); return; }
    nextItem();
  });

  $("#nextAfterEye").addEventListener("click", ()=>{
    const cur = state.flow.currentEye;
    const other = (cur === "left") ? "right" : "left";

    const curDone = state.test.eyeData[cur].responses.length >= state.test.itemsPerEye;
    if(!curDone){ toast("Please finish this eye first."); return; }

    const otherDone = state.test.eyeData[other].responses.length >= state.test.itemsPerEye;
    if(!otherDone){
      beginEye(other);
      show("test");
      return;
    }

    buildResults();
    show("results");
  });

  // help
  $("#resume").addEventListener("click", ()=>{ show(state.flow.prevView || "home"); });
  $("#restartEye").addEventListener("click", ()=>{
    const eye = state.flow.currentEye;
    if(!eye){ show("eyeOrder"); return; }
    resetEye(eye);
    beginEye(eye);
    show("test");
    toast("Restarted this eye.");
  });
  $("#exitHelp").addEventListener("click", ()=>{
    const leftDone = state.test.eyeData.left.responses.length >= state.test.itemsPerEye;
    const rightDone = state.test.eyeData.right.responses.length >= state.test.itemsPerEye;
    if(leftDone && rightDone){ buildResults(); show("results"); }
    else { show(state.flow.prevView || "home"); }
  });

  $("#fixDistance").addEventListener("click", ()=> toast("Recheck distance: return to your marked position and stay there."));
  $("#fixGlare").addEventListener("click", ()=> toast("Reduce glare: tilt screen, close blinds, move light sources."));
  $("#fixCover").addEventListener("click", ()=> toast("Cover gently: do not press the eyelid; keep both eyes open."));

  // results
  $("#goExport").addEventListener("click", ()=> show("export"));
  $("#retake").addEventListener("click", ()=>{
    resetEye("left"); resetEye("right");
    state.flow.currentEye = null;
    show("position");
    toast("Retake started. Please confirm your position again.");
  });
  $("#backHome2").addEventListener("click", ()=> show("home"));

  // export
  $("#backResults").addEventListener("click", ()=> show("results"));
  $("#btnPrint").addEventListener("click", ()=>{
    $("#printArea").setAttribute("aria-hidden","false");
    window.print();
    $("#printArea").setAttribute("aria-hidden","true");
  });
  $("#btnPrintView").addEventListener("click", ()=>{
    $("#printArea").setAttribute("aria-hidden","false");
    window.print();
    $("#printArea").setAttribute("aria-hidden","true");
  });

  // how
  $("#backHome3").addEventListener("click", ()=> show("home"));
  $("#howStart").addEventListener("click", ()=> show("consent"));

  // keyboard shortcuts (extra accessibility)
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape" || e.key.toLowerCase() === "h"){
      if(state.flow.view === "test"){ show("help"); e.preventDefault(); }
    }
    if(e.key.toLowerCase() === "r"){
      if(state.flow.view === "test"){
        const eye = state.flow.currentEye;
        resetEye(eye); beginEye(eye);
        toast("Restarted this eye.");
      }
    }

    // number keys for tap method
    if(state.flow.view === "test" && state.accessibility.answerMethod === "tap"){
      const n = Number(e.key);
      if(n >= 1 && n <= TAP_CHOICES.length){
        submitTest(TAP_CHOICES[n-1]);
      }
    }
  });
}

/* ---------------- hydrate from saved state ---------------- */
function hydrate(){
  // language
  $("#langSelect").value = state.lang;

  // consent
  $("#c1").checked = state.consent.c1;
  $("#c2").checked = state.consent.c2;
  $("#c3").checked = state.consent.c3;
  $("#consentContinue").disabled = !(state.consent.c1 && state.consent.c2 && state.consent.c3);

  // accessibility
  document.querySelector(`input[name="textSize"][value="${state.accessibility.textSize}"]`).checked = true;
  document.querySelector(`input[name="contrast"][value="${state.accessibility.contrast}"]`).checked = true;
  document.querySelector(`input[name="answerMethod"][value="${state.accessibility.answerMethod}"]`).checked = true;
  $("#audioRead").checked = state.accessibility.audioRead;
  $("#audioSafety").checked = state.accessibility.audioSafety;
  $("#reducedMotion").checked = state.accessibility.reducedMotion;

  // setup / position
  $$(".setupCheck").forEach(ch => ch.checked = !!state.setup[ch.dataset.key]);
  $$(".posCheck").forEach(ch => ch.checked = !!state.position[ch.dataset.key]);

  // correction
  const corr = document.querySelector(`input[name="correction"][value="${state.correction}"]`);
  if(corr) corr.checked = true;

  // calibration
  $("#skipCal").checked = !!state.calibration.skipped;
  setCalScale(state.calibration.scale);

  applyAccessibility();
  applyI18n();

  // practice letter
  $("#practiceLetter").textContent = "E";

  show(state.flow.view || "home");
}

/* ---------------- start ---------------- */
load();
loadAdminContentIfAny();
wire();
hydrate();


// footer year
try{ const y = document.getElementById('year'); if(y) y.textContent = String(new Date().getFullYear()); }catch{}
