// --- ORQUESTADOR PRINCIPAL DEL PORTAL (APP.JS) ---

import { renderRoadmapCards, lessonsData } from "./modules/curriculum.js";
import { initCognateStudio } from "./modules/cognates.js";
import {
  setupFlashcardEngine,
  nextCard,
  prevCard,
} from "./modules/flashcards.js";
import { initQuizEngine, checkAnswer, advanceQuiz } from "./modules/quiz.js";
import { playTTS } from "./modules/speech.js";

let activeLessonIndex = 0;
let isAnnual = false;

// Objeto de estado persistente para el alumno
let userProgress = {
  completedLessons: [], // Índices de lecciones completadas
  quizHighScores: { phase1: 0, phase2: 0, phase3: 0 },
};

document.addEventListener("DOMContentLoaded", () => {
  initAppRouting();
  loadUserProgress(); // Cargar progreso desde localStorage
  initSyllabusEngine();

  // Inyectar tarjetas dinámicas de los 6 meses
  renderRoadmapCards("roadmap-cards-container", (targetLessonIndex) => {
    switchTab("lessons");
    loadLesson(targetLessonIndex);
  });

  // Iniciar herramientas complementarias
  initCognateStudio("cognate-rules-selector", "cognate-workbench-list");
  renderPricingPortal();
  setupEvents();
});

// --- MOTOR DE PERSISTENCIA (LOCALSTORAGE) ---
function loadUserProgress() {
  const savedData = localStorage.getItem("bridge_spanish_user_progress");
  if (savedData) {
    try {
      userProgress = JSON.parse(savedData);
    } catch (e) {
      console.error("Error cargando el progreso del alumno", e);
    }
  }
}

function saveUserProgress() {
  localStorage.setItem(
    "bridge_spanish_user_progress",
    JSON.stringify(userProgress),
  );
  updateProgressDashboardUI();
}

function updateProgressDashboardUI() {
  // Busca o inyecta dinámicamente una barra de progreso general en la vista del mapa
  const totalLessons = lessonsData.length;
  const completedCount = userProgress.completedLessons.length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  const roadmapTitle = document.getElementById("roadmap-title");
  if (roadmapTitle) {
    // Agrega una barra de progreso sutil y elegante de cristal turquesa encima del Roadmap
    let progressBar = document.getElementById("dashboard-overall-progress");
    if (!progressBar) {
      const container = document.createElement("div");
      container.id = "dashboard-overall-progress";
      container.className =
        "w-full bg-teal-900/10 rounded-full h-2.5 mt-2 mb-6 max-w-md relative overflow-hidden border border-teal-550/20";
      container.innerHTML = `<div id="dashboard-progress-fill" class="bg-gradient-to-r from-teal-500 to-cyan-400 h-full transition-all duration-500" style="width: ${progressPercent}%"></div>`;
      roadmapTitle.parentNode.insertBefore(container, roadmapTitle.nextSibling);
    } else {
      document.getElementById("dashboard-progress-fill").style.width =
        `${progressPercent}%`;
    }
  }
}

// --- ENRUTADOR PRINCIPAL SPA (Single Page Application) ---
function initAppRouting() {
  document.querySelectorAll("nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.id.replace("nav-", "");
      switchTab(tabId);
    });
  });

  // Botón de inicio del banner principal
  const heroBtn = document.getElementById("hero-start-lessons");
  if (heroBtn) {
    heroBtn.onclick = () => {
      switchTab("lessons");
      loadLesson(0);
    };
  }

  // Permitir volver al menú principal al hacer clic sobre el Logo de la esquina superior izquierda
  const brandLogo = document.getElementById("brand-logo");
  if (brandLogo) {
    brandLogo.onclick = () => {
      switchTab("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Volviendo al Mapa de 6 Meses", "info");
    };
  }
}

function switchTab(tabId) {
  // Ocultar todas las vistas
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.add("hidden"));

  // Mostrar la vista seleccionada
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.remove("hidden");

  // Resetear clases de todos los botones del menú de navegación
  document.querySelectorAll("nav button").forEach((b) => {
    b.className =
      "glass-nav-btn py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1";
  });

  // Activar estilo del botón de navegación seleccionado
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeNav) {
    activeNav.className =
      "glass-nav-btn-active py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1";
  }

  // Inicializaciones automáticas al entrar a pestañas específicas
  if (tabId === "flashcards") {
    setupFlashcardEngine(
      "flashcard-deck-tabs",
      "flashcard-trigger",
      renderActiveCard,
    );
  }
}

// --- ENGINE DEL SYLLABUS INTERACTIVO ---
function initSyllabusEngine() {
  const list = document.getElementById("lesson-links-container");
  if (!list) return;
  list.innerHTML = "";

  lessonsData.forEach((lesson, idx) => {
    const item = document.createElement("button");
    item.className =
      "w-full text-left p-3 rounded-xl transition-all flex items-center space-x-3 border border-transparent text-slate-600 hover:bg-slate-50";
    item.innerHTML = `
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 bg-slate-150 text-slate-600">${idx + 1}</div>
            <div class="flex-1 min-w-0">
                <span class="block text-[9px] uppercase font-bold text-teal-600">${lesson.module}</span>
                <span class="block text-xs font-semibold truncate text-slate-800">${lesson.title}</span>
            </div>
        `;
    item.onclick = () => loadLesson(idx);
    list.appendChild(item);
  });
  loadLesson(0);
}

function loadLesson(idx) {
  activeLessonIndex = idx;
  const lesson = lessonsData[idx];
  if (!lesson) return;

  // Registrar la lección como completada de forma automática
  if (!userProgress.completedLessons.includes(idx)) {
    userProgress.completedLessons.push(idx);
    saveUserProgress();
    showToast(`📚 Lección ${idx + 1} desbloqueada y completada`, "success");
  }

  // Actualizar elementos de la vista
  const badge = document.getElementById("lesson-badge");
  const title = document.getElementById("lesson-title");
  const content = document.getElementById("lesson-content");
  const numDisplay = document.getElementById("current-lesson-num");

  if (badge) badge.innerText = lesson.module;
  if (title) title.innerText = lesson.title;
  if (content) content.innerHTML = lesson.content;
  if (numDisplay) numDisplay.innerText = idx + 1;

  // Actualizar selección visual en la barra lateral
  const buttons = document.querySelectorAll("#lesson-links-container button");
  buttons.forEach((btn, bIdx) => {
    if (bIdx === idx) {
      btn.className =
        "w-full text-left p-3 rounded-xl transition-all flex items-center space-x-3 border border-teal-200 bg-teal-50/50 text-teal-950 font-bold";
      btn.querySelector(".w-8").className =
        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 bg-teal-600 text-white";
    } else {
      btn.className =
        "w-full text-left p-3 rounded-xl transition-all flex items-center space-x-3 border border-transparent text-slate-650 hover:bg-slate-50";
      btn.querySelector(".w-8").className =
        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 bg-slate-150 text-slate-600";
    }
  });

  // Controlar visibilidad/estado de los botones de navegación inferior
  const prevBtn = document.getElementById("btn-prev-lesson");
  if (prevBtn) {
    prevBtn.disabled = idx === 0;
    prevBtn.style.opacity = idx === 0 ? "0.4" : "1";
  }
}

// --- PORTAL DE PLANES Y PRECIOS ---
function renderPricingPortal() {
  const container = document.getElementById("pricing-cards-container");
  if (!container) return;

  container.innerHTML = `
        <div class="glass-crystal-card rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div>
                <span class="text-[9px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded border uppercase tracking-wide">Plan Autoguiado</span>
                <h3 class="text-xl font-bold text-slate-900 mt-2">Liquid Self-Study</h3>
                <p class="text-3xl font-extrabold text-slate-900 mt-2" id="self-study-price">${isAnnual ? "$23" : "$29"}<span class="text-xs font-normal text-slate-400">/mes</span></p>
                <p class="text-xs text-slate-550 mt-2">Acceso a todas las herramientas interactivas y material de estudio en cristal de forma permanente.</p>
            </div>
            <button id="btn-buy-self" class="glass-capsule-btn w-full py-3 rounded-xl font-bold text-xs">Adquirir Self-Study</button>
        </div>
        <div class="bg-gradient-to-br from-teal-950 to-teal-900 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative shadow-md border-2 border-teal-400 text-white">
            <div class="absolute -top-3 right-4 bg-teal-500 text-teal-950 font-bold text-[9px] uppercase px-2.5 py-1 rounded-full border border-teal-300">Más Popular</div>
            <div>
                <span class="text-[9px] font-bold text-teal-300 bg-white/10 px-2.5 py-1 rounded uppercase tracking-wide">Mentoría Profesional</span>
                <h3 class="text-xl font-bold mt-2 text-teal-300">Fluency Flow with Tutor</h3>
                <p class="text-3xl font-extrabold mt-2 text-white" id="tutor-price">${isAnnual ? "$119" : "$149"}<span class="text-xs font-normal text-teal-300">/mes</span></p>
                <p class="text-xs text-teal-100/70 mt-2">Acceso al software + corrección de voz directa y 2 videollamadas al mes con tutores hispanohablantes.</p>
            </div>
            <button id="btn-buy-tutor" class="glass-capsule-btn w-full py-3 rounded-xl font-bold text-xs text-teal-950">Suscribirse con Tutor</button>
        </div>
    `;

  document.getElementById("btn-buy-self").onclick = () =>
    openCheckoutModal("self-study");
  document.getElementById("btn-buy-tutor").onclick = () =>
    openCheckoutModal("tutor");
}

// --- CONTROLADOR GENERAL DE EVENTOS ---
function setupEvents() {
  // Selector de Facturación (Mensual / Anual)
  const billingToggle = document.getElementById("billing-toggle");
  if (billingToggle) {
    billingToggle.onclick = () => {
      isAnnual = !isAnnual;
      const knob = document.getElementById("billing-toggle-knob");
      if (knob) {
        knob.className = isAnnual
          ? "w-4 h-4 bg-teal-600 rounded-full shadow-md transform transition-all translate-x-6"
          : "w-4 h-4 bg-teal-600 rounded-full shadow-md transform transition-all translate-x-0";
      }
      renderPricingPortal();
      showToast(
        isAnnual
          ? "Suscripción ajustada a Anual (¡20% de Descuento!)"
          : "Suscripción ajustada a Mensual",
        "success",
      );
    };
  }

  // Controles de lección activa
  const nextLessonBtn = document.getElementById("btn-next-lesson");
  const prevLessonBtn = document.getElementById("btn-prev-lesson");

  if (nextLessonBtn) {
    nextLessonBtn.onclick = () => {
      if (activeLessonIndex < lessonsData.length - 1) {
        loadLesson(activeLessonIndex + 1);
      } else {
        showToast(
          "¡Has completado el Syllabus básico! Pasando al examen de diagnóstico.",
          "success",
        );
        switchTab("quiz");
      }
    };
  }
  if (prevLessonBtn) {
    prevLessonBtn.onclick = () => {
      if (activeLessonIndex > 0) {
        loadLesson(activeLessonIndex - 1);
      }
    };
  }

  // Controles de las fichas de memorización (Flashcards)
  const nextCardBtn = document.getElementById("btn-next-card");
  const prevCardBtn = document.getElementById("btn-prev-card");

  if (nextCardBtn) nextCardBtn.onclick = () => nextCard(renderActiveCard);
  if (prevCardBtn) prevCardBtn.onclick = () => prevCard(renderActiveCard);

  // Controles del Examen Diagnóstico
  const startQuizBtn = document.getElementById("quiz-start-btn");
  const restartQuizBtn = document.getElementById("quiz-restart-btn");
  const nextQuizBtn = document.getElementById("quiz-next-btn");

  if (startQuizBtn)
    startQuizBtn.onclick = () =>
      initQuizEngine("phase1", loadQuestionUI, showQuizResults);
  if (restartQuizBtn)
    restartQuizBtn.onclick = () =>
      initQuizEngine("phase1", loadQuestionUI, showQuizResults);
  if (nextQuizBtn)
    nextQuizBtn.onclick = () => advanceQuiz(loadQuestionUI, showQuizResults);

  // Acciones del modal de Simulación de Pago
  const modalClose = document.getElementById("modal-close-btn");
  const modalConfirm = document.getElementById("modal-confirm-btn");

  if (modalClose) {
    modalClose.onclick = () => {
      const modal = document.getElementById("checkout-modal");
      modal.classList.add("opacity-0");
      setTimeout(() => modal.classList.add("hidden"), 300);
    };
  }

  if (modalConfirm) {
    modalConfirm.onclick = () => {
      const modal = document.getElementById("checkout-modal");
      modal.classList.add("opacity-0");
      setTimeout(() => modal.classList.add("hidden"), 300);
      showToast(
        "🎉 Pago de simulación procesado. ¡Tu cuenta premium ha sido activada!",
        "success",
      );
    };
  }
}

// --- CALLBACKS DE RENDERIZADO DE MÓDULOS ---

// Renderizar contenido activo en la Ficha
function renderActiveCard(card, current, total) {
  const frontWord = document.getElementById("card-english");
  const frontDetail = document.getElementById("card-english-detail");
  const backWord = document.getElementById("card-spanish");
  const backPron = document.getElementById("card-pronunciation");
  const backExp = document.getElementById("card-explanation");
  const progressText = document.getElementById("card-progress");

  if (frontWord) frontWord.innerText = card.eng;
  if (frontDetail) frontDetail.innerText = card.engDetail;
  if (backWord) backWord.innerText = card.esp;
  if (backPron) backPron.innerText = card.pron;
  if (backExp) backExp.innerText = card.exp;
  if (progressText) progressText.innerText = `${current} / ${total}`;

  const speakBtn = document.getElementById("card-speak-btn");
  if (speakBtn) {
    speakBtn.onclick = (e) => {
      e.stopPropagation(); // Evita que se gire la tarjeta al hacer clic en el botón de audio
      playTTS(card.esp);
    };
  }
}

// Renderizar pregunta activa en el Examen Diagnóstico
function loadQuestionUI(q, count, total, score) {
  document.getElementById("quiz-setup").classList.add("hidden");
  document.getElementById("quiz-results").classList.add("hidden");
  document.getElementById("quiz-game").classList.remove("hidden");
  document.getElementById("quiz-feedback").classList.add("hidden");
  document.getElementById("quiz-next-btn").classList.add("hidden");

  document.getElementById("quiz-count").innerText =
    `Pregunta ${count} de ${total}`;
  document.getElementById("quiz-score").innerText = score;
  document.getElementById("quiz-q-category").innerText = q.category;
  document.getElementById("quiz-question").innerText = q.question;

  const optContainer = document.getElementById("quiz-options");
  optContainer.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className =
      "w-full text-left p-4 rounded-xl border border-teal-100 text-xs sm:text-sm flex justify-between items-center bg-white/80 hover:border-teal-400 hover:bg-teal-50/20 transition-all quiz-opt-btn";
    btn.innerHTML = `
            <span class="pr-3 text-slate-700 font-medium">${opt.text}</span>
            <span class="w-4 h-4 rounded-full border border-teal-200 flex-shrink-0"></span>
        `;

    btn.onclick = () => {
      const res = checkAnswer(idx);

      // Desactivar todos los botones para evitar doble clic
      document
        .querySelectorAll(".quiz-opt-btn")
        .forEach((b) => (b.disabled = true));

      // Mostrar bloque de feedback explicativo
      const feedbackBox = document.getElementById("quiz-feedback");
      feedbackBox.classList.remove("hidden");
      feedbackBox.className = res.correct
        ? "p-4 rounded-xl border bg-emerald-50/70 border-emerald-200 text-emerald-950 flex flex-col space-y-1 text-xs"
        : "p-4 rounded-xl border bg-red-50/70 border-red-200 text-red-950 flex flex-col space-y-1 text-xs";

      feedbackBox.innerHTML = `
                <p class="font-bold text-sm flex items-center">
                    <i class="fa-solid ${res.correct ? "fa-circle-check text-emerald-600" : "fa-circle-xmark text-red-650"} mr-2"></i>
                    ${res.correct ? "¡Correcto!" : "Incorrecto"}
                </p>
                <p class="text-xs mt-1 leading-relaxed">${res.explanation}</p>
            `;

      // Mostrar botón para avanzar a la siguiente pregunta
      document.getElementById("quiz-next-btn").classList.remove("hidden");
      document.getElementById("quiz-score").innerText = res.score;
    };
    optContainer.appendChild(btn);
  });

  // Actualizar barra de progreso del examen
  document.getElementById("quiz-progress-bar").style.width =
    `${((count - 1) / total) * 100}%`;
}

// Mostrar resultados al finalizar el examen e integrar record de puntuación
function showQuizResults(score, total) {
  document.getElementById("quiz-game").classList.add("hidden");
  document.getElementById("quiz-results").classList.remove("hidden");
  document.getElementById("result-score").innerText = `${score} / ${total}`;
  document.getElementById("quiz-progress-bar").style.width = `100%`;

  // Detectar fase activa actual y actualizar récord personal
  const activePhase =
    activeLessonIndex <= 1
      ? "phase1"
      : activeLessonIndex <= 3
        ? "phase2"
        : "phase3";
  if (score > userProgress.quizHighScores[activePhase]) {
    userProgress.quizHighScores[activePhase] = score;
    saveUserProgress();
    showToast(
      `🏆 ¡Nuevo récord en el test de la ${activePhase.toUpperCase()}!`,
      "success",
    );
  }
}

// Abrir portal modal simulador de pasarela de pago (Stripe Sandbox)
function openCheckoutModal(key) {
  const modal = document.getElementById("checkout-modal");
  if (!modal) return;

  document.getElementById("modal-plan-title").innerText =
    key === "self-study" ? "6-Month Self-Study" : "6-Month Tutor Track";
  document.getElementById("modal-price-display").innerText =
    key === "self-study"
      ? isAnnual
        ? "$23/mes"
        : "$29/mes"
      : isAnnual
        ? "$119/mes"
        : "$149/mes";

  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.remove("opacity-0"), 10);
}

// Invocador de Notificaciones Premium (Toast)
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const msgSpan = document.getElementById("toast-msg");
  const icon = document.getElementById("toast-icon");

  if (!toast || !msgSpan) return;

  msgSpan.innerText = message;

  // Configurar íconos según tipo
  if (type === "success") {
    icon.className = "fa-solid fa-circle-check text-emerald-400";
  } else if (type === "error") {
    icon.className = "fa-solid fa-circle-xmark text-red-400";
  } else {
    icon.className = "fa-solid fa-circle-info text-cyan-400";
  }

  toast.classList.remove("translate-y-28", "opacity-0");
  setTimeout(() => {
    toast.classList.add("translate-y-28", "opacity-0");
  }, 3000);
}
