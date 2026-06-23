const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");
const title = document.querySelector("#page-title");
const toast = document.querySelector("#toast");
const modal = document.querySelector("#scan-modal");
const titles = { tower: "灯塔", echoes: "回声", memory: "记忆" };

const models = {
  "LH-001": { name: "晨雾灯塔", tone: "微光", memory: "雾里第一束光不是为了照远方，而是为了确认你还在路上。" },
  "LH-002": { name: "夜航灯塔", tone: "蓝光", memory: "夜航的人不会一直看见岸，但灯塔会替他守住方向。" },
  "LH-003": { name: "归潮灯塔", tone: "潮光", memory: "潮水退去时，礁石会留下曾经抵达过的声音。" }
};

let selectedModel = "LH-001";
let state = JSON.parse(localStorage.getItem("panjiNfcLighthouseState") || "{}");
state = { bound: false, modelId: null, tagId: null, boundAt: null, wakeLogs: [], mockDayOffset: 0, ...state };

function save() { localStorage.setItem("panjiNfcLighthouseState", JSON.stringify(state)); }
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}
function goTo(page) {
  pages.forEach((item) => item.classList.toggle("active", item.dataset.page === page));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.target === page));
  title.textContent = titles[page];
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function todayKey(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() + (state.mockDayOffset || 0));
  return d.toISOString().slice(0, 10);
}
function nightIndex() {
  if (!state.boundAt) return 0;
  const start = new Date(state.boundAt);
  const now = new Date();
  now.setDate(now.getDate() + (state.mockDayOffset || 0));
  const diff = Math.floor((new Date(now.toDateString()) - new Date(start.toDateString())) / 86400000);
  return Math.max(1, Math.min(3, diff + 1));
}
function todayWakeCount() {
  const key = todayKey();
  return state.wakeLogs.filter((log) => log.dayKey === key).length;
}
function parseModelFromPayload(payload) {
  const text = String(payload || "").toUpperCase();
  if (text.includes("LH-002") || text.includes("LIGHTHOUSE-02")) return "LH-002";
  if (text.includes("LH-003") || text.includes("LIGHTHOUSE-03")) return "LH-003";
  if (text.includes("LH-001") || text.includes("LIGHTHOUSE-01")) return "LH-001";
  return selectedModel;
}
function getAura() {
  const n = nightIndex();
  const wakes = state.wakeLogs.length;
  if (!state.bound) return { title: "未醒", short: "未醒", copy: "它还没有听见你的第一次靠近。" };
  if (n >= 3 && wakes >= 3) return { title: "灯火已定", short: "已认主", copy: "第三夜已经过去，灯塔不再只是被扫描的 tag，它开始保留你的回声。" };
  if (n >= 2 || wakes >= 2) return { title: "复燃", short: "复燃", copy: "第二道回声进入塔身，光线开始稳定。" };
  return { title: "初醒", short: "初醒", copy: "第一次触碰完成。灯塔确认了你的存在。" };
}

function recordWake({ tagId, modelId, source }) {
  const now = new Date();
  if (!state.bound) {
    state.bound = true;
    state.modelId = modelId;
    state.tagId = tagId;
    state.boundAt = now.toISOString();
  }
  state.wakeLogs.unshift({
    at: now.toISOString(),
    dayKey: todayKey(now),
    tagId,
    modelId: state.modelId || modelId,
    source
  });
  save();
  render();
  const model = models[state.modelId];
  const first = state.wakeLogs.length === 1;
  document.querySelector("#scan-result-title").textContent = first ? `${model.name}初醒` : `${model.name}留下回声`;
  document.querySelector("#scan-result-copy").textContent = `第 ${nightIndex()} 夜 · 第 ${state.wakeLogs.length} 道回声已进入灯塔。`;
  modal.classList.add("open");
}

async function scanNfc() {
  if (!("NDEFReader" in window)) {
    showToast("当前浏览器不支持 Web NFC，请用 Android Chrome 或模拟触碰");
    return;
  }
  try {
    const reader = new NDEFReader();
    await reader.scan();
    showToast("灯塔正在等待触碰，请靠近 NFC tag");
    reader.onreadingerror = () => showToast("读取失败，请重新靠近 tag");
    reader.onreading = (event) => {
      let payload = "";
      for (const record of event.message.records) {
        if (record.recordType === "text") payload += new TextDecoder(record.encoding || "utf-8").decode(record.data);
        else if (record.recordType === "url") payload += new TextDecoder().decode(record.data);
      }
      const modelId = parseModelFromPayload(payload);
      const tagId = event.serialNumber || payload || `NFC-${modelId}`;
      recordWake({ tagId, modelId, source: "NFC" });
    };
  } catch (error) {
    showToast(`NFC 启动失败：${error.message}`);
  }
}

function render() {
  const model = models[state.modelId || selectedModel];
  const aura = getAura();
  const n = nightIndex();
  const wakes = state.wakeLogs.length;
  document.querySelector("#status-dot").classList.toggle("bound", state.bound);
  document.querySelector("#bind-status").textContent = state.bound ? `${model.name} · ${aura.short}` : "尚未听见你的触碰";
  document.querySelector("#tag-id").textContent = state.bound ? state.tagId : "未醒";
  document.querySelector("#current-model-label").textContent = model.name;
  document.querySelector("#hero-title").textContent = state.bound ? `${model.name}正在跟随你` : "靠近它，灯会醒来";
  document.querySelector("#hero-copy").textContent = state.bound ? `第 ${n} 夜，${wakes} 道回声。第三夜之后，第一段记忆会松动。` : "第一次唤醒不是任务，而是这座灯塔开始记住你。";
  document.querySelector("#night-index").textContent = n;
  document.querySelector("#wake-count").textContent = wakes;
  document.querySelector("#aura-short").textContent = aura.short;
  document.querySelector("#aura-title").textContent = aura.title;
  document.querySelector("#aura-copy").textContent = aura.copy;
  document.querySelector("#bound-model").textContent = state.bound ? `${model.name} · ${state.tagId}` : "未绑定灯塔";
  document.querySelector("#wake-title").textContent = state.bound ? `${model.name}已有 ${wakes} 道回声` : "等待第一道回声";
  document.querySelector("#wake-copy").textContent = state.bound ? `当前是第 ${n} 夜。器韵：${aura.short}。` : "扫描 NFC 后，这里会显示绑定模型、唤醒次数和最近一次触碰时间。";
  document.querySelector("#today-wakes").textContent = todayWakeCount();
  document.querySelector("#total-wakes").textContent = wakes;
  document.querySelector("#bound-date").textContent = state.boundAt ? state.boundAt.slice(5, 10) : "--";
  document.querySelector("#last-wake").textContent = wakes ? new Date(state.wakeLogs[0].at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";
  document.querySelector("#p-days").textContent = `${n} / 3`;
  document.querySelector("#p-wakes").textContent = `${Math.min(wakes, 3)} / 3`;
  document.querySelector("#days-track").style.width = `${Math.min(n / 3 * 100, 100)}%`;
  document.querySelector("#wakes-track").style.width = `${Math.min(wakes / 3 * 100, 100)}%`;
  renderOrbit(n, wakes);
  renderWakes();
  renderMemory(n, wakes, model);
}

function renderOrbit(n, wakes) {
  [1, 2, 3].forEach((num) => {
    const item = document.querySelector(`#orbit-${num}`);
    item.classList.toggle("lit", n >= num && state.bound);
    item.classList.toggle("complete", n >= 3 && wakes >= 3 && num === 3);
  });
}

function renderWakes() {
  const list = document.querySelector("#wake-list");
  list.innerHTML = "";
  if (!state.wakeLogs.length) {
    list.innerHTML = "<article><b>暂无回声</b><span>靠近 NFC 或点击模拟触碰，留下第一道回声</span></article>";
    return;
  }
  state.wakeLogs.slice(0, 8).forEach((log) => {
    const item = document.createElement("article");
    const time = new Date(log.at).toLocaleString([], { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    item.innerHTML = `<b>${models[log.modelId]?.name || "灯塔"} · ${log.source}</b><span>${time} · ${log.tagId}</span>`;
    list.appendChild(item);
  });
}

function renderMemory(n, wakes, model) {
  const card = document.querySelector("#memory-card");
  const unlocked = state.bound && n >= 3 && wakes >= 3;
  card.classList.toggle("locked", !unlocked);
  card.innerHTML = unlocked
    ? `<span class="meta">记忆碎片 01 · 已显现</span><h3>${model.name}的第一段记忆</h3><p>${model.memory}</p>`
    : `<span class="meta">记忆碎片 01</span><h3>尚未松动</h3><p>第三夜之后，第一段灯塔记忆会显现。</p>`;
}

navItems.forEach((item) => item.addEventListener("click", () => goTo(item.dataset.target)));
document.querySelector("#scan-nfc").addEventListener("click", scanNfc);
document.querySelector("#mock-scan").addEventListener("click", () => {
  recordWake({ tagId: `DEMO-${selectedModel}`, modelId: selectedModel, source: "模拟触碰" });
});
document.querySelector("#next-day").addEventListener("click", () => {
  state.mockDayOffset += 1;
  save();
  render();
  showToast(`时间进入第 ${nightIndex()} 夜`);
});
document.querySelectorAll(".model-card").forEach((button) => {
  button.addEventListener("click", () => {
    if (state.bound) {
      showToast("灯塔已经初醒，重置测试后才能切换模型");
      return;
    }
    selectedModel = button.dataset.model;
    document.querySelectorAll(".model-card").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    render();
  });
});
document.querySelector(".modal-close").addEventListener("click", () => modal.classList.remove("open"));
document.querySelector(".close-modal").addEventListener("click", () => modal.classList.remove("open"));

render();
