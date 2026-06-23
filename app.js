const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");
const title = document.querySelector("#page-title");
const toast = document.querySelector("#toast");
const modal = document.querySelector("#scan-modal");
const titles = { bind: "灯塔认主", ritual: "3 天认主", wake: "唤醒记录", aura: "器韵状态" };

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
function dayIndex() {
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
  const d = dayIndex();
  const wakes = state.wakeLogs.length;
  if (!state.bound) return { title: "未醒", short: "未醒", copy: "第一次扫描后，灯塔会进入初醒状态。" };
  if (d >= 3 && wakes >= 3) return { title: "认主成功 · 灯火已定", short: "已认主", copy: "第 3 天认主完成，灯塔开始显现第一段记忆。" };
  if (d >= 2 || wakes >= 2) return { title: "复燃 · 光线稳定", short: "复燃", copy: "灯塔已经记住你的第二次触碰，器韵开始稳定。" };
  return { title: "初醒 · 微光回应", short: "初醒", copy: "第一次扫描完成，灯塔确认了你的存在。" };
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
  document.querySelector("#scan-result-title").textContent = state.wakeLogs.length === 1 ? `${model.name}已认主` : `${model.name}已唤醒`;
  document.querySelector("#scan-result-copy").textContent = `第 ${dayIndex()} 天 · 第 ${state.wakeLogs.length} 次唤醒已记录。`;
  modal.classList.add("open");
}

async function scanNfc() {
  if (!("NDEFReader" in window)) {
    showToast("当前浏览器不支持 Web NFC，请用 Android Chrome 或模拟扫描");
    return;
  }
  try {
    const reader = new NDEFReader();
    await reader.scan();
    showToast("NFC 扫描已启动，请靠近灯塔 tag");
    reader.onreadingerror = () => showToast("读取失败，请重新靠近 tag");
    reader.onreading = (event) => {
      let payload = "";
      for (const record of event.message.records) {
        if (record.recordType === "text") {
          payload += new TextDecoder(record.encoding || "utf-8").decode(record.data);
        } else if (record.recordType === "url") {
          payload += new TextDecoder().decode(record.data);
        }
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
  const d = dayIndex();
  const wakes = state.wakeLogs.length;
  document.querySelector("#bind-status").textContent = state.bound ? `已绑定 · ${model.name}` : "尚未绑定器物";
  document.querySelector("#tag-id").textContent = state.bound ? state.tagId : "等待 NFC";
  document.querySelector("#current-model-label").textContent = `灯塔 · ${model.name}`;
  document.querySelector("#hero-title").textContent = state.bound ? `${model.name}已进入认主流程` : "第一次触碰后认主";
  document.querySelector("#hero-copy").textContent = state.bound ? `继续扫描 NFC。第 3 天完成后，将解锁第一段记忆碎片。` : "用手机扫描 NFC tag。第一次扫描会把这件灯塔绑定为你的测试器物。";
  document.querySelector("#day-index").textContent = d;
  document.querySelector("#wake-count").textContent = wakes;
  document.querySelector("#aura-short").textContent = aura.short;
  document.querySelector("#bound-model").textContent = state.bound ? `${model.name} · ${state.tagId}` : "未绑定灯塔";
  document.querySelector("#wake-title").textContent = state.bound ? `${model.name}已唤醒 ${wakes} 次` : "等待第一次唤醒";
  document.querySelector("#wake-copy").textContent = state.bound ? `当前处于第 ${d} 天认主流程，器韵状态：${aura.short}。` : "扫描 NFC 后，这里会显示绑定模型、唤醒次数和最近一次触碰时间。";
  document.querySelector("#today-wakes").textContent = todayWakeCount();
  document.querySelector("#total-wakes").textContent = wakes;
  document.querySelector("#bound-date").textContent = state.boundAt ? state.boundAt.slice(5, 10) : "--";
  document.querySelector("#last-wake").textContent = wakes ? new Date(state.wakeLogs[0].at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";
  document.querySelector("#aura-title").textContent = aura.title;
  document.querySelector("#aura-copy").textContent = aura.copy;
  document.querySelector("#p-days").textContent = `${d} / 3`;
  document.querySelector("#p-wakes").textContent = `${Math.min(wakes, 3)} / 3`;
  document.querySelector("#days-track").style.width = `${Math.min(d / 3 * 100, 100)}%`;
  document.querySelector("#wakes-track").style.width = `${Math.min(wakes / 3 * 100, 100)}%`;
  renderRitual(d, wakes);
  renderWakes();
  renderMemory(d, wakes, model);
}

function renderRitual(d, wakes) {
  [1, 2, 3].forEach((num) => {
    const item = document.querySelector(`#ritual-${num}`);
    item.classList.remove("completed", "active");
    const status = item.querySelector("b");
    if (d > num || (d === 3 && wakes >= 3 && num === 3)) {
      item.classList.add("completed");
      status.textContent = "已完成";
    } else if (d === num && state.bound) {
      item.classList.add("active");
      status.textContent = "进行中";
    } else {
      status.textContent = num === 1 ? "未开始" : "未解锁";
    }
  });
}

function renderWakes() {
  const list = document.querySelector("#wake-list");
  list.innerHTML = "";
  if (!state.wakeLogs.length) {
    list.innerHTML = "<article><b>暂无唤醒</b><span>扫描 NFC 或点击模拟扫描开始测试</span></article>";
    return;
  }
  state.wakeLogs.slice(0, 8).forEach((log) => {
    const item = document.createElement("article");
    const time = new Date(log.at).toLocaleString([], { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    item.innerHTML = `<b>${models[log.modelId]?.name || "灯塔"} · ${log.source}</b><span>${time} · ${log.tagId}</span>`;
    list.appendChild(item);
  });
}

function renderMemory(d, wakes, model) {
  const card = document.querySelector("#memory-card");
  const unlocked = state.bound && d >= 3 && wakes >= 3;
  card.classList.toggle("locked", !unlocked);
  card.innerHTML = unlocked
    ? `<span class="meta">记忆碎片 01 · 已解锁</span><h3>${model.name}的第一段记忆</h3><p>${model.memory}</p>`
    : `<span class="meta">记忆碎片 01</span><h3>尚未解锁</h3><p>第 3 天认主成功后，第一段灯塔记忆会显现。</p>`;
}

navItems.forEach((item) => item.addEventListener("click", () => goTo(item.dataset.target)));
document.querySelector("#scan-nfc").addEventListener("click", scanNfc);
document.querySelector("#mock-scan").addEventListener("click", () => {
  recordWake({ tagId: `DEMO-${selectedModel}`, modelId: selectedModel, source: "模拟扫描" });
});
document.querySelector("#next-day").addEventListener("click", () => {
  state.mockDayOffset += 1;
  save();
  render();
  showToast(`已模拟进入第 ${dayIndex()} 天`);
});
document.querySelectorAll(".model-card").forEach((button) => {
  button.addEventListener("click", () => {
    if (state.bound) {
      showToast("已绑定器物，测试重置后可切换模型");
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
