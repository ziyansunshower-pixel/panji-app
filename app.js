const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");
const pageTitle = document.querySelector("#page-title");
const modal = document.querySelector("#mission-modal");
const toast = document.querySelector("#toast");

const titles = {
  home: "今日随身",
  arsenal: "我的藏库",
  map: "城市使命",
  market: "履历市场"
};

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

navItems.forEach((item) => item.addEventListener("click", () => goTo(item.dataset.target)));
document.querySelectorAll("[data-goto]").forEach((item) => {
  item.addEventListener("click", () => goTo(item.dataset.goto));
});

document.querySelectorAll(".start-mission").forEach((button) => {
  button.addEventListener("click", () => {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  });
});

document.querySelector(".modal-close").addEventListener("click", () => {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
});

document.querySelector(".complete-mission").addEventListener("click", () => {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.querySelector("#mission-count").textContent = "24";
  document.querySelector("#xp-label").textContent = "800 / 900";
  document.querySelector("#xp-bar").style.width = "89%";
  localStorage.setItem("panjiMissionComplete", "true");
  showToast("使命完成 · 获得 120 盘值与城市徽章");
});

document.querySelector("#add-item").addEventListener("click", () => {
  showToast("实物录入功能将在下一阶段接入 NFC / 二维码");
});

document.querySelectorAll(".outline-button").forEach((button) => {
  button.addEventListener("click", () => showToast("完整履历档案正在展开"));
});

if (localStorage.getItem("panjiMissionComplete") === "true") {
  document.querySelector("#mission-count").textContent = "24";
  document.querySelector("#xp-label").textContent = "800 / 900";
  document.querySelector("#xp-bar").style.width = "89%";
}
