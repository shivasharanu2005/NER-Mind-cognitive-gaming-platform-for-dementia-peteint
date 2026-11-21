
import { useEffect, useState } from "react";
import { GameLevelManager, TOTAL_GAME_LEVELS } from "../services/GameLevelManager.js";
import { GameLevelHeader } from "../components/common/GameLevelHeader.js";

type Category = "Fruits" | "Animals" | "Household" | "Regional" | "Nature";

type PictureItem = {
  id: number;
  category: Category;
  prompt: string;
  emoji: string;
  answer: string;
};

const PICTURE_ITEMS: PictureItem[] = [
  // Fruits
  { id: 1, category: "Fruits", prompt: "Find the apple", emoji: "🍎", answer: "apple" },
  { id: 2, category: "Fruits", prompt: "Find the banana", emoji: "🍌", answer: "banana" },
  { id: 3, category: "Fruits", prompt: "Which fruit is a sweet mango?", emoji: "🥭", answer: "mango" },
  { id: 4, category: "Fruits", prompt: "Find the juicy orange", emoji: "🍊", answer: "orange" },
  { id: 5, category: "Fruits", prompt: "Find the bunch of grapes", emoji: "🍇", answer: "grapes" },
  { id: 6, category: "Fruits", prompt: "Find the watermelon", emoji: "🍉", answer: "watermelon" },
  { id: 7, category: "Fruits", prompt: "Find the sweet pineapple", emoji: "🍍", answer: "pineapple" },
  { id: 8, category: "Fruits", prompt: "Find the brown coconut", emoji: "🥥", answer: "coconut" },

  // Animals
  { id: 9, category: "Animals", prompt: "Find the friendly cat", emoji: "🐱", answer: "cat" },
  { id: 10, category: "Animals", prompt: "Find the playful dog", emoji: "🐶", answer: "dog" },
  { id: 11, category: "Animals", prompt: "Which animal gives fresh milk?", emoji: "🐄", answer: "cow" },
  { id: 12, category: "Animals", prompt: "Find the singing bird", emoji: "🐦", answer: "bird" },
  { id: 13, category: "Animals", prompt: "Find the swimming fish", emoji: "🐟", answer: "fish" },
  { id: 14, category: "Animals", prompt: "Find the mighty elephant", emoji: "🐘", answer: "elephant" },
  { id: 15, category: "Animals", prompt: "Find the gentle butterfly", emoji: "🦋", answer: "butterfly" },
  { id: 16, category: "Animals", prompt: "Find the duck", emoji: "🦆", answer: "duck" },

  // Household
  { id: 17, category: "Household", prompt: "Find the chair to sit on", emoji: "🪑", answer: "chair" },
  { id: 18, category: "Household", prompt: "Find the wall clock showing time", emoji: "🕒", answer: "clock" },
  { id: 19, category: "Household", prompt: "Find the warm tea cup", emoji: "☕", answer: "tea cup" },
  { id: 20, category: "Household", prompt: "Find the door key", emoji: "🔑", answer: "key" },
  { id: 21, category: "Household", prompt: "Find the reading book", emoji: "📘", answer: "book" },
  { id: 22, category: "Household", prompt: "Find the reading spectacles", emoji: "👓", answer: "glasses" },
  { id: 23, category: "Household", prompt: "Find the rain umbrella", emoji: "☂️", answer: "umbrella" },
  { id: 24, category: "Household", prompt: "Find the clean water glass", emoji: "🥛", answer: "water glass" },

  // Regional (North East traditions & nature)
  { id: 25, category: "Regional", prompt: "Find the traditional Assam tea pot", emoji: "🫖", answer: "tea pot" },
  { id: 26, category: "Regional", prompt: "Find the bowl of warm rice", emoji: "🍚", answer: "rice bowl" },
  { id: 27, category: "Regional", prompt: "Find the beautiful pink lotus flower", emoji: "🪷", answer: "lotus flower" },
  { id: 28, category: "Regional", prompt: "Find the fresh green banana leaf", emoji: "🌿", answer: "banana leaf" },
  { id: 29, category: "Regional", prompt: "Find the melody bamboo flute", emoji: "🎋", answer: "bamboo flute" },
  { id: 30, category: "Regional", prompt: "Find the traditional earthen diya lamp", emoji: "🪔", answer: "diya lamp" },
  { id: 31, category: "Regional", prompt: "Find the river boat", emoji: "🛶", answer: "river boat" },

  // Nature
  { id: 32, category: "Nature", prompt: "Find the green shady tree", emoji: "🌳", answer: "tree" },
  { id: 33, category: "Nature", prompt: "Find the warm shining sun", emoji: "☀️", answer: "bright sun" },
  { id: 34, category: "Nature", prompt: "Find the cool rain cloud", emoji: "🌧️", answer: "rain cloud" },
  { id: 35, category: "Nature", prompt: "Find the twinkling night star", emoji: "⭐", answer: "star" },
  { id: 36, category: "Nature", prompt: "Find the morning blooming flower", emoji: "🌺", answer: "flower" },
];

type Question = {
  id: number;
  category: Category;
  prompt: string;
  emoji: string;
  answer: string;
  options: string[];
};

const STORAGE_KEY = "picture-recognition-game-progress";

function shuffle<T,>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function generateLevelQuestions(level: number, category: Category | "All"): Question[] {
  // Option count scales from 2 to 6 across the 30 levels
  let optionCount = 2;
  if (level <= 6) optionCount = 2;       // Tier 1: 2 choices
  else if (level <= 12) optionCount = 3;  // Tier 2: 3 choices
  else if (level <= 18) optionCount = 4;  // Tier 3: 4 choices
  else if (level <= 24) optionCount = 5;  // Tier 4: 5 choices
  else optionCount = 6;                  // Tier 5: 6 choices

  const pool = category === "All"
    ? PICTURE_ITEMS
    : PICTURE_ITEMS.filter((item) => item.category === category);

  const effectivePool = pool.length >= 3 ? pool : PICTURE_ITEMS;
  const chosen = shuffle(effectivePool).slice(0, 3);

  return chosen.map((target) => {
    const distractors = shuffle(PICTURE_ITEMS.filter((p) => p.answer !== target.answer))
      .slice(0, optionCount - 1)
      .map((p) => p.answer);

    const options = shuffle([target.answer, ...distractors]);

    return {
      id: target.id,
      category: target.category,
      prompt: target.prompt,
      emoji: target.emoji,
      answer: target.answer,
      options,
    };
  });
}

export default function PictureRecognitionGame({ onExit }: { onExit?: () => void } = {}) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [category, setCategory] = useState<Category | "All">("All");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const currentQuestion = questions[questionIndex];

  const progress = questions.length
    ? Math.round(
        ((questionIndex + (answered ? 1 : 0)) / questions.length) * 100
      )
    : 0;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setTotalCompleted(data.totalCompleted ?? 0);
        setBestScore(data.bestScore ?? 0);
      }
    } catch {
      // Game works even when local storage is unavailable.
    }

    const savedLvl = GameLevelManager.getGameLevel('pictureRecognition');
    startLevel(savedLvl, "All");
    // Initialize once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!answered || !currentQuestion) return;

    if (selectedAnswer === currentQuestion.answer) {
      speak("Correct! Well done.");
    } else {
      speak("Good try. Let's learn the correct answer.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered]);

  function speak(message: string) {
    if (
      voiceEnabled &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.85;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  function startLevel(lvl = currentLevel, cat: Category | "All" = category) {
    const safeLvl = Math.max(1, Math.min(TOTAL_GAME_LEVELS, lvl));
    const nextQuestions = generateLevelQuestions(safeLvl, cat);

    setCurrentLevel(safeLvl);
    GameLevelManager.saveGameLevel('pictureRecognition', safeLvl);
    setCategory(cat);
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setShowHint(false);
    setGameFinished(false);

    speak(`Level ${safeLvl}. Look at the picture and choose the matching word.`);
  }

  function chooseAnswer(option: string) {
    if (answered || !currentQuestion) return;

    setSelectedAnswer(option);
    setAnswered(true);

    if (option === currentQuestion.answer) {
      setScore((previous) => previous + 1);
    }
  }

  function nextQuestion() {
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex((previous) => previous + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setShowHint(false);
      return;
    }

    finishGame();
  }

  function finishGame() {
    const finalScore =
      score +
      (selectedAnswer === currentQuestion?.answer ? 1 : 0);

    setGameFinished(true);
    const accuracy = Math.round((finalScore / (questions.length || 1)) * 100);
    GameLevelManager.completeLevel('pictureRecognition', currentLevel, accuracy);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data = saved ? JSON.parse(saved) : {};

      const completed = (data.totalCompleted ?? 0) + 1;
      const best = Math.max(data.bestScore ?? 0, finalScore);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          totalCompleted: completed,
          bestScore: best,
        })
      );

      setTotalCompleted(completed);
      setBestScore(best);
    } catch {
      // Do not interrupt the game if saving fails.
    }

    speak(
      `Level ${currentLevel} completed. Your score is ${finalScore} out of ${questions.length}. Splendid work!`
    );
  }

  function playQuestion() {
    if (!currentQuestion) return;

    speak(
      `${currentQuestion.prompt}. Choose the correct answer.`
    );
  }

  return (
    <div className="pr-game">
      <style>{`
        .pr-game {
          min-height: 100vh;
          background: linear-gradient(180deg, #93c5f4 0%, #dcedfa 100%);
          padding: 14px;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .pr-game *,
        .pr-game *::before,
        .pr-game *::after {
          box-sizing: border-box;
        }

        .pr-panel {
          background: #fff;
          width: 100%;
          max-width: 780px;
          min-height: 535px;
          border-radius: 6px;
          padding: 30px clamp(18px, 6vw, 55px);
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .pr-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          font-size: 17px;
          font-weight: 500;
          margin-bottom: 25px;
        }

        .pr-topbar strong {
          font-weight: 700;
        }

        .pr-heading {
          margin: 0 0 8px;
          text-align: center;
          color: #243c52;
          font-size: 27px;
        }

        .pr-subtitle {
          margin: 0 0 24px;
          text-align: center;
          color: #526474;
          font-size: 16px;
          line-height: 1.5;
        }

        .pr-controls {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin: 0 auto 22px;
        }

        .pr-game button,
        .pr-game select {
          font: inherit;
        }

        .pr-game button {
          cursor: pointer;
          min-height: 44px;
          border-radius: 7px;
          background: #fff;
          border: 2px solid #c5dff4;
          color: #171717;
          padding: 9px 15px;
          font-weight: 600;
        }

        .pr-game button:focus-visible,
        .pr-game select:focus-visible {
          outline: 3px solid #e4a23b;
          outline-offset: 3px;
        }

        .pr-game button:disabled {
          cursor: default;
        }

        .pr-control-select {
          min-height: 44px;
          border: 2px solid #c5dff4;
          border-radius: 7px;
          background: white;
          padding: 8px 12px;
          color: #202020;
        }

        .pr-picture-area {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          min-height: 205px;
          margin-bottom: 20px;
        }

        .pr-picture {
          min-width: 145px;
          min-height: 145px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(100px, 18vw, 145px);
          line-height: 1.2;
          user-select: none;
        }

        .pr-speak {
          width: 52px;
          height: 52px;
          border: none !important;
          background: transparent !important;
          font-size: 29px !important;
          padding: 0 !important;
        }

        .pr-answers {
          display: flex;
          flex-direction: column;
          gap: 15px;
          width: 100%;
          max-width: 355px;
          margin: 0 auto 20px;
        }

        .pr-answer {
          width: 100%;
          min-height: 54px !important;
          border: 3px solid #c5dff4 !important;
          border-radius: 5px !important;
          font-size: 20px !important;
          font-weight: 500 !important;
          text-transform: lowercase;
          background: #fff !important;
          transition: background 0.15s ease;
        }

        .pr-answer:hover:not(:disabled) {
          background: #f1f8ff !important;
        }

        .pr-answer.correct {
          border-color: #4a9b68 !important;
          background: #e7f7ec !important;
        }

        .pr-answer.incorrect {
          border-color: #d48c8c !important;
          background: #fff0f0 !important;
        }

        .pr-answer:disabled {
          opacity: 1;
        }

        .pr-feedback {
          text-align: center;
          max-width: 420px;
          margin: 0 auto 16px;
          border-radius: 8px;
          padding: 13px 16px;
          line-height: 1.5;
          background: #f0f7f2;
          color: #245c37;
        }

        .pr-feedback.try {
          background: #fff7e7;
          color: #775018;
        }

        .pr-bottom-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
        }

        .pr-main-button {
          background: #2b6eae !important;
          color: #fff !important;
          border-color: #2b6eae !important;
        }

        .pr-back {
          margin-top: auto;
          padding-top: 30px;
          display: flex;
          justify-content: flex-start;
        }

        .pr-back button {
          border: none;
          background: transparent;
          padding: 4px;
          font-size: 11px;
          text-align: left;
          min-height: 36px;
        }

        .pr-results {
          text-align: center;
          padding: 30px 8px;
        }

        .pr-result-emoji {
          font-size: 70px;
          margin-bottom: 10px;
        }

        .pr-results h2 {
          color: #234b38;
          font-size: 30px;
          margin: 0 0 12px;
        }

        .pr-result-score {
          font-size: 25px;
          font-weight: 700;
          margin: 20px 0;
        }

        .pr-progress-track {
          height: 9px;
          background: #e8eff5;
          border-radius: 20px;
          overflow: hidden;
          margin: 0 0 22px;
        }

        .pr-progress-bar {
          height: 100%;
          background: #478dc7;
          transition: width 0.2s ease;
        }

        .pr-small-note {
          color: #657482;
          text-align: center;
          font-size: 13px;
          line-height: 1.6;
          margin: 22px 0 0;
        }

        @media (max-width: 520px) {
          .pr-game {
            padding: 8px;
          }

          .pr-panel {
            padding: 20px 14px;
          }

          .pr-topbar {
            font-size: 15px;
          }

          .pr-picture-area {
            min-height: 170px;
            gap: 8px;
          }

          .pr-picture {
            min-width: 120px;
            min-height: 130px;
          }

          .pr-answer {
            font-size: 18px !important;
          }

          .pr-controls {
            gap: 6px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pr-game *,
          .pr-game *::before,
          .pr-game *::after {
            transition: none !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto 16px", width: "100%" }}>
        <GameLevelHeader
          gameId="pictureRecognition"
          currentLevel={currentLevel}
          onSelectLevel={(lvl) => startLevel(lvl, category)}
          gameTitle="Picture Recognition"
        />
      </div>

      <main className="pr-panel">
        {!gameFinished && currentQuestion && (
          <>
            <div className="pr-topbar">
              <span>
                Question: <strong>{questionIndex + 1} / {questions.length}</strong>
              </span>
              <span>
                Score: <strong>{score}</strong>
              </span>
            </div>

            <h1 className="pr-heading">Picture Recognition</h1>
            <p className="pr-subtitle">
              Look at the picture and choose the matching word.
            </p>

            <div className="pr-controls" style={{ justifyContent: "center", marginBottom: 16 }}>
              <label>
                <span className="pr-small-note" style={{ display: "block", margin: "0 0 5px" }}>
                  Filter Objects
                </span>
                <select
                  className="pr-control-select"
                  value={category}
                  onChange={(event) =>
                    startLevel(
                      currentLevel,
                      event.target.value as Category | "All"
                    )
                  }
                >
                  <option value="All">All Categories</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Animals">Animals</option>
                  <option value="Household">Household</option>
                  <option value="Regional">Regional & Cultural</option>
                  <option value="Nature">Nature</option>
                </select>
              </label>
            </div>

            <div
              className="pr-progress-track"
              role="progressbar"
              aria-label="Game progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="pr-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="pr-picture-area">
              <div
                className="pr-picture"
                role="img"
                aria-label={currentQuestion.prompt}
              >
                {currentQuestion.emoji}
              </div>

              <button
                className="pr-speak"
                onClick={playQuestion}
                aria-label="Read the question aloud"
                title="Read question aloud"
              >
                🔊
              </button>
            </div>

            <div className="pr-answers">
              {currentQuestion.options.map((option) => {
                const isCorrect = option === currentQuestion.answer;
                const isSelected = option === selectedAnswer;

                let answerClass = "pr-answer";

                if (answered && isCorrect) {
                  answerClass += " correct";
                } else if (answered && isSelected && !isCorrect) {
                  answerClass += " incorrect";
                }

                return (
                  <button
                    key={option}
                    className={answerClass}
                    onClick={() => chooseAnswer(option)}
                    disabled={answered}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {showHint && !answered && (
              <div className="pr-feedback">
                Hint: Look carefully at the picture. The answer starts with{" "}
                <strong>
                  {currentQuestion.answer.charAt(0).toUpperCase()}
                </strong>.
              </div>
            )}

            {answered && (
              <div
                className={
                  selectedAnswer === currentQuestion.answer
                    ? "pr-feedback"
                    : "pr-feedback try"
                }
                role="status"
                aria-live="polite"
              >
                {selectedAnswer === currentQuestion.answer
                  ? "🌟 Excellent! That is correct. Well done!"
                  : `💛 Good try! The correct answer is ${currentQuestion.answer}.`}
              </div>
            )}

            <div className="pr-bottom-actions">
              {!answered && (
                <button
                  onClick={() => setShowHint(true)}
                  disabled={showHint}
                >
                  💡 Show Hint
                </button>
              )}

              {answered && (
                <button
                  className="pr-main-button"
                  onClick={nextQuestion}
                >
                  {questionIndex + 1 === questions.length
                    ? "See Results"
                    : "Next Question →"}
                </button>
              )}

              <button onClick={() => startLevel(currentLevel, category)}>
                ↻ Restart Level
              </button>

              <button
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);

                  if (!next) {
                    window.speechSynthesis?.cancel();
                  } else {
                    speak("Voice guidance is now enabled.");
                  }
                }}
              >
                {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
              </button>
            </div>

            <div className="pr-back">
              <button
                onClick={() => {
                  if (onExit) {
                    onExit();
                  } else if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    startLevel(1, "All");
                  }
                }}
                aria-label="Go back"
              >
                ←
                <br />
                BACK
              </button>
            </div>
          </>
        )}

        {gameFinished && (
          <section className="pr-results">
            <div className="pr-result-emoji">🎉</div>
            <h2>Level {currentLevel} Complete!</h2>
            <p>You have successfully completed this round of picture recognition.</p>

            <div className="pr-result-score">
              Score: {score} / {questions.length}
            </div>

            <p>
              {score === questions.length
                ? "Perfect! You recognised every picture without a mistake."
                : "Well done for participating! Keep your mind sharp."}
            </p>

            <div className="pr-bottom-actions">
              {currentLevel < TOTAL_GAME_LEVELS && (
                <button
                  className="pr-main-button"
                  onClick={() => startLevel(currentLevel + 1, category)}
                >
                  Next Level (Level {currentLevel + 1}) →
                </button>
              )}
              <button
                onClick={() => startLevel(currentLevel, category)}
              >
                Replay Level {currentLevel}
              </button>
              <button onClick={() => startLevel(1, "All")}>
                Start From Level 1
              </button>
            </div>

            <div className="pr-controls" style={{ marginTop: 30 }}>
              <div>
                <strong>{totalCompleted}</strong>
                <div className="pr-small-note">Games completed on this device</div>
              </div>
              <div>
                <strong>{bestScore}</strong>
                <div className="pr-small-note">Best score</div>
              </div>
            </div>

            <p className="pr-small-note">
              Game records are saved locally in this browser. Scores measure
              game participation, not a medical diagnosis.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
