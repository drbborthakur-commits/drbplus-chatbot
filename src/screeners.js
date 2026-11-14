// Standard screening questionnaires (PHQ-9, GAD-7: Pfizer, free to use; AUDIT: WHO).
const FREQ = ["Not at all", "Several days", "More than half the days", "Nearly every day"];
const FREQ5 = ["Never", "Less than monthly", "Monthly", "Weekly", "Daily or almost daily"];

export const SCREENERS = [
  {
    id: "phq9", name: "PHQ-9", topic: "Depression / low mood",
    stem: "Over the last 2 weeks, how often have you been bothered by:",
    items: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things, such as reading the newspaper or watching television",
      "Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual",
      "Thoughts that you would be better off dead, or of hurting yourself in some way",
    ].map((text) => ({ text, options: FREQ.map((label, score) => ({ label, score })) })),
    bands: [[0, 4, "Minimal"], [5, 9, "Mild"], [10, 14, "Moderate"], [15, 19, "Moderately severe"], [20, 27, "Severe"]],
    max: 27, consultFrom: 10,
    safety: (answers) => answers[8] > 0,
  },
  {
    id: "gad7", name: "GAD-7", topic: "Anxiety / worry",
    stem: "Over the last 2 weeks, how often have you been bothered by:",
    items: [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid, as if something awful might happen",
    ].map((text) => ({ text, options: FREQ.map((label, score) => ({ label, score })) })),
    bands: [[0, 4, "Minimal"], [5, 9, "Mild"], [10, 14, "Moderate"], [15, 21, "Severe"]],
    max: 21, consultFrom: 10,
  },
  {
    id: "audit", name: "AUDIT", topic: "Alcohol use",
    stem: "About your drinking. One standard drink ≈ 1 small peg (30 ml) of whisky/rum, or 1 small bottle (330 ml) of beer.",
    items: [
      { text: "How often do you have a drink containing alcohol?",
        options: ["Never", "Monthly or less", "2–4 times a month", "2–3 times a week", "4 or more times a week"].map((label, score) => ({ label, score })) },
      { text: "How many drinks containing alcohol do you have on a typical day when you are drinking?", skipIfNever: true,
        options: ["1 or 2", "3 or 4", "5 or 6", "7 to 9", "10 or more"].map((label, score) => ({ label, score })) },
      { text: "How often do you have six or more drinks on one occasion?", skipIfNever: true },
      { text: "How often during the last year have you found that you were not able to stop drinking once you had started?", skipIfNever: true },
      { text: "How often during the last year have you failed to do what was normally expected of you because of drinking?", skipIfNever: true },
      { text: "How often during the last year have you needed a first drink in the morning to get yourself going after a heavy drinking session?", skipIfNever: true },
      { text: "How often during the last year have you had a feeling of guilt or remorse after drinking?", skipIfNever: true },
      { text: "How often during the last year have you been unable to remember what happened the night before because you had been drinking?", skipIfNever: true },
      { text: "Have you or someone else been injured as a result of your drinking?",
        options: [["No", 0], ["Yes, but not in the last year", 2], ["Yes, during the last year", 4]].map(([label, score]) => ({ label, score })) },
      { text: "Has a relative, friend, doctor or other health worker been concerned about your drinking or suggested you cut down?",
        options: [["No", 0], ["Yes, but not in the last year", 2], ["Yes, during the last year", 4]].map(([label, score]) => ({ label, score })) },
    ].map((it) => ({ ...it, options: it.options || FREQ5.map((label, score) => ({ label, score })) })),
    bands: [[0, 7, "Low risk"], [8, 15, "Hazardous drinking"], [16, 19, "Harmful drinking"], [20, 40, "Possible alcohol dependence"]],
    max: 40, consultFrom: 8,
  },
];

export function bandFor(s, total) {
  const b = s.bands.find(([lo, hi]) => total >= lo && total <= hi);
  return b ? b[2] : "";
}
