
import { useEffect, useState } from "react";
import { GameLevelManager, TOTAL_GAME_LEVELS } from "../services/GameLevelManager.js";
import { GameLevelHeader } from "../components/common/GameLevelHeader.js";

type WordQuestion = {
  level: number;
  word: string;
  hint: string;
  emoji: string;
  category: string;
};

// Exactly 30 Progressive Levels scaling from 3-letter to 8-letter words
const LEVEL_WORDS: WordQuestion[] = [
  // Tier 1 (Levels 1-6): 3-Letter Words
  { level: 1, word: "CAT", hint: "A friendly pet that purrs gently.", emoji: "🐱", category: "Animals" },
  { level: 2, word: "SUN", hint: "Bright light in the morning sky.", emoji: "☀️", category: "Nature" },
  { level: 3, word: "TEA", hint: "A warm soothing cup of Assam tea.", emoji: "☕", category: "Daily life" },
  { level: 4, word: "CUP", hint: "Something you hold to drink from.", emoji: "🥛", category: "Objects" },
  { level: 5, word: "DOG", hint: "A loyal and faithful companion.", emoji: "🐶", category: "Animals" },
  { level: 6, word: "COW", hint: "An animal that gives us fresh milk.", emoji: "🐄", category: "Animals" },

  // Tier 2 (Levels 7-12): 4-Letter Words
  { level: 7, word: "BIRD", hint: "A feathered friend that chirps in trees.", emoji: "🐦", category: "Nature" },
  { level: 8, word: "FISH", hint: "Swims peacefully in clean rivers.", emoji: "🐟", category: "Animals" },
  { level: 9, word: "MOON", hint: "Glows gently in the night sky.", emoji: "🌙", category: "Nature" },
  { level: 10, word: "BOAT", hint: "Floats across rivers and lakes.", emoji: "🛶", category: "Travel" },
  { level: 11, word: "RICE", hint: "A wholesome staple food in every meal.", emoji: "🍚", category: "Food" },
  { level: 12, word: "LEAF", hint: "Fresh green part of a plant.", emoji: "🌿", category: "Nature" },

  // Tier 3 (Levels 13-18): 5-Letter Words
  { level: 13, word: "APPLE", hint: "A crunchy sweet fruit, red or green.", emoji: "🍎", category: "Fruits" },
  { level: 14, word: "MANGO", hint: "A fragrant, golden tropical fruit.", emoji: "🥭", category: "Fruits" },
  { level: 15, word: "WATER", hint: "Cool fresh water essential for health.", emoji: "💧", category: "Daily life" },
  { level: 16, word: "HOUSE", hint: "A peaceful home where family resides.", emoji: "🏠", category: "Daily life" },
  { level: 17, word: "CLOCK", hint: "An object that shows the time of day.", emoji: "🕒", category: "Objects" },
  { level: 18, word: "CHAIR", hint: "A comfortable seat to rest on.", emoji: "🪑", category: "Objects" },

  // Tier 4 (Levels 19-24): 6-Letter Words
  { level: 19, word: "BANANA", hint: "A sweet yellow fruit easy to peel.", emoji: "🍌", category: "Fruits" },
  { level: 20, word: "ORANGE", hint: "A round citrus fruit bursting with juice.", emoji: "🍊", category: "Fruits" },
  { level: 21, word: "FLOWER", hint: "A colourful, scented blossom.", emoji: "🌸", category: "Nature" },
  { level: 22, word: "GARDEN", hint: "A green space where flowers grow.", emoji: "🌷", category: "Nature" },
  { level: 23, word: "FRIEND", hint: "Someone special we enjoy sharing moments with.", emoji: "🤝", category: "People" },
  { level: 24, word: "FAMILY", hint: "Loved ones who support and care for each other.", emoji: "👨‍👩‍👧", category: "People" },

  // Tier 5 (Levels 25-30): 7-8 Letter Words
  { level: 25, word: "COCONUT", hint: "A sturdy palm fruit with sweet cooling water.", emoji: "🥥", category: "Food" },
  { level: 26, word: "MORNING", hint: "The calm early start of a new day.", emoji: "🌅", category: "Daily life" },
  { level: 27, word: "RAINBOW", hint: "Beautiful vibrant arch in the sky after rain.", emoji: "🌈", category: "Nature" },
  { level: 28, word: "ELEPHANT", hint: "A magnificent gentle animal of the forest.", emoji: "🐘", category: "Animals" },
  { level: 29, word: "HOSPITAL", hint: "A place for healing, doctors, and wellness.", emoji: "🏥", category: "Health" },
  { level: 30, word: "UMBRELLA", hint: "Keeps you dry and shaded from rain and sun.", emoji: "☂️", category: "Objects" },
];

type LetterTile = {
  id: number;
  letter: string;
};

const STORAGE_KEY = "witty-words-game-progress";

function shuffle<T,>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function scrambleWord(word: string): LetterTile[] {
  const original = word.split("").map((letter, id) => ({ id, letter }));
  let scrambled = shuffle(original);

  // Ensure the letters are not already in the answer order.
  if (scrambled.map((tile) => tile.letter).join("") === word) {
    scrambled = [...scrambled.slice(1), scrambled[0]];
  }

  return scrambled;
}

export default function WittyWords() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [tiles, setTiles] = useState<LetterTile[]>([]);
  const [answerIds, setAnswerIds] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState("Tap the letters in the correct order.");
  const [gamesCompleted, setGamesCompleted] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const currentQuestion = LEVEL_WORDS[(currentLevel - 1) % LEVEL_WORDS.length];
  const usedIds = new Set(answerIds);
  const availableTiles = tiles.filter((tile) => !usedIds.has(tile.id));
  const progress = Math.round((currentLevel / TOTAL_GAME_LEVELS) * 100);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setGamesCompleted(data.gamesCompleted ?? 0);
        setBestScore(data.bestScore ?? 0);
      }
    } catch {
      // Local storage is optional.
    }

    const savedLvl = GameLevelManager.getGameLevel('wittyWords');
    startLevel(savedLvl);
    // Initialise once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speak(text: string) {
    if (
      voiceEnabled &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  function startLevel(lvl = currentLevel) {
    const safeLvl = Math.max(1, Math.min(TOTAL_GAME_LEVELS, lvl));
    const targetQ = LEVEL_WORDS[(safeLvl - 1) % LEVEL_WORDS.length];

    setCurrentLevel(safeLvl);
    GameLevelManager.saveGameLevel('wittyWords', safeLvl);
    setTiles(scrambleWord(targetQ.word));
    setAnswerIds([]);
    setAnswered(false);
    setShowHint(false);
    setFinished(false);
    setMessage("Tap the letters in the correct order.");

    speak(`Level ${safeLvl}. Arrange the letters to spell ${targetQ.word.length} letters.`);
  }

  function selectLetter(id: number) {
    if (answered || finished || answerIds.includes(id)) return;

    const nextIds = [...answerIds, id];
    setAnswerIds(nextIds);

    const nextWord = nextIds
      .map((tileId) => tiles.find((tile) => tile.id === tileId)?.letter ?? "")
      .join("");

    if (nextWord.length === currentQuestion.word.length) {
      if (nextWord === currentQuestion.word) {
        setAnswered(true);
        setScore((previous) => previous + 1);
        GameLevelManager.completeLevel('wittyWords', currentLevel, 100);
        setMessage("Excellent! You made the correct word. 🌟");
        speak("Excellent! You made the correct word.");
      } else {
        setMessage("Good try! You can remove a letter and try again.");
        speak("Good try. You can remove a letter and try again.");
      }
    } else {
      setMessage("Good! Keep choosing the letters.");
    }
  }

  function removeLetter(id: number) {
    if (answered || finished) return;

    setAnswerIds((current) => current.filter((tileId) => tileId !== id));
    setMessage("Choose another letter when you are ready.");
  }

  function clearAnswer() {
    if (answered || finished) return;

    setAnswerIds([]);
    setMessage("Let's try again. Tap the letters in order.");
  }

  function showLetterHint() {
    if (answered || finished || !currentQuestion) return;

    const nextPosition = answerIds.length;
    const correctLetter = currentQuestion.word[nextPosition];

    const matchingTile = availableTiles.find(
      (tile) => tile.letter === correctLetter
    );

    setHintsUsed((current) => current + 1);
    setShowHint(true);

    if (matchingTile) {
      setMessage(
        `Hint: look for the letter "${correctLetter}" next.`
      );
      speak(`Look for the letter ${correctLetter}.`);
    } else {
      setMessage("Look carefully at the letters you have selected.");
    }
  }

  function advanceNextLevel() {
    if (currentLevel < TOTAL_GAME_LEVELS) {
      startLevel(currentLevel + 1);
    } else {
      finishGame();
    }
  }

  function finishGame() {
    setFinished(true);
    GameLevelManager.completeLevel('wittyWords', currentLevel, 100);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data = saved ? JSON.parse(saved) : {};
      const total = (data.gamesCompleted ?? 0) + 1;
      const best = Math.max(data.bestScore ?? 0, score + 1);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          gamesCompleted: total,
          bestScore: best,
        })
      );

      setGamesCompleted(total);
      setBestScore(best);
    } catch {
      // Game remains playable if saving fails.
    }

    speak(`Well done! You completed level ${currentLevel}. Magnificent work!`);
  }

  function revealAnswer() {
    if (answered || finished || !currentQuestion) return;

    setAnswerIds(
      tiles
        .slice()
        .sort((a, b) => a.id - b.id)
        .map((tile) => tile.id)
    );

    setAnswered(true);
    setMessage(`The word is ${currentQuestion.word}. Let's learn it together.`);
    speak(`The word is ${currentQuestion.word}.`);
  }

  return (
    <div className="ww-app">
      <style>{`
        .ww-app {
          min-height: 100vh;
          padding: 22px 14px;
          background: linear-gradient(140deg, #f7eadf, #f8f3ed 55%, #f4e3d4);
          color: #29241f;
          font-family: Arial, Helvetica, sans-serif;
        }

        .ww-app *,
        .ww-app *::before,
        .ww-app *::after {
          box-sizing: border-box;
        }

        .ww-container {
          max-width: 850px;
          margin: 0 auto;
        }

        .ww-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .ww-header h1 {
          font-size: clamp(30px, 5vw, 42px);
          margin: 0 0 8px;
          color: #28221e;
        }

        .ww-header p {
          font-size: 17px;
          line-height: 1.6;
          color: #65564b;
          margin: 0;
        }

        .ww-card {
          background: #fff;
          border: 1px solid #ead9cb;
          border-radius: 20px;
          padding: clamp(16px, 4vw, 30px);
          margin-bottom: 18px;
          box-shadow: 0 8px 26px rgba(90, 54, 29, .07);
        }

        .ww-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .ww-app button,
        .ww-app select {
          font: inherit;
        }

        .ww-app button {
          cursor: pointer;
          min-height: 46px;
          padding: 10px 15px;
          border: 2px solid #e5cdb9;
          border-radius: 11px;
          color: #423329;
          background: #fffaf6;
          font-weight: 700;
          transition: background .15s ease;
        }

        .ww-app button:focus-visible,
        .ww-app select:focus-visible {
          outline: 3px solid #d39a42;
          outline-offset: 3px;
        }

        .ww-app button:disabled {
          cursor: default;
        }

        .ww-select {
          min-height: 44px;
          border: 2px solid #e5cdb9;
          background: #fffaf6;
          border-radius: 10px;
          padding: 8px 12px;
          color: #423329;
        }

        .ww-controls {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
        }

        .ww-label {
          display: block;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .ww-progress-track {
          height: 10px;
          background: #f0e5dc;
          border-radius: 30px;
          overflow: hidden;
          margin-bottom: 22px;
        }

        .ww-progress-bar {
          height: 100%;
          background: #ba7052;
          transition: width .2s ease;
          border-radius: inherit;
        }

        .ww-word-picture {
          text-align: center;
          margin: 10px 0 20px;
        }

        .ww-emoji {
          font-size: 72px;
          line-height: 1.3;
        }

        .ww-category {
          color: #87654e;
          font-size: 14px;
          margin-top: 4px;
        }

        .ww-instruction {
          text-align: center;
          color: #635448;
          font-size: 17px;
          line-height: 1.6;
          margin: 0 0 18px;
        }

        .ww-answer {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          min-height: 67px;
          padding: 12px;
          border: 2px dashed #e1c5af;
          background: #fffaf6;
          border-radius: 14px;
          margin: 0 auto 22px;
        }

        .ww-answer-slot {
          width: 43px;
          height: 49px;
          min-height: 49px !important;
          padding: 0 !important;
          border-radius: 8px !important;
          background: #fff !important;
          border: 2px solid #e2c9b4 !important;
          font-size: 22px;
          color: #5c3929 !important;
        }

        .ww-answer-slot.filled {
          background: #f5e5d8 !important;
          border-color: #c78c6e !important;
        }

        .ww-answer-slot:disabled {
          opacity: 1;
        }

        .ww-tiles {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin: 0 auto 20px;
        }

        .ww-tile {
          width: 55px;
          height: 59px;
          min-height: 59px !important;
          padding: 0 !important;
          font-size: 25px !important;
          background: linear-gradient(180deg, #fffdfb, #f7e7db) !important;
          border: 2px solid #d8b49b !important;
          border-radius: 12px !important;
          color: #503426 !important;
          box-shadow: 0 3px 0 #e3c9b5;
        }

        .ww-tile:disabled {
          opacity: .28;
          box-shadow: none;
        }

        .ww-hint {
          background: #fff6dd;
          border: 1px solid #e9d08d;
          border-radius: 11px;
          padding: 13px 15px;
          text-align: center;
          color: #72561c;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .ww-message {
          text-align: center;
          padding: 14px;
          border-radius: 12px;
          background: #f8eee7;
          color: #65442f;
          font-weight: 600;
          line-height: 1.6;
          margin: 16px 0;
        }

        .ww-message.success {
          background: #e8f6e8;
          color: #285c32;
          border: 1px solid #b5dcb9;
        }

        .ww-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .ww-primary {
          background: #9b543b !important;
          color: #fff !important;
          border-color: #9b543b !important;
        }

        .ww-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .ww-stat {
          padding: 14px 8px;
          text-align: center;
          background: #fff8f1;
          border: 1px solid #ead8c8;
          border-radius: 13px;
        }

        .ww-stat strong {
          display: block;
          font-size: 24px;
          color: #8e4d35;
          margin-bottom: 5px;
        }

        .ww-stat span {
          font-size: 13px;
          color: #725e50;
        }

        .ww-results {
          text-align: center;
          padding: 25px 0;
        }

        .ww-results .ww-emoji {
          font-size: 80px;
        }

        .ww-results h2 {
          font-size: 30px;
          color: #78452e;
        }

        .ww-results p {
          line-height: 1.7;
          color: #635448;
        }

        .ww-note {
          font-size: 13px;
          line-height: 1.6;
          text-align: center;
          color: #7c6d61;
          margin: 20px 0 0;
        }

        @media (max-width: 480px) {
          .ww-app {
            padding: 12px 8px;
          }

          .ww-card {
            padding: 15px 12px;
          }

          .ww-tile {
            width: 45px;
            height: 52px;
            min-height: 52px !important;
            font-size: 22px !important;
          }

          .ww-answer-slot {
            width: 36px;
            height: 43px;
            min-height: 43px !important;
            font-size: 19px;
          }

          .ww-topbar {
            font-size: 14px;
          }

          .ww-stats {
            gap: 5px;
          }

          .ww-stat strong {
            font-size: 20px;
          }

          .ww-stat span {
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ww-app *,
          .ww-app *::before,
          .ww-app *::after {
            transition: none !important;
          }
        }
      `}</style>

      <div className="ww-container">
        <header className="ww-header">
          <h1>Witty Words</h1>
          <p>
            Arrange the letters to make a word.
            <br />
            Take your time and enjoy!
          </p>
        </header>

        <div style={{ marginBottom: 16 }}>
          <GameLevelHeader
            gameId="wittyWords"
            currentLevel={currentLevel}
            onSelectLevel={(lvl) => startLevel(lvl)}
            gameTitle="Witty Words"
          />
        </div>

        {!finished && currentQuestion && (
          <section className="ww-card">
            <div className="ww-topbar">
              <span>
                Target Word: <strong>{currentQuestion.word.length} Letters</strong>
              </span>
              <span>Category: <strong>{currentQuestion.category}</strong></span>
            </div>

            <div className="ww-controls" style={{ justifyContent: "flex-end", marginBottom: 12 }}>
              <button
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);

                  if (!next) {
                    window.speechSynthesis?.cancel();
                  } else {
                    const utterance = new SpeechSynthesisUtterance(
                      "Voice guidance is now on."
                    );
                    window.speechSynthesis?.speak(utterance);
                  }
                }}
              >
                {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
              </button>
            </div>

            <div className="ww-progress-track">
              <div
                className="ww-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="ww-word-picture">
              <div className="ww-emoji" role="img" aria-label={currentQuestion.category}>
                {currentQuestion.emoji}
              </div>
              <div className="ww-category">{currentQuestion.category}</div>
            </div>

            <p className="ww-instruction">
              Arrange these letters to make a word.
              <br />
              Tap each letter in the correct order.
            </p>

            <div className="ww-answer" aria-label="Your word">
              {Array.from(
                { length: currentQuestion.word.length },
                (_, index) => {
                  const id = answerIds[index];
                  const tile = tiles.find((item) => item.id === id);

                  return (
                    <button
                      key={index}
                      className={`ww-answer-slot ${tile ? "filled" : ""}`}
                      onClick={() => tile && removeLetter(tile.id)}
                      disabled={!tile || answered}
                      aria-label={
                        tile
                          ? `Remove letter ${tile.letter}`
                          : `Empty letter position ${index + 1}`
                      }
                    >
                      {tile?.letter ?? ""}
                    </button>
                  );
                }
              )}
            </div>

            <div className="ww-tiles" aria-label="Available letters">
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  className="ww-tile"
                  onClick={() => selectLetter(tile.id)}
                  disabled={usedIds.has(tile.id) || answered}
                  aria-label={`Letter ${tile.letter}`}
                >
                  {tile.letter}
                </button>
              ))}
            </div>

            {showHint && !answered && (
              <div className="ww-hint">
                <strong>Hint:</strong> {currentQuestion.hint}
                <br />
                The word starts with{" "}
                <strong>{currentQuestion.word[0]}</strong>.
              </div>
            )}

            {message && (
              <div
                className={`ww-message ${answered ? "success" : ""}`}
                role="status"
                aria-live="polite"
              >
                {message}
              </div>
            )}

            <div className="ww-actions">
              {!answered && (
                <>
                  <button onClick={clearAnswer}>Clear Letters</button>
                  <button onClick={showLetterHint}>💡 Hint</button>
                  <button onClick={revealAnswer}>Show Answer</button>
                </>
              )}

              {answered && (
                <button className="ww-primary" onClick={advanceNextLevel}>
                  {currentLevel < TOTAL_GAME_LEVELS
                    ? `Next Level (Level ${currentLevel + 1}) →`
                    : "Finish All Levels 🏆"}
                </button>
              )}

              <button onClick={() => startLevel(currentLevel)}>
                ↻ Restart Level
              </button>
            </div>

            <p className="ww-note">
              Tip: If a letter is in the wrong position, tap it in the answer
              row to return it to the letter tray.
            </p>
          </section>
        )}

        {finished && (
          <section className="ww-card ww-results">
            <div className="ww-emoji">🎉</div>
            <h2>Level {currentLevel} Mastered!</h2>
            <p>You have successfully arranged the letters to spell the word.</p>

            <div className="ww-stat">
              <strong>Level {currentLevel}</strong>
              <span>Tier Completed</span>
            </div>

            <p>
              Every level strengthens language recall and motor coordination.
            </p>

            <div className="ww-actions">
              {currentLevel < TOTAL_GAME_LEVELS ? (
                <button
                  className="ww-primary"
                  onClick={() => startLevel(currentLevel + 1)}
                >
                  Next Level (Level {currentLevel + 1}) →
                </button>
              ) : (
                <button
                  className="ww-primary"
                  onClick={() => startLevel(1)}
                >
                  Restart From Level 1 🏆
                </button>
              )}
              <button onClick={() => startLevel(currentLevel)}>
                Replay Level {currentLevel}
              </button>
            </div>
          </section>
        )}

        <section className="ww-card">
          <h2 style={{ textAlign: "center", color: "#78452e" }}>
            Your Progress
          </h2>

          <div className="ww-stats">
            <div className="ww-stat">
              <strong>{gamesCompleted}</strong>
              <span>Games completed</span>
            </div>
            <div className="ww-stat">
              <strong>{bestScore}</strong>
              <span>Best score</span>
            </div>
            <div className="ww-stat">
              <strong>{hintsUsed}</strong>
              <span>Hints this game</span>
            </div>
          </div>

          <p className="ww-note">
            Progress is stored locally in this browser. This activity supports
            engagement and is not a medical diagnostic test.
          </p>
        </section>
      </div>
    </div>
  );
}
