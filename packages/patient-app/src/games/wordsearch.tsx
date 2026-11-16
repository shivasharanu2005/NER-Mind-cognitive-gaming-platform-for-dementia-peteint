
import { useEffect, useState } from "react";

type Position = { row: number; col: number };
type Level = {
  title: string;
  size: number;
  words: string[];
  category: string;
};

const LEVELS: Level[] = [
  {
    title: "Easy",
    size: 5,
    words: ["WORD"],
    category: "Simple words",
  },
  {
    title: "Easy Plus",
    size: 5,
    words: ["APPLE", "CAT"],
    category: "Familiar things",
  },
  {
    title: "Fruits",
    size: 6,
    words: ["MANGO", "GRAPE", "PEAR"],
    category: "Fruits",
  },
  {
    title: "Animals",
    size: 7,
    words: ["TIGER", "HORSE", "COW", "BIRD"],
    category: "Animals",
  },
  {
    title: "Daily Life",
    size: 8,
    words: ["HOUSE", "CHAIR", "TABLE", "BREAD"],
    category: "Everyday objects",
  },
  {
    title: "Nature",
    size: 8,
    words: ["FLOWER", "GARDEN", "RIVER", "CLOUD", "SUN"],
    category: "Nature",
  },
  {
    title: "Challenge",
    size: 9,
    words: ["FAMILY", "FRIEND", "ORANGE", "BANANA", "WATER"],
    category: "Familiar words",
  },
];

const STORAGE_KEY = "dementia-word-search-progress";

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function inside(row: number, col: number, size: number) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function keyOf(pos: Position) {
  return `${pos.row}-${pos.col}`;
}

function makePuzzle(level: Level) {
  const size = level.size;

  for (let attempt = 0; attempt < 200; attempt++) {
    const grid = Array.from({ length: size }, () =>
      Array(size).fill("")
    );
    const placements: Record<string, Position[]> = {};
    let successful = true;

    for (const word of level.words) {
      let placed = false;

      for (let tryPlace = 0; tryPlace < 250; tryPlace++) {
        const [dr, dc] = DIRECTIONS[randomInt(DIRECTIONS.length)];
        const startRow = randomInt(size);
        const startCol = randomInt(size);

        const positions = Array.from(word, (_, index) => ({
          row: startRow + dr * index,
          col: startCol + dc * index,
        }));

        if (
          positions.some(
            (pos) => !inside(pos.row, pos.col, size)
          )
        ) {
          continue;
        }

        const conflict = positions.some((pos, index) => {
          const existing = grid[pos.row][pos.col];
          return existing !== "" && existing !== word[index];
        });

        if (conflict) continue;

        positions.forEach((pos, index) => {
          grid[pos.row][pos.col] = word[index];
        });

        placements[word] = positions;
        placed = true;
        break;
      }

      if (!placed) {
        successful = false;
        break;
      }
    }

    if (successful) {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (!grid[row][col]) {
            grid[row][col] = letters[randomInt(letters.length)];
          }
        }
      }

      return { grid, placements };
    }
  }

  // Reliable fallback for unusually difficult placement combinations.
  const grid = Array.from({ length: size }, () =>
    Array(size).fill("")
  );
  const placements: Record<string, Position[]> = {};

  level.words.forEach((word, wordIndex) => {
    const row = wordIndex;
    placements[word] = [];

    for (let col = 0; col < word.length; col++) {
      grid[row][col] = word[col];
      placements[word].push({ row, col });
    }
  });

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!grid[row][col]) {
        grid[row][col] = letters[randomInt(letters.length)];
      }
    }
  }

  return { grid, placements };
}

function lineBetween(start: Position, end: Position): Position[] {
  const dr = end.row - start.row;
  const dc = end.col - start.col;

  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
    return [];
  }

  const steps = Math.max(Math.abs(dr), Math.abs(dc));

  if (steps === 0) return [start];

  const stepRow = Math.sign(dr);
  const stepCol = Math.sign(dc);

  return Array.from({ length: steps + 1 }, (_, index) => ({
    row: start.row + stepRow * index,
    col: start.col + stepCol * index,
  }));
}

function speakText(text: string) {
  if (
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  ) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }
}

export default function WordSearchGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [grid, setGrid] = useState<string[][]>([]);
  const [placements, setPlacements] = useState<
    Record<string, Position[]>
  >({});
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectionStart, setSelectionStart] =
    useState<Position | null>(null);
  const [selectionEnd, setSelectionEnd] =
    useState<Position | null>(null);
  const [message, setMessage] = useState(
    "Find the word shown in the word list."
  );
  const [hintWord, setHintWord] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [gamesCompleted, setGamesCompleted] = useState(0);
  const [highestLevel, setHighestLevel] = useState(1);
  const [levelComplete, setLevelComplete] = useState(false);

  const level = LEVELS[levelIndex];
  const selection = selectionStart && selectionEnd
    ? lineBetween(selectionStart, selectionEnd)
    : selectionStart
      ? [selectionStart]
      : [];

  const selectionKeys = new Set(selection.map(keyOf));
  const foundKeys = new Set(
    foundWords.flatMap((word) =>
      (placements[word] ?? []).map(keyOf)
    )
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const data = JSON.parse(saved);
        setGamesCompleted(data.gamesCompleted ?? 0);
        setHighestLevel(data.highestLevel ?? 1);
      }
    } catch {
      // The game works even when storage is unavailable.
    }

    resetLevel(0);
    // Initialise the first level once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetLevel(index = levelIndex) {
    const nextLevel = LEVELS[index];
    const puzzle = makePuzzle(nextLevel);

    setLevelIndex(index);
    setGrid(puzzle.grid);
    setPlacements(puzzle.placements);
    setFoundWords([]);
    setSelectionStart(null);
    setSelectionEnd(null);
    setHintWord(null);
    setLevelComplete(false);
    setMessage("Find a word from the list below.");
  }

  function selectCell(row: number, col: number) {
    if (levelComplete) return;

    const clicked = { row, col };

    if (!selectionStart || selectionEnd) {
      setSelectionStart(clicked);
      setSelectionEnd(null);
      setMessage("Now tap the last letter of the word.");
      return;
    }

    const positions = lineBetween(selectionStart, clicked);

    if (positions.length === 0) {
      setSelectionStart(clicked);
      setSelectionEnd(null);
      setMessage("Choose letters in a straight line. Try again.");
      return;
    }

    const selectedWord = positions
      .map((pos) => grid[pos.row]?.[pos.col] ?? "")
      .join("");

    const reverseWord = selectedWord.split("").reverse().join("");

    const matchedWord = level.words.find(
      (word) =>
        (word === selectedWord || word === reverseWord) &&
        !foundWords.includes(word)
    );

    if (matchedWord) {
      const nextFound = [...foundWords, matchedWord];
      setFoundWords(nextFound);
      setSelectionEnd(clicked);
      setHintWord(null);
      setMessage(`Wonderful! You found ${matchedWord}.`);

      if (voiceEnabled) {
        speakText(`Wonderful! You found ${matchedWord}.`);
      }

      if (nextFound.length === level.words.length) {
        setLevelComplete(true);
        setMessage("Excellent! You found every word in this level!");

        const newHighest = Math.max(highestLevel, levelIndex + 1);
        setHighestLevel(newHighest);

        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          const data = saved ? JSON.parse(saved) : {};

          const total = (data.gamesCompleted ?? 0) + 1;

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              gamesCompleted: total,
              highestLevel: newHighest,
            })
          );

          setGamesCompleted(total);
        } catch {
          // Completion does not depend on saving.
        }

        if (voiceEnabled) {
          speakText("Excellent! You found every word. Well done!");
        }
      } else {
        // Briefly display the found path, then prepare for the next word.
        window.setTimeout(() => {
          setSelectionStart(null);
          setSelectionEnd(null);
        }, 500);
      }
    } else {
      setSelectionEnd(clicked);
      setMessage("Not quite. Try another word, or use a hint.");

      window.setTimeout(() => {
        setSelectionStart(null);
        setSelectionEnd(null);
      }, 600);
    }
  }

  function giveHint() {
    const nextWord = level.words.find(
      (word) => !foundWords.includes(word)
    );

    if (!nextWord) return;

    setHintWord(nextWord);
    setMessage(
      `Hint: look for "${nextWord}". Its first letter is ${nextWord[0]}.`
    );

    if (voiceEnabled) {
      speakText(
        `Look for ${nextWord}. It starts with the letter ${nextWord[0]}.`
      );
    }
  }

  function goToNextLevel() {
    const nextIndex = Math.min(levelIndex + 1, LEVELS.length - 1);

    if (nextIndex === levelIndex) {
      resetLevel(levelIndex);
    } else {
      resetLevel(nextIndex);
    }
  }

  return (
    <div className="ws-app">
      <style>{`
        .ws-app {
          min-height: 100vh;
          padding: 22px 14px;
          background: linear-gradient(140deg, #eef5ff, #f8f0ff);
          color: #272a35;
          font-family: Arial, Helvetica, sans-serif;
        }

        .ws-app *,
        .ws-app *::before,
        .ws-app *::after {
          box-sizing: border-box;
        }

        .ws-container {
          max-width: 850px;
          margin: 0 auto;
        }

        .ws-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .ws-header h1 {
          margin: 0 0 8px;
          font-size: clamp(30px, 5vw, 40px);
          color: #333d86;
        }

        .ws-header p {
          margin: 0;
          font-size: 17px;
          color: #5f6276;
          line-height: 1.6;
        }

        .ws-card {
          background: #fff;
          border: 1px solid #e0e3f0;
          border-radius: 20px;
          padding: clamp(15px, 4vw, 28px);
          margin-bottom: 18px;
          box-shadow: 0 8px 24px rgba(44, 52, 104, .07);
        }

        .ws-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 18px;
        }

        .ws-level {
          color: #393f87;
          font-size: 19px;
          font-weight: 800;
        }

        .ws-app button,
        .ws-app select {
          font: inherit;
        }

        .ws-app button {
          cursor: pointer;
          min-height: 45px;
          padding: 10px 14px;
          border: 2px solid #d7dcf0;
          border-radius: 11px;
          background: #f8f9ff;
          color: #343958;
          font-weight: 700;
        }

        .ws-app button:focus-visible,
        .ws-app select:focus-visible {
          outline: 3px solid #d69a30;
          outline-offset: 3px;
        }

        .ws-app button:disabled {
          cursor: default;
        }

        .ws-progress-track {
          height: 10px;
          background: #eceefa;
          border-radius: 30px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .ws-progress-fill {
          height: 100%;
          background: #64b98a;
          border-radius: inherit;
          transition: width .2s ease;
        }

        .ws-instruction {
          text-align: center;
          font-size: 17px;
          line-height: 1.6;
          color: #555b75;
          margin: 0 0 18px;
        }

        .ws-grid-wrap {
          max-width: 500px;
          margin: 0 auto 22px;
          padding: 12px;
          border: 2px solid #c8cbd2;
          background: #fbfbfd;
          border-radius: 10px;
        }

        .ws-grid {
          display: grid;
          width: 100%;
          gap: 3px;
        }

        .ws-cell {
          aspect-ratio: 1;
          min-width: 0;
          min-height: 0 !important;
          padding: 0 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid transparent !important;
          border-radius: 8px !important;
          background: #fff !important;
          color: #282b39 !important;
          font-size: clamp(17px, 4vw, 27px) !important;
          font-weight: 800;
          user-select: none;
        }

        .ws-cell.selected {
          background: #dcd8ff !important;
          border-color: #8375d2 !important;
        }

        .ws-cell.found {
          background: #e1f5e8 !important;
          color: #226c44 !important;
          border-color: #83cda0 !important;
        }

        .ws-cell.hint {
          background: #fff1c9 !important;
          border-color: #e4b345 !important;
        }

        .ws-word-title {
          font-size: 19px;
          text-align: center;
          margin: 0 0 12px;
          color: #383f83;
        }

        .ws-word-list {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ws-word {
          min-width: 105px;
          font-size: 18px;
          letter-spacing: 1px;
        }

        .ws-word.found {
          background: #e5f6e9 !important;
          border-color: #91d0a5 !important;
          color: #21663c !important;
        }

        .ws-message {
          margin-top: 20px;
          text-align: center;
          line-height: 1.6;
          padding: 14px;
          border-radius: 12px;
          background: #f0efff;
          color: #424583;
          font-weight: 600;
        }

        .ws-message.success {
          background: #e5f6e9;
          border: 1px solid #a6dcb4;
          color: #235d37;
        }

        .ws-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .ws-primary {
          background: #4f56a7 !important;
          border-color: #4f56a7 !important;
          color: #fff !important;
        }

        .ws-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .ws-stat {
          padding: 15px 10px;
          border: 1px solid #e0e3f0;
          border-radius: 13px;
          background: #f8f9ff;
          text-align: center;
        }

        .ws-stat strong {
          display: block;
          font-size: 25px;
          color: #4f56a7;
          margin-bottom: 5px;
        }

        .ws-stat span {
          font-size: 13px;
          color: #686d82;
        }

        .ws-note {
          margin: 18px 0 0;
          text-align: center;
          font-size: 13px;
          line-height: 1.6;
          color: #76798b;
        }

        @media (max-width: 450px) {
          .ws-app {
            padding: 12px 8px;
          }

          .ws-card {
            padding: 13px 10px;
          }

          .ws-grid-wrap {
            padding: 6px;
          }

          .ws-grid {
            gap: 2px;
          }

          .ws-cell {
            border-radius: 5px !important;
            font-size: clamp(15px, 4.4vw, 22px) !important;
          }

          .ws-word {
            min-width: 85px;
            font-size: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ws-app *,
          .ws-app *::before,
          .ws-app *::after {
            transition: none !important;
          }
        }
      `}</style>

      <div className="ws-container">
        <header className="ws-header">
          <h1>🔎 Word Search</h1>
          <p>Find the hidden words, one level at a time.</p>
        </header>

        <section className="ws-card">
          <div className="ws-top">
            <div className="ws-level">
              Level {levelIndex + 1}: {level.title}
            </div>

            <button
              onClick={() => {
                const enabled = !voiceEnabled;
                setVoiceEnabled(enabled);

                if (!enabled) {
                  window.speechSynthesis?.cancel();
                } else {
                  speakText("Voice guidance is now on.");
                }
              }}
              aria-pressed={voiceEnabled}
            >
              {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
            </button>
          </div>

          <div className="ws-progress-track">
            <div
              className="ws-progress-fill"
              style={{
                width: `${
                  (foundWords.length / level.words.length) * 100
                }%`,
              }}
            />
          </div>

          <p className="ws-instruction">
            Look at the letters in the box.
            <br />
            Tap the first letter, then tap the last letter of a word.
            <br />
            Words can go across, down, or diagonally.
          </p>

          <div className="ws-grid-wrap">
            <div
              className="ws-grid"
              style={{
                gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))`,
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const isFound = foundKeys.has(key);
                  const isSelected = selectionKeys.has(key);

                  const isHint =
                    hintWord !== null &&
                    placements[hintWord]?.[0] !== undefined &&
                    keyOf(placements[hintWord][0]) === key &&
                    !foundWords.includes(hintWord);

                  return (
                    <button
                      key={key}
                      className={[
                        "ws-cell",
                        isFound ? "found" : "",
                        isSelected ? "selected" : "",
                        isHint ? "hint" : "",
                      ].join(" ")}
                      onClick={() => selectCell(rowIndex, colIndex)}
                      aria-label={`Row ${rowIndex + 1}, column ${
                        colIndex + 1
                      }, letter ${letter}`}
                      disabled={levelComplete}
                    >
                      {letter}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <h2 className="ws-word-title">
            Words to Find — {level.category}
          </h2>

          <div className="ws-word-list">
            {level.words.map((word) => {
              const found = foundWords.includes(word);

              return (
                <button
                  key={word}
                  className={`ws-word ${found ? "found" : ""}`}
                  onClick={() => {
                    if (!found) {
                      setHintWord(word);
                      setMessage(
                        `Find ${word}. Look for its first letter, ${word[0]}.`
                      );

                      if (voiceEnabled) {
                        speakText(`Find ${word}.`);
                      }
                    }
                  }}
                  aria-pressed={found}
                >
                  {found ? "✓ " : ""}
                  {word}
                </button>
              );
            })}
          </div>

          <div
            className={`ws-message ${levelComplete ? "success" : ""}`}
            role="status"
            aria-live="polite"
          >
            {levelComplete ? "🎉 " : ""}
            {message}
          </div>

          <div className="ws-actions">
            <button onClick={giveHint} disabled={levelComplete}>
              💡 Hint
            </button>

            <button onClick={() => resetLevel(levelIndex)}>
              ↻ Restart Level
            </button>

            {levelComplete && (
              <button
                className="ws-primary"
                onClick={goToNextLevel}
              >
                {levelIndex === LEVELS.length - 1
                  ? "Play Again"
                  : "Next Level →"}
              </button>
            )}
          </div>

          <p className="ws-note">
            No timer and no pressure. Take your time, ask for a hint,
            and enjoy finding each word.
          </p>
        </section>

        <section className="ws-card">
          <h2 style={{ textAlign: "center", color: "#383f83" }}>
            Your Progress
          </h2>

          <div className="ws-stats">
            <div className="ws-stat">
              <strong>{gamesCompleted}</strong>
              <span>Levels completed</span>
            </div>
            <div className="ws-stat">
              <strong>{highestLevel}</strong>
              <span>Highest level reached</span>
            </div>
          </div>

          <p className="ws-note">
            Progress is saved in this browser on this device.
            Game performance is not a medical diagnosis.
          </p>
        </section>
      </div>
    </div>
  );
}
