const STORAGE_KEY = "panji:lighthouse:v1";
const DAY = 24 * 60 * 60 * 1000;

const fragments = [
  "北境炼器师相信，\n黑暗不会结束。\n因此他们学会了带着灯火继续前行。",
  "灯塔并非为活人而造。",
  "最后一个归乡者，\n从未归乡。"
];

const polishWhispers = [
  "手心的温度留在了灯芯上。",
  "它似乎更加熟悉你了。",
  "这段时间没有消失。",
  "黄铜慢慢安静下来。",
  "灯火没有变亮，只是没有离开。"
];

const scanWhispers = [
  "灯芯轻轻回应了一下。",
  "它记住了这一次靠近。",
  "风雪之外，有一处微光。",
  "你和灯塔又相遇了一次。"
];

const $ = (selector) => document.querySelector(selector);

const elements = {
  bondState: $("#bond-state"),
  lastMeeting: $("#last-meeting"),
  artifactLine: $("#artifact-line"),
  stateLabel: $("#state-label"),
  daysLabel: $("#days-label"),
  lastLabel: $("#last-label"),
  patinaLabel: $("#patina-label"),
  nfcStatus: $("#nfc-status"),
  polishMessage: $("#polish-message"),
  fragmentList: $("#fragment-list"),
  scanButton: $("#scan-button"),
  manualScanButton: $("#manual-scan-button"),
  polishButton: $("#polish-button"),
  toast: $("#toast")
};

function createArtifact() {
  return {
    id: "lighthouse-001",
    type: "lighthouse",
    firstScanAt: null,
    lastScanAt: null,
    scanCount: 0,
    polishCount: 0,
    hiddenPatina: 0,
    hiddenBondValue: 0,
    currentState: "陌生",
    unlockedFragments: []
  };
}

function loadArtifact() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return createArtifact();

  try {
    return { ...createArtifact(), ...JSON.parse(saved) };
  } catch {
    return createArtifact();
  }
}

function saveArtifact() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(artifact));
}

function startOfDay(time) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function daysTogether() {
  if (!artifact.firstScanAt) return 0;
  return Math.max(1, Math.floor((startOfDay(Date.now()) - startOfDay(artifact.firstScanAt)) / DAY) + 1);
}

function formatDateTime(time) {
  if (!time) return "无记录";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(time));
}

function choose(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function stateForArtifact() {
  const days = daysTogether();
  if (!artifact.firstScanAt || days <= 1) return "陌生";
  if (days === 2) return "记息";
  return "认主";
}

function lineForState(state) {
  if (state === "认主") return "灯火已认主。";
  if (state === "记息") return "它似乎记住了你的气息。";
  return "灯火尚未认识你。";
}

function patinaForArtifact() {
  const value = artifact.hiddenPatina + artifact.hiddenBondValue + daysTogether() * 2;
  if (value >= 52) return "守夜";
  if (value >= 28) return "温润";
  if (value >= 9) return "微明";
  return "黯淡";
}

function updateFragments() {
  const unlocked = new Set(artifact.unlockedFragments);

  if (artifact.hiddenBondValue >= 8 || daysTogether() >= 2) unlocked.add(0);
  if (artifact.hiddenBondValue >= 24 || artifact.polishCount >= 6 || daysTogether() >= 5) unlocked.add(1);
  if (artifact.hiddenBondValue >= 48 || daysTogether() >= 9) unlocked.add(2);

  artifact.unlockedFragments = [...unlocked].sort();
}

function renderFragments() {
  elements.fragmentList.innerHTML = fragments.map((fragment, index) => {
    const unlocked = artifact.unlockedFragments.includes(index);
    const body = unlocked ? fragment : "尚未记起";
    const className = unlocked ? "" : " class=\"locked\"";

    return `<article${className}><span>碎片 ${index + 1}</span><p>${body}</p></article>`;
  }).join("");
}

function render() {
  artifact.currentState = stateForArtifact();
  updateFragments();
  saveArtifact();

  const days = daysTogether();
  const last = formatDateTime(artifact.lastScanAt);
  const patina = patinaForArtifact();

  elements.bondState.textContent = artifact.currentState;
  elements.lastMeeting.textContent = artifact.lastScanAt ? `最近相遇于 ${last}` : "尚未相遇";
  elements.artifactLine.textContent = lineForState(artifact.currentState);
  elements.stateLabel.textContent = artifact.currentState;
  elements.daysLabel.textContent = days ? `${days} 天` : "尚未开始";
  elements.lastLabel.textContent = last;
  elements.patinaLabel.textContent = patina;
  renderFragments();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2800);
}

function meetLighthouse(source = "manual") {
  const now = Date.now();
  const firstMeeting = !artifact.firstScanAt;

  if (!artifact.firstScanAt) artifact.firstScanAt = now;
  artifact.lastScanAt = now;
  artifact.scanCount += 1;
  artifact.hiddenBondValue += firstMeeting ? 4 : 2;
  artifact.hiddenPatina += 1;

  render();
  const message = firstMeeting ? "灯火第一次记下了你的气息。" : choose(scanWhispers);
  elements.nfcStatus.textContent = source === "nfc" ? "真实灯塔已被识别。" : "这次相遇已被记下。";
  showToast(message);
}

function polishLighthouse() {
  artifact.polishCount += 1;
  artifact.hiddenPatina += 2;
  artifact.hiddenBondValue += 1;

  const message = choose(polishWhispers);
  elements.polishMessage.textContent = message;
  render();
  showToast(message);
}

function readRecord(record) {
  if (!record || !record.data) return "";
  if (record.recordType === "text") {
    return new TextDecoder(record.encoding || "utf-8").decode(record.data);
  }
  if (record.recordType === "url") {
    return new TextDecoder().decode(record.data);
  }
  return "";
}

function isLighthouseTag(event) {
  const serial = (event.serialNumber || "").toLowerCase();
  const records = [...event.message.records].map(readRecord).join(" ").toLowerCase();
  return records.includes("lighthouse") || records.includes("panji") || records.includes("灯塔") || Boolean(serial);
}

async function scanNfc() {
  if (!("NDEFReader" in window)) {
    elements.nfcStatus.textContent = "此浏览器不能直接读取 NFC。Android Chrome 更适合真实测试。";
    showToast("暂时无法读取 NFC。可以先记录一次相遇。");
    return;
  }

  try {
    const reader = new NDEFReader();
    await reader.scan();
    elements.nfcStatus.textContent = "正在等待灯塔靠近。";
    showToast("把灯塔靠近手机背面。");

    reader.onreadingerror = () => {
      elements.nfcStatus.textContent = "这次没有读清。稍后再靠近一次。";
    };

    reader.onreading = (event) => {
      if (!isLighthouseTag(event)) {
        elements.nfcStatus.textContent = "有东西靠近了，但它不像灯塔。";
        return;
      }

      meetLighthouse("nfc");
    };
  } catch (error) {
    elements.nfcStatus.textContent = "灯塔没有回应。请确认 NFC 已开启，并从一次触碰开始。";
    showToast("这次未能开始扫描。");
  }
}

let artifact = loadArtifact();

elements.scanButton.addEventListener("click", scanNfc);
elements.manualScanButton.addEventListener("click", () => meetLighthouse("manual"));
elements.polishButton.addEventListener("click", polishLighthouse);

if (!("NDEFReader" in window)) {
  elements.nfcStatus.textContent = "当前浏览器未提供 NFC。真实扫描请使用 Android Chrome。";
}

render();
