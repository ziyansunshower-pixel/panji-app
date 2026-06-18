const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");
const title = document.querySelector("#page-title");
const toast = document.querySelector("#toast");
const modal = document.querySelector("#reveal-modal");
const titles = { home: "今日布阵", artifact: "我的本命器", explore: "地点探索", reveal: "显现阵图" };

let state = JSON.parse(localStorage.getItem("panjiCoreState") || "{}");
state = { carried: false, carryDays: 12, arrayCount: 7, placeCount: 4, selectedArray: "归途", selectedPlace: "雨后街角", selectedTrace: "雨 / 石路 / 回家", ...state };

function save() { localStorage.setItem("panjiCoreState", JSON.stringify(state)); }
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2300);
}
function goTo(page) {
  pages.forEach((item) => item.classList.toggle("active", item.dataset.page === page));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.target === page));
  title.textContent = titles[page];
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function render() {
  document.querySelector("#carry-state").textContent = state.carried ? "今日已确认携带 · 随行中" : "今日尚未确认携带";
  document.querySelector("#carry-days").textContent = state.carryDays;
  document.querySelector("#array-count").textContent = state.arrayCount;
  document.querySelector("#place-count").textContent = state.placeCount;
  document.querySelector("#p-carry").textContent = `${Math.min(state.carryDays - 7, 7)} / 7`;
  document.querySelector("#p-place").textContent = `${Math.min(state.placeCount, 5)} / 5`;
  document.querySelector("#carry-track").style.width = `${Math.min((state.carryDays - 7) / 7 * 100, 100)}%`;
  document.querySelector("#place-track").style.width = `${Math.min(state.placeCount / 5 * 100, 100)}%`;
}

navItems.forEach((item) => item.addEventListener("click", () => goTo(item.dataset.target)));

document.querySelectorAll(".array-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".array-card").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.selectedArray = button.dataset.array;
    document.querySelector("#array-title").textContent = `回响 · ${state.selectedArray}阵`;
    document.querySelector("#array-copy").textContent = button.dataset.copy;
    save();
  });
});

document.querySelector("#confirm-carry").addEventListener("click", () => {
  if (!state.carried) {
    state.carried = true;
    state.carryDays += 1;
    showToast("携带已确认 · 今日随行开始");
  } else {
    showToast("今天已经确认过携带");
  }
  save();
  render();
});

document.querySelectorAll(".tag").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tag").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.selectedPlace = button.dataset.place;
    state.selectedTrace = button.dataset.trace;
    document.querySelector("#place-title").textContent = state.selectedPlace;
    save();
  });
});

document.querySelector("#record-place").addEventListener("click", () => {
  state.placeCount += 1;
  const item = document.createElement("article");
  item.innerHTML = `<b>${state.selectedPlace}</b><span>${state.selectedTrace} · 今日</span>`;
  document.querySelector("#trace-list").prepend(item);
  showToast("环境痕迹已记录 · 器物显现度提升");
  save();
  render();
});

document.querySelector("#reveal-check").addEventListener("click", () => {
  const carryLeft = Math.max(0, 14 - state.carryDays);
  const placeLeft = Math.max(0, 5 - state.placeCount);
  const ready = carryLeft === 0 && placeLeft === 0;
  document.querySelector("#reveal-copy").textContent = ready ? "条件已完成。下一次布阵后，雾中回响将显现第一段隐藏记录。" : `还差 ${carryLeft} 次携带确认和 ${placeLeft} 次地点探索。它已经接近第一次回应。`;
  modal.classList.add("open");
});

document.querySelector(".modal-close").addEventListener("click", () => modal.classList.remove("open"));
document.querySelector(".close-modal").addEventListener("click", () => modal.classList.remove("open"));

document.querySelectorAll(".four-artifacts button:not(.active)").forEach((button) => {
  button.addEventListener("click", () => showToast(`${button.querySelector("b").textContent}会在后续炉次开放`));
});

render();
