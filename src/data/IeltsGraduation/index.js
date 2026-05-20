// src/data/IeltsGraduation/index.js
import { IGLesson1 } from "./Lesson1/Vocabulary/IGLesson1";
import { IGLesson2 } from "./Lesson2/Vocabulary/IGLesson2";
import { IGLesson3 } from "./Lesson3/Vocabulary/IGLesson3";
import { IGLesson4 } from "./Lesson4/Vocabulary/IGLesson4";
import { IGLesson5 } from "./Lesson5/Vocabulary/IGLesson5";

export const VOCABULARY_GRADUATION = {
  IELTS_GRADUATION: [
    ...IGLesson1,
    ...IGLesson2,
    ...IGLesson3,
    ...IGLesson4,
    ...IGLesson5,
  ]
};
