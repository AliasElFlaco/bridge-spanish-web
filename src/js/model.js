// model.js
export const state = {
  currentView: "roadmap", // default view
  user: {
    name: "Carlos Pérez",
    role: "student",
  },
  activeWeek: 1,
  courseData: {
    // Suffix engines, practice vocab, etc.
  },
};

export const updateActiveView = function (viewName) {
  state.currentView = viewName;
};

export const updateActiveWeek = function (weekNum) {
  state.activeWeek = weekNum;
};
