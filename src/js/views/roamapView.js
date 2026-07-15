// src/js/views/roadmapView.js
import View from "./View.js";

class RoadmapView extends View {
  // Apunta únicamente al contenedor vacío dentro de tu Dashboard privado
  _parentElement = document.getElementById("roadmap-cards-target");

  // Captura el click de forma inteligente usando delegación de eventos
  addHandlerClickCard(handler) {
    this._parentElement.addEventListener("click", function (e) {
      const btn = e.target.closest(".glass-capsule-btn");
      if (!btn) return;

      const targetView = btn.dataset.target;
      handler(targetView);
    });
  }

  _generateMarkup() {
    // Genera las 3 tarjetas de forma dinámica recorriendo el array del Modelo
    return this._data
      .map((phaseData) => {
        return `
          <div class="glass-crystal-card rounded-3xl p-5 flex flex-col justify-between space-y-4 text-slate-800">
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded uppercase tracking-wider">
                  ${phaseData.weeks}
                </span>
                <span class="text-xs font-bold text-slate-400">PHASE ${phaseData.phase}</span>
              </div>
              <h3 class="font-extrabold text-slate-800 text-sm sm:text-base">${phaseData.title}</h3>
              <p class="text-xs text-slate-500 leading-relaxed">${phaseData.description}</p>
            </div>
            <button class="glass-capsule-btn w-full py-2 rounded-xl font-bold text-[11px]" data-target="${phaseData.targetView}">
              Enter Classes
            </button>
          </div>
        `;
      })
      .join("");
  }
}

export default new RoadmapView();
