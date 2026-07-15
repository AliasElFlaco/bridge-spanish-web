// views/navigationView.js
import View from "./View.js";

class NavigationView extends View {
  _parentElement = document.querySelector(".main-navigation-container");

  // Publisher: Listens for events
  addHandlerRender(handler) {
    this._parentElement.addEventListener("click", function (e) {
      const btn = e.target.closest(".nav-tab-btn"); // Matches buttons like "Cognate Tool"
      if (!btn) return;

      const targetView = btn.dataset.view; // e.g., data-view="activeClass"
      handler(targetView);
    });
  }

  // Visual helper to update active button class styles
  updateActiveTab(activeView) {
    this._parentElement.querySelectorAll(".nav-tab-btn").forEach((btn) => {
      btn.classList.remove("active-tab-style"); // Replace with your turquoise/neon CSS class
      if (btn.dataset.view === activeView) {
        btn.classList.add("active-tab-style");
      }
    });
  }
}

export default new NavigationView();
