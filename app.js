const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");
const title = document.querySelector("#page-title");
const riteModal = document.querySelector("#rite-modal");
const crystalModal = document.querySelector("#crystal-modal");
const toast = document.querySelector("#toast");
const titles = { candidate: "候选者档案", trials: "持器试炼", energy: "今日蓄能", invitation: "开炉邀请" };
let choice = null;
let intent = null;

function goTo(page) {
  pages.forEach((item) => item.classList.toggle("active", item.dataset.page === page));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.target === page));
  title.textContent = titles[page];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2300);
}

function applyChoice(name, trait) {
  const trace = document.querySelector("#choice-trace");
  trace.classList.remove("pending");
  trace.innerHTML = `<span>第三章 · 择意</span><strong>${name} · 器格「${trait}」</strong><small>这是你的个人显现，不是标准答案</small>`;
  document.querySelector("#chapter-label").textContent = "第四章 / 六章";
  document.querySelectorAll(".chapter-dots i")[2].className = "done";
  document.querySelectorAll(".chapter-dots i")[3].className = "current";
  document.querySelector(".invite-status").textContent = "候选档案 · 3 / 6 章完成";
  document.querySelectorAll(".invite-rules span")[2].classList.add("done");
}

navItems.forEach((item) => item.addEventListener("click", () => goTo(item.dataset.target)));
document.querySelectorAll("[data-goto]").forEach((item) => item.addEventListener("click", () => goTo(item.dataset.goto)));
document.querySelectorAll(".open-rite").forEach((item) => item.addEventListener("click", () => riteModal.classList.add("open")));
document.querySelector(".modal-close").addEventListener("click", () => riteModal.classList.remove("open"));

document.querySelectorAll(".choice-list button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".choice-list button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    choice = { name: button.dataset.choice, trait: button.dataset.trait };
    document.querySelector(".confirm-choice").disabled = false;
  });
});

document.querySelector(".confirm-choice").addEventListener("click", () => {
  if (!choice) return;
  localStorage.setItem("panjiChoice", JSON.stringify(choice));
  applyChoice(choice.name, choice.trait);
  riteModal.classList.remove("open");
  showToast(`第三章完成 · 初始器格「${choice.trait}」已显现`);
});

document.querySelectorAll(".intent-grid button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".intent-grid button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    intent = { symbol: button.dataset.intent, name: button.dataset.name, copy: button.dataset.copy };
    document.querySelector("#intent-title").textContent = `今日守护意图 · ${intent.symbol}`;
    document.querySelector("#intent-copy").textContent = intent.copy;
    document.querySelector(".begin-attune").disabled = false;
    document.querySelector(".begin-attune").textContent = "开始今日随行";
  });
});

document.querySelector(".begin-attune").addEventListener("click", () => {
  if (!intent) return;
  document.querySelector("#energy-fill").style.width = "33%";
  document.querySelector("#energy-label").textContent = "今日能量 1 / 3";
  document.querySelector("#main-crystal").classList.add("charged");
  document.querySelector("#crystal-name").textContent = `${intent.name}正在形成`;
  document.querySelector("#crystal-story").textContent = `${intent.copy} 完成三次随行后，这份意图会凝结为带有日期与故事的个人晶体。`;
  crystalModal.classList.add("open");
});

document.querySelector(".close-crystal").addEventListener("click", () => {
  crystalModal.classList.remove("open");
  showToast("今日意图已保存 · 晶体进度 1 / 3");
});

document.querySelectorAll(".four-artifacts button:not(.active)").forEach((button) => {
  button.addEventListener("click", () => showToast(`${button.querySelector("b").textContent}档案将在后续开炉前显现`));
});

const savedChoice = localStorage.getItem("panjiChoice");
if (savedChoice) {
  choice = JSON.parse(savedChoice);
  applyChoice(choice.name, choice.trait);
}
