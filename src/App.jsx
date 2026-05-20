import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./ENTRY/LandingPage";
import I707Login from "./I707APP/auth/I707Login";
import I707Register from "./I707APP/auth/I707Register";
import I707Home from "./I707APP/home/I707Home";
import I707Profile from "./I707APP/profile/I707Profile";
import I707Writing from "./I707APP/writing/I707Writing";
import I707Vocabulary from "./I707APP/vocabulary/I707Vocabulary";
import I707MyWords from "./I707APP/vocabulary/I707MyWords";
import I707Games from "./I707APP/games/I707Games";
import WordMatch from "./I707APP/games/WordMatch";
import FlashCards from "./I707APP/games/FlashCards";
import MakeSentence from "./I707APP/games/MakeSentence";
import FillBlank from "./I707APP/games/FillBlank";
import WordScramble from "./I707APP/games/WordScramble";
import KenzoLogin from "./M24KENZO/auth/KenzoLogin";
import KenzoRegister from "./M24KENZO/auth/KenzoRegister";
import KenzoHome from "./M24KENZO/home/KenzoHome";

import AIVocabGame from "./I707APP/games/AIVocabGame";

import I707Leaderboard from "./I707APP/games/I707Leaderboard";


import I707Shorts from "./I707APP/shorts/I707Shorts";



export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        
        <Route path="/" element={<LandingPage />} />
        <Route path="/i707/login" element={<I707Login />} />
        <Route path="/i707/register" element={<I707Register />} />
        <Route path="/i707/home" element={<I707Home />} />
        <Route path="/i707/profile" element={<I707Profile />} />
        <Route path="/i707/writing" element={<I707Writing />} />
        <Route path="/i707/vocabulary" element={<I707Vocabulary />} />
        <Route path="/i707/mywords" element={<I707MyWords />} />
        <Route path="/i707/games" element={<I707Games />} />
        <Route path="/i707/games/wordmatch" element={<WordMatch />} />
        <Route path="/i707/games/flashcards" element={<FlashCards />} />
        <Route path="/i707/games/makesentence" element={<MakeSentence />} />
        <Route path="/i707/games/fillblank" element={<FillBlank />} />
        <Route path="/i707/games/scramble" element={<WordScramble />} />
        <Route path="/m24kenzo/login" element={<KenzoLogin />} />
        <Route path="/m24kenzo/register" element={<KenzoRegister />} />
        <Route path="/m24kenzo/home" element={<KenzoHome />} />

        <Route path="/i707/games/aivocab" element={<AIVocabGame />} />

        
        <Route path="/i707/shorts" element={<I707Shorts />} />


        <Route path="/i707/games/leaderboard" element={<I707Leaderboard />} />




        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}