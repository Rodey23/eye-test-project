const $ = (s) => document.querySelector(s);

const DEFAULT_PACK = {
  version: "1.0.0",
  letters: ["E","F","P","T","O","Z","L","D"]
};

const ADMIN_SESSION_KEY = "oet_admin_authorized";
const ADMIN_PASSCODE = "OET-ADMIN-2025";

function safeJsonParse(text){
  try { return { ok: true, value: JSON.parse(text) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

function toast(msg){
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

function isAuthorized(){
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

function setAuthorized(value){
  if(value) sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  else sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function load(){
  const pack = localStorage.getItem("oet_pack");
  const safety = localStorage.getItem("oet_safety");
  const packObj = pack ? safeJsonParse(pack).value : DEFAULT_PACK;

  $("#packText").value = JSON.stringify(packObj || DEFAULT_PACK, null, 2);
  $("#safetyText").value = safety ? JSON.stringify(safeJsonParse(safety).value || {}, null, 2) : JSON.stringify({ version: "1.0.0", notes: "Optional safety text overrides" }, null, 2);
  $("#packVersion").textContent = (packObj && packObj.version) ? packObj.version : "—";
}

function showAdminArea(){
  $("#adminGate").classList.add("hidden");
  $("#adminShell").classList.remove("hidden");
  $("#adminShell").setAttribute("aria-hidden", "false");
  load();
}

function showGate(){
  $("#adminGate").classList.remove("hidden");
  $("#adminShell").classList.add("hidden");
  $("#adminShell").setAttribute("aria-hidden", "true");
}

function unlock(){
  const pass = $("#adminPasscode").value.trim();
  if(pass !== ADMIN_PASSCODE){
    toast("Incorrect administrator passcode.");
    $("#adminPasscode").focus();
    return;
  }
  setAuthorized(true);
  showAdminArea();
  toast("Admin access granted.");
}

$("#unlockAdmin").addEventListener("click", unlock);
$("#adminPasscode").addEventListener("keydown", (e) => {
  if(e.key === "Enter") unlock();
});

$("#logoutAdmin").addEventListener("click", () => {
  setAuthorized(false);
  $("#adminPasscode").value = "";
  showGate();
  toast("Admin area locked.");
});

$("#savePack").addEventListener("click", ()=>{
  const parsed = safeJsonParse($("#packText").value);
  if(!parsed.ok){ toast("Pack JSON error: " + parsed.error); return; }
  if(!parsed.value.letters || !Array.isArray(parsed.value.letters) || parsed.value.letters.length < 6){
    toast("Pack must include 'letters' array (6+ items).");
    return;
  }
  localStorage.setItem("oet_pack", JSON.stringify(parsed.value));
  $("#packVersion").textContent = parsed.value.version || "—";
  toast("Saved pack to localStorage.");
});

$("#resetPack").addEventListener("click", ()=>{
  localStorage.removeItem("oet_pack");
  load();
  toast("Reset to default pack.");
});

$("#saveSafety").addEventListener("click", ()=>{
  const parsed = safeJsonParse($("#safetyText").value);
  if(!parsed.ok){ toast("Safety JSON error: " + parsed.error); return; }
  localStorage.setItem("oet_safety", JSON.stringify(parsed.value));
  toast("Saved safety text to localStorage.");
});

$("#resetSafety").addEventListener("click", ()=>{
  localStorage.removeItem("oet_safety");
  load();
  toast("Cleared safety overrides.");
});

if(isAuthorized()) showAdminArea(); else showGate();
