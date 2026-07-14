// --- ORQUESTADOR PRINCIPAL DEL PORTAL (APP.JS) ---

// controller.js
import * as model from "./model.js";
import navigationView from "./views/navigationView.js";
import activeClassView from "./views/activeClassView.js";
import flashcardsView from "./views/flashcardsView.js";
// Import other views...

const controlViewSwitch = function (targetView) {
  // 1. Update state
  model.updateActiveView(targetView);

  // 2. UI Update: Highlight active menu tab
  navigationView.updateActiveTab(model.state.currentView);

  // 3. Render correct view container
  if (targetView === "activeClass") {
    activeClassView.render(model.state.courseData);
  }

  if (targetView === "flashcards") {
    flashcardsView.render(model.state.courseData);
  }

  // Add other routing switches here...
};

// Application entry point
const init = function () {
  // Subscriber: Connects navigation actions to the controller handler
  navigationView.addHandlerRender(controlViewSwitch);

  // Set initial view state
  controlViewSwitch(model.state.currentView);
};

init();
