import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "../firebase/firebase";

const FIELD_MAP = {
  vocabulary: "learnedWords",
  grammar: "learnedGrammar",
  writing: "learnedWriting",
};

const STORAGE_KEY = {
  vocabulary: "i707_learned_words",
  grammar: "i707_learned_grammar",
  writing: "i707_learned_writing",
};

export async function markAsLearned(user, userData, type, itemId, coinsReward = 2) {
  if (!user || !userData || !itemId) return false;
  const field = FIELD_MAP[type];
  if (!field) return false;
  
  const existing = userData[field] || [];
  if (existing.includes(itemId)) return false;
  
  try {
    const updates = {
      [field]: arrayUnion(itemId),
      coins: increment(coinsReward),
      lastActiveDate: new Date().toISOString(),
    };
    if (type === "vocabulary") updates.wordsLearned = increment(1);
    
    await updateDoc(doc(db, "users", user.uid), updates);
    
    const storageKey = STORAGE_KEY[type];
    const cached = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!cached.includes(itemId)) {
      cached.push(itemId);
      localStorage.setItem(storageKey, JSON.stringify(cached));
    }
    return true;
  } catch (e) {
    console.error("markAsLearned error:", e);
    return false;
  }
}

export function getLearnedItems(userData, type) {
  const field = FIELD_MAP[type];
  if (!field) return [];
  const fromFirebase = userData?.[field] || [];
  const fromStorage = JSON.parse(localStorage.getItem(STORAGE_KEY[type]) || "[]");
  return [...new Set([...fromFirebase, ...fromStorage])];
}

export function isLearned(userData, type, itemId) {
  if (!itemId) return false;
  return getLearnedItems(userData, type).includes(itemId);
}

export function getLearnedWords(userData, allWords, level) {
  if (!userData || !allWords || !Array.isArray(allWords)) return [];
  const learnedIds = getLearnedItems(userData, "vocabulary");

  return allWords.filter(w => {
    const prefixedId = `${level}_${w.word}`;
    return learnedIds.includes(prefixedId);
  });
}

export function getLearnedGrammar(userData, allGrammar) {
  if (!userData || !allGrammar || !Array.isArray(allGrammar)) return [];
  const learnedIds = getLearnedItems(userData, "grammar");
  return allGrammar.filter(g => {
    const id = g.id || g.title;
    return learnedIds.includes(id);
  });
}

export function getLearnedWriting(userData, allWriting) {
  if (!userData || !allWriting || !Array.isArray(allWriting)) return [];
  const learnedIds = getLearnedItems(userData, "writing");
  return allWriting.filter(w => {
    const id = w.id || w.topic;
    return learnedIds.includes(id);
  });
}

export function clearLearnedCache() {
  Object.values(STORAGE_KEY).forEach(key => localStorage.removeItem(key));
}