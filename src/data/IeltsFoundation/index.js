// src/data/IeltsFoundation/index.js
import { IFLesson1 } from "./Lesson1/Vocabulary/IFLesson1";
import { IFLesson2 } from "./Lesson2/Vocabulary/IFLesson2";
import { IFLesson3 } from "./Lesson3/Vocabulary/IFLesson3";

export const VOCABULARY_FOUNDATION = {
  IELTS_FOUNDATION: [
    ...IFLesson1,
    ...IFLesson2,
    ...IFLesson3,
  ]
};