
import { useEffect, useState } from "react";

type ColorPiece = {
  id: number;
  color: string;
};

const COLORS = [
  { name: "Red", value: "#f04438" },
  { name: "Green", value: "#52d51e" },
  { name: "Blue", value: "#3978ef" },
  { name: "Yellow", value: "#f5d51b" },
  { name: "Purple", value: "#7845e8" },
];

const STORAGE_KEY = "dementia-color-sorting-progress";

type Level = {
  label: string;
  rows: number;
  columns: number;
};

const LEVELS: Level[] = [
  { label: "Easy", rows: 3, columns: 3 },
  { label: "Medium", rows: 4, columns: 4 },
  { label: "Advanced", rows: 4, columns: 5 },
];

function shuffle<T,>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function createPuzzle(count: number) {
  const target: ColorPiece[] = Array.from(
    { length: count },
    (_, index) => ({
      id: index,
      color: COLORS[index % COLORS.length].value,
    })
  );

  const randomized = shuffle(target);

  // Avoid starting with an already completed board.
  if (randomized.every((piece, index) => piece.color === target[index].color)) {
    [randomized[0], randomized[1]] = [randomized[1], randomized[0]];
  }

  return { target, randomized };
}

export default function ColorSorting() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [target, setTarget] = useState<ColorPiece[]>([]);
  const [board, setBoard] = useState<ColorPiece[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [hints, setHints] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [message, setMessage] = useState(
    "Look at the pattern above and match the colours below."
  );
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [gamesCompleted, setGamesCompleted] = useState(0);
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  const level = LEVELS[levelIndex];
  const totalPieces = level.rows * level.columns;

  const isSolved =
    target.length > 0 &&
    board.length === target.length &&
    board.every((piece, index) => piece.color === target[index].color);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setGamesCompleted(data.gamesCompleted ?? 0);
        setBestMoves(data.bestMoves ?? null);
      }
    } catch {
      // The game still works if browser storage is unavailable.
    }

    newGame(0);
    // Initialise the game once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isSolved || completed) return;

    setCompleted(true);
    setMessage("Wonderful! You matched all the colours. Well done!");

    if (voiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance(
          "Wonderful! You matched all the colours. Well done!"
        )
      );
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data = saved ? JSON.parse(saved) : {};
      const total = (data.gamesCompleted ?? 0) + 1;
      const best =
        data.bestMoves == null
          ? moves
          : Math.min(data.bestMoves, moves);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          gamesCompleted: total,
          bestMoves: best,
        })
      );

      setGamesCompleted(total);
      setBestMoves(best);
    } catch {
      // Completion does not depend on saving.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSolved]);

  function speak(text: string) {
    if (
      voiceEnabled &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  function newGame(nextLevelIndex = levelIndex) {
    const chosenLevel = LEVELS[nextLevelIndex];
    const count = chosenLevel.rows * chosenLevel.columns;
    const puzzle = createPuzzle(count);

    setLevelIndex(nextLevelIndex);
    setTarget(puzzle.target);
    setBoard(puzzle.randomized);
    setSelected(null);
    setMoves(0);
    setHints(0);
    setShowHint(false);
    setCompleted(false);
    setMessage("Look at the pattern above and match the colours below.");

    speak("Let's match the colours. Take your time.");
  }

  function handlePieceClick(index: number) {
    if (completed || isSolved) return;

    if (selected === null) {
      setSelected(index);
      setMessage("Now tap another disc to swap their positions.");
      return;
    }

    if (selected === index) {
      setSelected(null);
      setMessage("Selection cancelled. Choose a disc when you are ready.");
      return;
    }

    const first = selected;
    const second = index;

    setBoard((current) => {
      const next = [...current];
      [next[first], next[second]] = [next[second], next[first]];
      return next;
    });

    setMoves((current) => current + 1);
    setSelected(null);
    setShowHint(false);
    setMessage("Good try! Keep matching the pattern.");

    speak("Good try! Keep going.");
  }

  function giveHint() {
    if (completed) return;

    const wrongIndex = board.findIndex(
      (piece, index) => piece.color !== target[index].color
    );

    if (wrongIndex === -1) return;

    const matchingIndex = board.findIndex(
      (piece, index) =>
        index !== wrongIndex &&
        piece.color === target[wrongIndex].color &&
        piece.color !== target[index].color
    );

    setSelected(wrongIndex);
    setShowHint(true);
    setHints((current) => current + 1);

    if (matchingIndex !== -1) {
      setMessage(
        `Hint: the highlighted disc needs to move. Look for another ${COLORS.find(
          (color) => color.value === target[wrongIndex].color
        )?.name.toLowerCase()} disc.`
      );
    } else {
      setMessage(
        "Hint: look for the colour shown in this position in the target pattern."
      );
    }

    speak("Look at the highlighted position and find the matching colour.");
  }

  const correctCount = board.filter(
    (piece, index) => piece.color === target[index]?.color
  ).length;

  const progress = Math.round((correctCount / totalPieces) * 100);

  return (
    <div className="cs-app">
      <style>{`
        .cs-app {
          min-height: 100vh;
          padding: 24px 16px;
          background: linear-gradient(135deg, #f8f2e5, #e8f1e8);
          color: #3b3024;
          font-family: Arial, Helvetica, sans-serif;
        }

        .cs-app *,
        .cs-app *::before,
        .cs-app *::after {
          box-sizing: border-box;
        }

        .cs-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .cs-header {
          text-align: center;
          margin-bottom: 22px;
        }

        .cs-header h1 {
          margin: 0 0 9px;
          font-size: clamp(28px, 4vw, 38px);
          color: #604126;
        }

        .cs-header p {
          margin: 0;
          font-size: 17px;
          color: #6d5b48;
          line-height: 1.6;
        }

        .cs-card {
          background: #fffdf8;
          border: 1px solid #e5d4ba;
          border-radius: 22px;
          padding: clamp(16px, 3vw, 28px);
          margin-bottom: 20px;
          box-shadow: 0 8px 25px rgba(89, 61, 30, .08);
        }

        .cs-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 22px;
        }

        .cs-app button {
          font: inherit;
          cursor: pointer;
          min-height: 45px;
          border: 2px solid #ddc7a5;
          border-radius: 12px;
          background: #fffaf0;
          color: #493622;
          padding: 10px 15px;
          font-weight: 700;
        }

        .cs-app button:focus-visible {
          outline: 3px solid #2476d2;
          outline-offset: 3px;
        }

        .cs-app button:disabled {
          cursor: default;
        }

        .cs-levels {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .cs-levels button.active {
          background: #805331;
          color: #fff;
          border-color: #805331;
        }

        .cs-game-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 28px;
          align-items: start;
        }

        .cs-section-title {
          text-align: center;
          color: #684629;
          font-size: 21px;
          margin: 0 0 8px;
        }

        .cs-instructions {
          text-align: center;
          color: #74604c;
          font-size: 15px;
          line-height: 1.6;
          margin: 0 0 18px;
        }

        .cs-wood {
          padding: 16px;
          border-radius: 15px;
          border: 2px solid #c8a77c;
          background:
            repeating-linear-gradient(
              90deg,
              rgba(146, 94, 44, .035) 0px,
              rgba(146, 94, 44, .035) 2px,
              transparent 2px,
              transparent 12px
            ),
            linear-gradient(135deg, #f4dfbf, #dfbd8c 50%, #f3dbb5);
          box-shadow:
            inset 0 0 0 4px rgba(255,255,255,.3),
            0 5px 10px rgba(88, 57, 29, .12);
        }

        .cs-pattern {
          display: grid;
          gap: 6px;
          padding: 10px;
          background: #fffefb;
          border: 2px solid #b99a74;
          border-radius: 9px;
          margin-bottom: 22px;
        }

        .cs-target-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          background: #f8f5ef;
          border: 1px solid #e8dfd1;
        }

        .cs-dot {
          display: block;
          width: 72%;
          height: 72%;
          border-radius: 50%;
          box-shadow:
            inset -3px -4px 5px rgba(0,0,0,.15),
            inset 2px 2px 4px rgba(255,255,255,.4),
            0 2px 2px rgba(0,0,0,.12);
        }

        .cs-board {
          display: grid;
          gap: 8px;
        }

        .cs-piece {
          aspect-ratio: 1;
          min-width: 0;
          padding: 4px !important;
          border: 3px solid transparent !important;
          background: transparent !important;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50% !important;
        }

        .cs-piece .cs-dot {
          width: 100%;
          height: 100%;
          max-width: 65px;
          max-height: 65px;
          border: 1px solid rgba(0,0,0,.12);
          box-shadow:
            inset -4px -5px 6px rgba(0,0,0,.16),
            inset 3px 3px 6px rgba(255,255,255,.48),
            0 4px 3px rgba(82,51,24,.22);
        }

        .cs-piece.selected {
          border-color: #5133a5 !important;
          background: #e9e0ff !important;
          transform: scale(1.04);
        }

        .cs-piece.correct {
          border-color: #58a96c !important;
        }

        .cs-piece.hinted {
          outline: 3px solid #e5a52e;
          outline-offset: 2px;
        }

        .cs-progress {
          margin-top: 20px;
        }

        .cs-progress-label {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #63482e;
        }

        .cs-progress-track {
          width: 100%;
          height: 12px;
          border-radius: 30px;
          background: #eadfcf;
          overflow: hidden;
        }

        .cs-progress-fill {
          height: 100%;
          background: #56a96d;
          border-radius: inherit;
          transition: width .25s ease;
        }

        .cs-message {
          text-align: center;
          line-height: 1.6;
          margin: 20px 0 0;
          padding: 14px;
          border-radius: 12px;
          background: #f5ead9;
          color: #62452a;
          font-weight: 600;
        }

        .cs-success {
          background: #e6f6e7;
          color: #235c32;
          border: 1px solid #b1dcb6;
        }

        .cs-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .cs-primary {
          background: #76502f !important;
          color: white !important;
          border-color: #76502f !important;
        }

        .cs-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 22px;
        }

        .cs-stat {
          background: #fff8eb;
          border: 1px solid #ead7b9;
          border-radius: 13px;
          padding: 13px 8px;
          text-align: center;
        }

        .cs-stat strong {
          display: block;
          font-size: 23px;
          color: #76502f;
          margin-bottom: 5px;
        }

        .cs-stat span {
          font-size: 13px;
          color: #78644d;
        }

        .cs-note {
          text-align: center;
          font-size: 13px;
          line-height: 1.6;
          color: #7a6b5b;
          margin: 18px 0 0;
        }

        @media (max-width: 700px) {
          .cs-game-layout {
            grid-template-columns: 1fr;
            gap: 25px;
          }

          .cs-wood {
            max-width: 430px;
            width: 100%;
            margin: 0 auto;
          }

          .cs-toolbar {
            justify-content: center;
          }
        }

        @media (max-width: 420px) {
          .cs-app {
            padding: 12px 8px;
          }

          .cs-card {
            padding: 14px;
          }

          .cs-wood {
            padding: 10px;
          }

          .cs-board {
            gap: 4px;
          }

          .cs-pattern {
            gap: 4px;
            padding: 7px;
          }

          .cs-stats {
            gap: 5px;
          }

          .cs-stat strong {
            font-size: 19px;
          }

          .cs-stat span {
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-app *,
          .cs-app *::before,
          .cs-app *::after {
            transition: none !important;
          }
        }
      `}</style>

      <div className="cs-container">
        <header className="cs-header">
          <h1>🎨 Colour Sorting Game</h1>
          <p>
            Look at the colour pattern and arrange the discs to match it.
            Take your time!
          </p>
        </header>

        <section className="cs-card">
          <div className="cs-toolbar">
            <div>
              <div style={{ fontWeight: 700, marginBottom: 9 }}>
                Choose your level
              </div>
              <div className="cs-levels">
                {LEVELS.map((item, index) => (
                  <button
                    key={item.label}
                    className={levelIndex === index ? "active" : ""}
                    onClick={() => newGame(index)}
                    aria-pressed={levelIndex === index}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const enabled = !voiceEnabled;
                setVoiceEnabled(enabled);

                if (!enabled) {
                  window.speechSynthesis?.cancel();
                } else {
                  const speech = new SpeechSynthesisUtterance(
                    "Voice guidance is now on."
                  );
                  window.speechSynthesis?.speak(speech);
                }
              }}
              aria-pressed={voiceEnabled}
            >
              {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
            </button>
          </div>

          <div className="cs-game-layout">
            <div>
              <h2 className="cs-section-title">Target pattern</h2>
              <p className="cs-instructions">
                Remember the colours and their positions.
              </p>

              <div className="cs-wood">
                <div
                  className="cs-pattern"
                  style={{
                    gridTemplateColumns: `repeat(${level.columns}, minmax(0, 1fr))`,
                  }}
                >
                  {target.map((piece, index) => (
                    <div
                      key={piece.id}
                      className="cs-target-cell"
                      aria-label={`Target position ${index + 1}`}
                    >
                      <span
                        className="cs-dot"
                        style={{ backgroundColor: piece.color }}
                      />
                    </div>
                  ))}
                </div>

                <h2 className="cs-section-title">Arrange the discs</h2>

                <div
                  className="cs-board"
                  style={{
                    gridTemplateColumns: `repeat(${level.columns}, minmax(0, 1fr))`,
                  }}
                >
                  {board.map((piece, index) => {
                    const isCorrect =
                      piece.color === target[index]?.color;

                    return (
                      <button
                        key={index}
                        className={[
                          "cs-piece",
                          selected === index ? "selected" : "",
                          isCorrect ? "correct" : "",
                          showHint && selected === index ? "hinted" : "",
                        ].join(" ")}
                        onClick={() => handlePieceClick(index)}
                        aria-label={`Disc ${index + 1}, ${
                          COLORS.find((c) => c.value === piece.color)?.name
                        }`}
                        aria-pressed={selected === index}
                        disabled={completed}
                      >
                        <span
                          className="cs-dot"
                          style={{ backgroundColor: piece.color }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="cs-progress">
                <div className="cs-progress-label">
                  <span>Matching progress</span>
                  <span>{progress}%</span>
                </div>
                <div
                  className="cs-progress-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label="Matching progress"
                >
                  <div
                    className="cs-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="cs-section-title">How to play</h2>
              <p className="cs-instructions">
                1. Tap one coloured disc.
                <br />
                2. Tap another disc to swap them.
                <br />
                3. Continue until the pattern matches.
              </p>

              <div className="cs-stats">
                <div className="cs-stat">
                  <strong>{correctCount}/{totalPieces}</strong>
                  <span>Matched</span>
                </div>
                <div className="cs-stat">
                  <strong>{moves}</strong>
                  <span>Swaps</span>
                </div>
                <div className="cs-stat">
                  <strong>{hints}</strong>
                  <span>Hints</span>
                </div>
              </div>

              <div className={`cs-message ${completed ? "cs-success" : ""}`} role="status" aria-live="polite">
                {completed ? "🎉 " : ""}
                {message}
              </div>

              <div className="cs-actions">
                <button
                  onClick={giveHint}
                  disabled={completed}
                >
                  💡 Give Me a Hint
                </button>

                <button
                  className="cs-primary"
                  onClick={() => newGame(levelIndex)}
                >
                  ↻ Restart Game
                </button>
              </div>

              {completed && (
                <div className="cs-actions">
                  <button
                    className="cs-primary"
                    onClick={() =>
                      newGame(Math.min(levelIndex + 1, LEVELS.length - 1))
                    }
                  >
                    {levelIndex === LEVELS.length - 1
                      ? "Play Again"
                      : "Next Level →"}
                  </button>
                </div>
              )}

              <p className="cs-note">
                There is no timer. Play comfortably, and take a break whenever
                needed.
              </p>
            </div>
          </div>
        </section>

        <section className="cs-card">
          <h2 className="cs-section-title">Your Progress</h2>

          <div className="cs-stats">
            <div className="cs-stat">
              <strong>{gamesCompleted}</strong>
              <span>Games completed</span>
            </div>
            <div className="cs-stat">
              <strong>{bestMoves ?? "—"}</strong>
              <span>Best swaps</span>
            </div>
            <div className="cs-stat">
              <strong>{level.label}</strong>
              <span>Current level</span>
            </div>
          </div>

          <p className="cs-note">
            Progress is stored in this browser on this device. These records
            show game activity and are not a medical diagnosis.
          </p>
        </section>
      </div>
    </div>
  );
}
