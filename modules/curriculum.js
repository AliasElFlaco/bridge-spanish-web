export const curriculumData = {
  phases: [
    {
      id: 1,
      phaseNum: "PHASE 1",
      weeksRange: "W1 - W8",
      title: "The Accent & Foundation Bridge",
      desc: "Leverage core target features, vocabulary shifting tools, and timelines structured across months of instruction.",
    },
    {
      id: 2,
      phaseNum: "PHASE 2",
      weeksRange: "W9 - W16",
      title: "High-Speed Cognate Shifting",
      desc: "Leverage core target features, vocabulary shifting tools, and timelines structured across months of instruction.",
    },
    {
      id: 3,
      phaseNum: "PHASE 3",
      weeksRange: "W17 - W24",
      title: "Situational & Pro Mastery",
      desc: "Leverage core target features, vocabulary shifting tools, and timelines structured across months of instruction.",
    },
  ],
  months: [
    { id: 1, title: "The Accent & Foundation Bridge", weeks: [1, 2, 3, 4] },
    { id: 2, title: "Double Identity: Ser vs Estar", weeks: [5, 6, 7, 8] },
    { id: 3, title: "Cognate Shifting", weeks: [9, 10, 11, 12] },
    { id: 4, title: "Timeline Linkers", weeks: [13, 14, 15, 16] },
    { id: 5, title: "Subjunctive Mastery", weeks: [17, 18, 19, 20] },
    { id: 6, title: "Situational Mastery", weeks: [21, 22, 23, 24] },
  ],
  getVocabulary(week) {
    // Retorna 10 palabras por semana
    return [
      "Casa",
      "Mano",
      "Sol",
      "Luz",
      "Mar",
      "Pan",
      "Flor",
      "Río",
      "Pez",
      "Voz",
    ];
  },
};

export function initCurriculum() {
  console.log("Curriculum loaded with 24 weeks data.");
}
