export const GRAMMAR_GRADUATION = {
  IELTS_GRADUATION: [
    {
      title: "Advanced Passive Constructions",
      explanation: "Complex passive forms used in academic writing, including perfect passive and modal passive.",
      examples: ["It has been argued that...", "The results could be attributed to..."],
      quiz: [
        { question: "Choose the correct form:", options: ["It has argue that", "It has been argued that", "It argued that", "It is argue that"], answer: 1 },
        { question: "Complete: The findings ___ published next year.", options: ["will be", "will being", "be will", "are will"], answer: 0 },
        { question: "Which is correct?", options: ["The data were being collected", "The data was been collected", "The data been collected", "The data is been collected"], answer: 0 },
      ]
    },
    {
      title: "Hedging Language",
      explanation: "Hedging is used in academic writing to show uncertainty or caution. Essential for high band IELTS scores.",
      examples: ["It could be argued that...", "This may suggest that...", "There appears to be..."],
      quiz: [
        { question: "Which is a hedging expression?", options: ["It is definitely true", "It might be suggested", "This is always correct", "Everyone agrees that"], answer: 1 },
        { question: "Complete: The results ___ indicate a correlation.", options: ["definitely", "always", "appear to", "certainly"], answer: 2 },
        { question: "Which hedging word is weakest?", options: ["will", "must", "might", "is"], answer: 2 },
      ]
    },
    {
      title: "Nominalization",
      explanation: "Converting verbs and adjectives into nouns. This is a key feature of academic writing style.",
      examples: ["develop → development", "analyse → analysis", "significant → significance"],
      quiz: [
        { question: "Nominalize 'analyse':", options: ["analyser", "analysing", "analysis", "analysed"], answer: 2 },
        { question: "Nominalize 'significant':", options: ["significance", "signify", "signified", "significantly"], answer: 0 },
        { question: "Which sentence uses nominalization?", options: ["We developed the system.", "The development of the system was completed.", "They are developing.", "Development is good."], answer: 1 },
      ]
    },
  ],
};