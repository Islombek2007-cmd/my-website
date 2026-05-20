import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { db } from "../../firebase/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import "./I707MyWords.css";

export default function I707MyWords() {
  const navigate = useNavigate();
  const { user, userData, loading } = useUser();
  const [myWords, setMyWords] = useState([]);
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [uzbek, setUzbek] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("noun");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isDay] = useState(() => localStorage.getItem("i707_theme") === "light");

  useEffect(() => {
    if (!loading && !user) navigate("/i707/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchWords();
  }, [user]);

  const fetchWords = async () => {
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "myWords"));
      setMyWords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.log("Error:", e);
    }
  };

  const handleSave = async () => {
    if (!word.trim() || !definition.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "users", user.uid, "myWords"), {
        word: word.trim(),
        definition: definition.trim(),
        example: example.trim(),
        uzbek: uzbek.trim(),
        partOfSpeech,
        createdAt: new Date().toISOString(),
      });
      setWord("");
      setDefinition("");
      setExample("");
      setUzbek("");
      setPartOfSpeech("noun");
      setShowForm(false);
      setSaveMsg("Word saved successfully.");
      setTimeout(() => setSaveMsg(""), 2500);
      fetchWords();
    } catch (e) {
      setSaveMsg("Failed to save word.");
      setTimeout(() => setSaveMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "users", user.uid, "myWords", id));
      setMyWords(prev => prev.filter(w => w.id !== id));
      setSelectedWord(null);
    } catch (e) {
      console.log("Error deleting:", e);
    } finally {
      setDeleting(null);
    }
  };

  if (loading || !userData) return (
    <div style={{ background: "#1A1A1A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#F5F0E8", fontSize: "14px", letterSpacing: "3px" }}>
      Loading...
    </div>
  );

  return (
    <div className={`i707-mywords ${isDay ? "light" : ""}`}>
      <div className="i707-mywords-orb i707-mywords-orb--top" />
      <div className="i707-mywords-orb i707-mywords-orb--bottom" />

      {/* TOPBAR */}
      <header className="i707-mywords-topbar">
        <button className="i707-mywords-back" onClick={() => navigate("/i707/vocabulary")}>← Vocabulary</button>
        <div className="i707-mywords-topbar__center">
          <span className="i707-mywords-topbar__title">My Words</span>
        </div>
        <span className="i707-mywords-count">{myWords.length}</span>
      </header>

      <main className="i707-mywords-main">

        {/* HERO */}
        <div className="i707-mywords-hero">
          <div className="i707-mywords-hero__topbar" />
          <div className="i707-mywords-hero__shimmer" />
          <div className="i707-mywords-hero__dots" />
          <div className="i707-mywords-hero__content">
            <span className="i707-mywords-hero__eyebrow">Personal Collection</span>
            <h2 className="i707-mywords-hero__title">My <em>Word Bank</em></h2>
            <p className="i707-mywords-hero__sub">Build your personal vocabulary collection.</p>
          </div>
        </div>

        {/* ADD BUTTON */}
        {!showForm && (
          <div className="i707-mywords-add-wrap">
            <button className="i707-mywords-add-btn" onClick={() => setShowForm(true)}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3v10M3 8h10"/>
              </svg>
              Add New Word
            </button>
          </div>
        )}

        {/* ADD FORM */}
        {showForm && (
          <div className="i707-mywords-form">
            <div className="i707-mywords-form__topbar" />
            <h3 className="i707-mywords-form__title">New Word</h3>

            <div className="i707-mywords-form__group">
              <label>Word *</label>
              <input
                value={word}
                onChange={e => setWord(e.target.value)}
                placeholder="e.g. Eloquent"
              />
            </div>

            <div className="i707-mywords-form__group">
              <label>Part of Speech</label>
              <select value={partOfSpeech} onChange={e => setPartOfSpeech(e.target.value)}>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="phrase">Phrase</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="i707-mywords-form__group">
              <label>Definition *</label>
              <textarea
                value={definition}
                onChange={e => setDefinition(e.target.value)}
                placeholder="What does this word mean?"
                rows={2}
              />
            </div>

            <div className="i707-mywords-form__group">
              <label>Example Sentence</label>
              <input
                value={example}
                onChange={e => setExample(e.target.value)}
                placeholder="Use it in a sentence..."
              />
            </div>

            <div className="i707-mywords-form__group">
              <label>Uzbek Translation</label>
              <input
                value={uzbek}
                onChange={e => setUzbek(e.target.value)}
                placeholder="O'zbek tarjimasi..."
              />
            </div>

            {saveMsg && <p className="i707-mywords-form__msg">{saveMsg}</p>}

            <div className="i707-mywords-form__actions">
              <button
                className="i707-mywords-form__save"
                onClick={handleSave}
                disabled={saving || !word.trim() || !definition.trim()}
              >
                {saving ? "Saving..." : "Save Word"}
              </button>
              <button className="i707-mywords-form__cancel" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* WORDS LIST */}
        <div className="i707-mywords-list">
          {myWords.length === 0 ? (
            <div className="i707-mywords-empty">
              <div className="i707-mywords-empty__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </div>
              <p className="i707-mywords-empty__title">No words yet</p>
              <p className="i707-mywords-empty__sub">Add your first word to start building your collection.</p>
            </div>
          ) : (
            myWords.map((w, i) => (
              <div key={w.id} className="i707-mywords-card" onClick={() => setSelectedWord(w)}>
                <div className="i707-mywords-card__accent" />
                <div className="i707-mywords-card__left">
                  <span className="i707-mywords-card__word">{w.word}</span>
                  <span className="i707-mywords-card__pos">{w.partOfSpeech}</span>
                  <p className="i707-mywords-card__def">{w.definition}</p>
                </div>
                <div className="i707-mywords-card__badge">Mine</div>
              </div>
            ))
          )}
        </div>

      </main>

      {/* WORD DETAIL MODAL */}
      {selectedWord && (
        <div className="i707-mywords-modal-overlay" onClick={() => setSelectedWord(null)}>
          <div className="i707-mywords-modal" onClick={e => e.stopPropagation()}>
            <div className="i707-mywords-modal__topbar" />
            <div className="i707-mywords-modal__shimmer" />
            <button className="i707-mywords-modal__close" onClick={() => setSelectedWord(null)}>✕</button>

            <span className="i707-mywords-modal__pos">{selectedWord.partOfSpeech}</span>
            <h2 className="i707-mywords-modal__word">{selectedWord.word}</h2>
            {selectedWord.uzbek && (
              <p className="i707-mywords-modal__uzbek">{selectedWord.uzbek}</p>
            )}

            <div className="i707-mywords-modal__divider">
              <div className="i707-mywords-modal__divider-line" />
              <div className="i707-mywords-modal__divider-diamond" />
              <div className="i707-mywords-modal__divider-line" />
            </div>

            <div className="i707-mywords-modal__section">
              <span className="i707-mywords-modal__label">Definition</span>
              <p className="i707-mywords-modal__text">{selectedWord.definition}</p>
            </div>

            {selectedWord.example && (
              <div className="i707-mywords-modal__section">
                <span className="i707-mywords-modal__label">Example</span>
                <p className="i707-mywords-modal__text i707-mywords-modal__example">"{selectedWord.example}"</p>
              </div>
            )}

            <button
              className="i707-mywords-modal__delete-btn"
              onClick={() => handleDelete(selectedWord.id)}
              disabled={deleting === selectedWord.id}
            >
              {deleting === selectedWord.id ? "Deleting..." : "Delete Word"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}