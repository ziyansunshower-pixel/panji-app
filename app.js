const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");
const pageTitle = document.querySelector("#page-title");
const missionModal = document.querySelector("#mission-modal");
const revealModal = document.querySelector("#reveal-modal");
const toast = document.querySelector("#toast");
const titles = { home: "今日持器", lore: "五行器谱", missions: "随行异闻", letters: "密函" };
let selectedAnswer = "";

function goTo(page) {
  pages.forEach((item) => item.classList.toggle("active", item.dataset.page === page));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.target === page));
  pageTitle.textContent = titles[page];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2300);
}

function openMission() {
  missionModal.classList.add("open");
  missionModal.setAttribute("aria-hidden", "false");
}

function applyRecoveredState() {
  document.querySelector("#truth-label").textContent = "51%";
  document.querySelector("#truth-bar").style.width = "51%";
  const fragment = document.querySelector("#new-fragment");
  fragment.classList.remove("locked-fragment");
  fragment.innerHTML = `
    <span class="fragment-no">残页 04 · 已寻回</span>
    <h4>雨夜来信</h4>
    <p>“火不在炉中。若你听懂了回响，就去找赤山。”</p>
    <small>来自铸七 · 渝州第七码头</small>`;
  document.querySelector("#invite-condition").classList.add("done");
  document.querySelector("#invite-condition").textContent = "寻回「雨夜来信」";
  document.querySelector(".invite-status").textContent = "条件完成 · 等待开炉";
}

navItems.forEach((item) => item.addEventListener("click", () => goTo(item.dataset.target)));
document.querySelectorAll("[data-goto]").forEach((item) => item.addEventListener("click", () => goTo(item.dataset.goto)));
document.querySelectorAll(".start-mission").forEach((button) => button.addEventListener("click", openMission));
document.querySelector(".modal-close").addEventListener("click", () => missionModal.classList.remove("open"));

document.querySelectorAll(".sound-options button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".sound-options button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    selectedAnswer = button.dataset.answer;
    document.querySelector(".submit-answer").disabled = false;
  });
});

document.querySelector(".submit-answer").addEventListener("click", () => {
  if (selectedAnswer !== "correct") {
    showToast("声音不符：尾音里没有第二次回震");
    return;
  }
  missionModal.classList.remove("open");
  revealModal.classList.add("open");
  localStorage.setItem("panjiArchive04", "recovered");
  applyRecoveredState();
});

document.querySelector(".finish-reveal").addEventListener("click", () => {
  revealModal.classList.remove("open");
  goTo("letters");
  showToast("残页已收入器谱 · 开炉条件完成");
});

document.querySelectorAll(".element").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".element").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (button.dataset.element === "金") showToast("金脉已显现：结构、回声与铸痕");
    else showToast(`${button.dataset.element}脉尚未显现 · 需要获得对应器物`);
  });
});

document.querySelectorAll(".vein-node").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("gold")) showToast("已识别：金脉 · 记忆结构");
    else showToast("该器脉档案仍被封存");
  });
});

document.querySelector("#inspect-invite").addEventListener("click", () => {
  if (localStorage.getItem("panjiArchive04") === "recovered") {
    showToast("邀请条件已完成 · 等待七月初七开炉");
  } else {
    goTo("missions");
    showToast("线索指向主线异闻「听见沉默的金属」");
  }
});

document.querySelectorAll(".mission-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mission-tabs button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    showToast(`${button.textContent}异闻已切换`);
  });
});

if (localStorage.getItem("panjiArchive04") === "recovered") applyRecoveredState();
