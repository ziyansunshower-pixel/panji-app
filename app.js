const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");
const title = document.querySelector("#page-title");
const toast = document.querySelector("#toast");
const modal = document.querySelector("#scan-modal");
const titles = { tower: "灯塔", echoes: "痕迹", memory: "记忆" };

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
  if (!state.bound) return { title: "灯芯未温", short: "未温", copy: "它还没有记住你的气息。" };
  if (n >= 3 && wakes >= 3) return { title: "灯火变得更加温暖", short: "温暖", copy: "它似乎开始记住你了。不是因为完成了什么，而是因为你又靠近了一次。" };
  if (n >= 2 || wakes >= 2) return { title: "灯火有了回温", short: "回温", copy: "你离开后，灯芯里仍留着一点余热。" };
  return { title: "第一缕微光", short: "微光", copy: "它没有说话，只是亮了一下。" };
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
  document.querySelector("#scan-result-title").textContent = first ? `${model.name}亮了一下` : `${model.name}更温暖了`;
  document.querySelector("#scan-result-copy").textContent = first ? "第一次靠近被它记住。之后的变化会很慢。" : "灯火变得更加温暖。";
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
    showToast("灯塔正在等待靠近");
    reader.onreadingerror = () => showToast("它没有听清，请再靠近一点");
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
    showToast(`NFC 没有醒来：${error.message}`);
  }
}

function render() {
  const model = models[state.modelId || selectedModel];
  const aura = getAura();
  const n = nightIndex();
  const wakes = state.wakeLogs.length;
  document.querySelector("#status-dot").classList.toggle("bound", state.bound);
  document.querySelector("#bind-status").textContent = state.bound ? `${model.name} · ${aura.short}` : "尚未记住你的气息";
  document.querySelector("#tag-id").textContent = state.bound ? "已初见" : "灯芯未温";
  document.querySelector("#current-model-label").textContent = model.name;
  document.querySelector("#hero-title").textContent = state.bound ? `${model.name}正在跟随你` : "靠近它，灯芯会变暖";
  document.querySelector("#hero-copy").textContent = state.bound ? "它不会立刻改变。只是每一次靠近，都会让灯火更像你的温度。" : "你不是在升级器物。你是在和它建立关系。";
  document.querySelector("#breath-state").textContent = state.bound ? "已留" : "未留";
  document.querySelector("#warmth-state").textContent = aura.short;
  document.querySelector("#memory-state").textContent = n >= 3 && wakes >= 3 ? "松动" : "沉睡";
  document.querySelector("#aura-title").textContent = aura.title;
  document.querySelector("#aura-copy").textContent = aura.copy;
  document.querySelector("#bound-model").textContent = state.bound ? `${model.name} · ${state.tagId}` : "未绑定灯塔";
  document.querySelector("#wake-title").textContent = state.bound ? `${model.name}留下了一些痕迹` : "尚未留下痕迹";
  document.querySelector("#wake-copy").textContent = state.bound ? "系统只保留很少的信息。大部分关系不需要被解释。" : "靠近之后，这里只保留少量记录。系统不会解释一切。";
  document.querySelector("#today-wakes").textContent = todayWakeCount() > 0 ? "有" : "--";
  document.querySelector("#total-wakes").textContent = wakes > 2 ? "深" : wakes > 0 ? "浅" : "--";
  document.querySelector("#bound-date").textContent = state.boundAt ? state.boundAt.slice(5, 10) : "--";
  document.querySelector("#last-wake").textContent = wakes ? new Date(state.wakeLogs[0].at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";
  document.querySelector("#fragment-hint").textContent = n >= 3 && wakes >= 3 ? "有一段记录松动了。它没有完整解释自己，只给你留下了一句话。" : "它还没有准备好说出第一句话。只是灯火似乎变得更加温暖。";
  document.querySelector("#soft-meter").style.width = `${Math.min(((state.bound ? n : 0) + Math.min(wakes, 3)) / 6 * 100, 100)}%`;
  document.querySelector("#soft-caption").textContent = n >= 3 && wakes >= 3 ? "一小段记忆浮上来了。" : "变化以天、周、月为单位发生。";
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
    list.innerHTML = "<article><b>暂无痕迹</b><span>靠近它，第一点余温会留下来</span></article>";
    return;
  }
  state.wakeLogs.slice(0, 8).forEach((log) => {
    const item = document.createElement("article");
    const time = new Date(log.at).toLocaleString([], { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    item.innerHTML = `<b>${models[log.modelId]?.name || "灯塔"} · 灯火回温</b><span>${time} · ${log.source}</span>`;
    list.appendChild(item);
  });
}

function renderMemory(n, wakes, model) {
  const card = document.querySelector("#memory-card");
  const unlocked = state.bound && n >= 3 && wakes >= 3;
  card.classList.toggle("locked", !unlocked);
  card.innerHTML = unlocked
    ? `<span class="meta">记忆碎片 01 · 已显现</span><h3>${model.name}的第一段记忆</h3><p>${model.memory}</p>`
    : `<span class="meta">记忆碎片 01</span><h3>尚未松动</h3><p>有些记忆不能被催促。它只会在关系足够安静时出现。</p>`;
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
  showToast("时间慢慢过去了一点");
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
