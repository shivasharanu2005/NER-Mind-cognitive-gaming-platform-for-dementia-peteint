
import { useEffect, useState } from "react";

type Category = "Fruits" | "Animals" | "Household" | "Regional";

type Question = {
  id: number;
  category: Category;
  prompt: string;
  emoji: string;
  answer: string;
  options: string[];
};

const QUESTION_BANK: Question[] = [
  {
    id: 1,
    category: "Fruits",
    prompt: "Find the apple",
    emoji: "🍎",
    answer: "apple",
    options: ["orange", "banana", "apple"],
  },
  {
    id: 2,
    category: "Fruits",
    prompt: "Find the banana",
    emoji: "🍌",
    answer: "banana",
    options: ["mango", "banana", "grapes"],
  },
  {
    id: 3,
    category: "Fruits",
    prompt: "Which fruit is a mango?",
    emoji: "🥭",
    answer: "mango",
    options: ["mango", "apple", "watermelon"],
  },
  {
    id: 4,
    category: "Fruits",
    prompt: "Find the orange",
    emoji: "🍊",
    answer: "orange",
    options: ["coconut", "orange", "pear"],
  },
  {
    id: 5,
    category: "Fruits",
    prompt: "Find the grapes",
    emoji: "🍇",
    answer: "grapes",
    options: ["lemon", "papaya", "grapes"],
  },
  {
    id: 6,
    category: "Animals",
    prompt: "Find the cat",
    emoji: "🐱",
    answer: "cat",
    options: ["dog", "cat", "cow"],
  },
  {
    id: 7,
    category: "Animals",
    prompt: "Find the dog",
    emoji: "🐶",
    answer: "dog",
    options: ["goat", "dog", "horse"],
  },
  {
    id: 8,
    category: "Animals",
    prompt: "Which animal gives us milk?",
    emoji: "🐄",
    answer: "cow",
    options: ["lion", "monkey", "cow"],
  },
  {
    id: 9,
    category: "Animals",
    prompt: "Find the bird",
    emoji: "🐦",
    answer: "bird",
    options: ["fish", "bird", "rabbit"],
  },
  {
    id: 10,
    category: "Animals",
    prompt: "Find the fish",
    emoji: "🐟",
    answer: "fish",
    options: ["fish", "elephant", "cat"],
  },
  {
    id: 11,
    category: "Household",
    prompt: "Find the chair",
    emoji: "🪑",
    answer: "chair",
    options: ["table", "chair", "bed"],
  },
  {
    id: 12,
    category: "Household",
    prompt: "Find the clock",
    emoji: "🕒",
    answer: "clock",
    options: ["cup", "plate", "clock"],
  },
  {
    id: 13,
    category: "Household",
    prompt: "Find the cup",
    emoji: "☕",
    answer: "cup",
    options: ["cup", "shoe", "book"],
  },
  {
    id: 14,
    category: "Household",
    prompt: "Find the key",
    emoji: "🔑",
    answer: "key",
    options: ["spoon", "key", "phone"],
  },
  {
    id: 15,
    category: "Household",
    prompt: "Find the book",
    emoji: "📘",
    answer: "book",
    options: ["bottle", "book", "chair"],
  },
  {
    id: 16,
    category: "Regional",
    prompt: "Find the coconut",
    emoji: "🥥",
    answer: "coconut",
    options: ["coconut", "apple", "carrot"],
  },
  {
    id: 17,
    category: "Regional",
    prompt: "Find the rice",
    emoji: "🍚",
    answer: "rice",
    options: ["bread", "rice", "cake"],
  },
  {
    id: 18,
    category: "Regional",
    prompt: "Find the mango",
    emoji: "🥭",
    answer: "mango",
    options: ["potato", "onion", "mango"],
  },
  {
    id: 19,
    category: "Regional",
    prompt: "Find the flower",
    emoji: "🌺",
    answer: "flower",
    options: ["leaf", "flower", "tree"],
  },
  {
    id: 20,
    category: "Regional",
    prompt: "Find the banana leaf",
    emoji: "🌿",
    answer: "banana leaf",
    options: ["banana leaf", "flower", "fruit"],
  },
];

type Difficulty = "Easy" | "Medium" | "Advanced";

const STORAGE_KEY = "picture-recognition-game-progress";

function shuffle<T,>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export default function PictureRecognitionGame({ onExit }: { onExit?: () => void } = {}) {
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
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

    startGame("Easy", "All");
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

  function startGame(
    nextDifficulty: Difficulty = difficulty,
    nextCategory: Category | "All" = category
  ) {
    const pool =
      nextCategory === "All"
        ? QUESTION_BANK
        : QUESTION_BANK.filter((q) => q.category === nextCategory);

    const count = Math.min(
      nextDifficulty === "Easy" ? 5 :
      nextDifficulty === "Medium" ? 8 : 10,
      pool.length
    );

    const nextQuestions = shuffle(pool)
      .slice(0, count)
      .map((question) => ({
        ...question,
        options: shuffle(question.options),
      }));

    setDifficulty(nextDifficulty);
    setCategory(nextCategory);
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setShowHint(false);
    setGameFinished(false);
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
      `You finished the game. Your score is ${finalScore} out of ${questions.length}. Well done.`
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
              Look at the picture and choose the correct answer.
            </p>

            <div className="pr-controls">
              <label>
                <span className="pr-small-note" style={{ display: "block", margin: "0 0 5px" }}>
                  Category
                </span>
                <select
                  className="pr-control-select"
                  value={category}
                  onChange={(event) =>
                    startGame(
                      difficulty,
                      event.target.value as Category | "All"
                    )
                  }
                >
                  <option value="All">All objects</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Animals">Animals</option>
                  <option value="Household">Household</option>
                  <option value="Regional">Regional items</option>
                </select>
              </label>

              <label>
                <span className="pr-small-note" style={{ display: "block", margin: "0 0 5px" }}>
                  Difficulty
                </span>
                <select
                  className="pr-control-select"
                  value={difficulty}
                  onChange={(event) =>
                    startGame(
                      event.target.value as Difficulty,
                      category
                    )
                  }
                >
                  <option value="Easy">Easy · 5</option>
                  <option value="Medium">Medium · 8</option>
                  <option value="Advanced">Advanced · 10</option>
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

              <button onClick={() => startGame(difficulty, category)}>
                ↻ Restart
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
                    startGame("Easy", "All");
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
            <h2>Wonderful Work!</h2>
            <p>You have completed the picture recognition game.</p>

            <div className="pr-result-score">
              Score: {score} / {questions.length}
            </div>

            <p>
              {score === questions.length
                ? "Perfect! You recognised every picture."
                : "Well done for participating. You can practise again whenever you like."}
            </p>

            <div className="pr-bottom-actions">
              <button
                className="pr-main-button"
                onClick={() => startGame(difficulty, category)}
              >
                Play Again
              </button>
              <button onClick={() => startGame("Easy", "All")}>
                Start Easy Level
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
