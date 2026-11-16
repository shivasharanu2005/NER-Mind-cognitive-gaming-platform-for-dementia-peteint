
import React, { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = 2 | 4 | 6 | 9;

type Piece = {
  id: number;
  correctPosition: number;
};

type PuzzleImage = {
  id: number;
  name: string;
  src: string;
};

const PUZZLE_IMAGES: PuzzleImage[] = [
  { id: 1, name: "Mountain Lake", src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900" },
  { id: 2, name: "Beautiful Flowers", src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900" },
  { id: 3, name: "Cute Dog", src: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=900" },
  { id: 4, name: "Cute Cat", src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900" },
  { id: 5, name: "Green Forest", src: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=900" },
  { id: 6, name: "Beautiful Beach", src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900" },
  { id: 7, name: "Colorful Birds", src: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900" },
  { id: 8, name: "Butterfly", src: "https://images.unsplash.com/photo-1550747528-cdb45925b3f2?w=900" },
  { id: 9, name: "Green Garden", src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900" },
  { id: 10, name: "Waterfall", src: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=900" },
  { id: 11, name: "Sunflower", src: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=900" },
  { id: 12, name: "Red Rose", src: "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=900" },
  { id: 13, name: "Green Mountains", src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900" },
  { id: 14, name: "Beautiful Lake", src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900" },
  { id: 15, name: "Elephant", src: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=900" },
  { id: 16, name: "Horse", src: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=900" },
  { id: 17, name: "Green Leaves", src: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=900" },
  { id: 18, name: "Fresh Fruits", src: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=900" },
  { id: 19, name: "Apple", src: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=900" },
  { id: 20, name: "Orange", src: "https://images.unsplash.com/photo-1547514701-42782101795e?w=900" },
  { id: 21, name: "Village House", src: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=900" },
  { id: 22, name: "Beautiful House", src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900" },
  { id: 23, name: "Red Car", src: "https://images.unsplash.com/photo-1492144534655-ae79c964d34e?w=900" },
  { id: 24, name: "Bicycle", src: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=900" },
  { id: 25, name: "Beautiful Sunrise", src: "https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=900" },
  { id: 26, name: "Ocean", src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=900" },
  { id: 27, name: "Panda", src: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=900" },
  { id: 28, name: "Deer", src: "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=900" },
  { id: 29, name: "Green Park", src: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=900" },
  { id: 30, name: "Beautiful Sky", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900" },
  { id: 31, name: "Cute Rabbit", src: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=900" },
  { id: 32, name: "Peacock", src: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=900" },
];

const STORAGE_KEY = "dementia-jigsaw-progress";

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

export default function SimpleJigsawPuzzle() {
  const [difficulty, setDifficulty] = useState<Difficulty>(4);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [placed, setPlaced] = useState<Record<number, number>>({});
  const [moves, setMoves] = useState(0);
  const [preview, setPreview] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [completedGames, setCompletedGames] = useState(0);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState<PuzzleImage>(
    PUZZLE_IMAGES[0]
  );
  const [gameNumber, setGameNumber] = useState(1);

  const completionHandled = useRef(false);
  const imageHistory = useRef<number[]>([1]);

  const columns = difficulty === 2 || difficulty === 4 ? 2 : 3;
  const rows = Math.ceil(difficulty / columns);

  const completedCount = Object.keys(placed).length;
  const isComplete = completedCount === difficulty;

  const percent = Math.round(
    (completedCount / difficulty) * 100
  );

  const announce = (message: string) => {
    if (
      voiceEnabled &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance(message);
      speech.rate = 0.85;
      speech.pitch = 1;

      window.speechSynthesis.speak(speech);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const data = JSON.parse(saved);
        setCompletedGames(data.completedGames ?? 0);
        setBestMoves(data.bestMoves ?? null);
      }
    } catch {
      console.warn("Could not load saved progress.");
    }
  }, []);

  const startGame = (level: Difficulty = difficulty) => {
    const newPieces = Array.from(
      { length: level },
      (_, index) => ({
        id: index,
        correctPosition: index,
      })
    );

    setDifficulty(level);
    setPieces(shuffle(newPieces));
    setPlaced({});
    setSelectedPiece(null);
    setMoves(0);
    setPreview(true);
    setShowHint(false);
    setImageLoaded(false);

    completionHandled.current = false;
  };

  useEffect(() => {
    startGame(4);
    // Initialize the first puzzle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPieceStyle = (
    position: number
  ): React.CSSProperties => {
    const row = Math.floor(position / columns);
    const column = position % columns;

    return {
      backgroundImage: `url("${currentImage.src}")`,
      backgroundSize: `${columns * 100}% ${rows * 100}%`,
      backgroundPosition: `${
        (column / (columns - 1)) * 100
      }% ${
        rows === 1 ? 0 : (row / (rows - 1)) * 100
      }%`,
      backgroundRepeat: "no-repeat",
    };
  };

  const nextImage = () => {
    const availableImages = PUZZLE_IMAGES.filter(
      (image) => !imageHistory.current.includes(image.id)
    );

    // When all images have been used, start a new image cycle.
    if (availableImages.length === 0) {
      imageHistory.current = [currentImage.id];
      availableImages.push(
        ...PUZZLE_IMAGES.filter(
          (image) => image.id !== currentImage.id
        )
      );
    }

    const selected =
      availableImages[
        Math.floor(Math.random() * availableImages.length)
      ];

    imageHistory.current.push(selected.id);
    setCurrentImage(selected);
    setGameNumber((current) => current + 1);
  };

  const handleCompletion = () => {
    if (completionHandled.current) return;

    completionHandled.current = true;

    let newCompleted = completedGames + 1;
    let newBest =
      bestMoves === null ? moves : Math.min(bestMoves, moves);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data = saved ? JSON.parse(saved) : {};

      newCompleted = (data.completedGames ?? 0) + 1;
      const oldBest = data.bestMoves ?? null;

      newBest =
        oldBest === null
          ? moves
          : Math.min(oldBest, moves);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          completedGames: newCompleted,
          bestMoves: newBest,
        })
      );
    } catch {
      console.warn("Could not save progress.");
    }

    setCompletedGames(newCompleted);
    setBestMoves(newBest);

    announce("Wonderful! You completed the puzzle. Well done!");

    // Automatically load another image after a short celebration.
    window.setTimeout(() => {
      nextImage();
      startGame(difficulty);
    }, 3000);
  };

  useEffect(() => {
    if (isComplete) {
      handleCompletion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const placePiece = (slot: number, pieceId: number) => {
    if (
      isComplete ||
      placed[slot] !== undefined ||
      pieceId < 0 ||
      pieceId >= difficulty
    ) {
      return;
    }

    setMoves((current) => current + 1);
    setSelectedPiece(null);

    if (pieceId === slot) {
      setPlaced((current) => ({
        ...current,
        [slot]: pieceId,
      }));

      announce("Good job! You found the right place.");
    } else {
      announce("Good try. Let's find the matching place.");
    }
  };

  const handleSlotClick = (slot: number) => {
    if (placed[slot] !== undefined || isComplete) return;

    if (selectedPiece !== null) {
      placePiece(slot, selectedPiece);
    } else {
      announce("Choose a puzzle piece first.");
    }
  };

  const handlePieceClick = (pieceId: number) => {
    if (isComplete) return;

    setSelectedPiece((current) =>
      current === pieceId ? null : pieceId
    );
  };

  const handleHint = () => {
    if (isComplete) return;

    const nextSlot = Array.from(
      { length: difficulty },
      (_, index) => index
    ).find((index) => placed[index] === undefined);

    if (nextSlot === undefined) return;

    setShowHint(true);
    setSelectedPiece(nextSlot);

    announce(
      `Look for piece number ${nextSlot + 1}.`
    );
  };

  const resetGame = () => {
    startGame(difficulty);
  };

  const unplacedPieces = useMemo(
    () =>
      pieces.filter(
        (piece) =>
          placed[piece.correctPosition] === undefined
      ),
    [pieces, placed]
  );

  return (
    <div className="jigsaw-app">
      <style>{`
        .jigsaw-app {
          --primary: #176b57;
          --dark: #104b3e;
          --bg: #f4f8f5;
          --card: #ffffff;
          --text: #20352e;
          --border: #d6e5dc;

          min-height: 100vh;
          padding: 24px;
          background: var(--bg);
          color: var(--text);
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
        }

        .jigsaw-app *,
        .jigsaw-app *::before,
        .jigsaw-app *::after {
          box-sizing: border-box;
        }

        .jigsaw-shell {
          width: 100%;
          max-width: 1100px;
          margin: auto;
        }

        .jigsaw-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .jigsaw-header h1 {
          color: var(--dark);
          font-size: clamp(27px, 4vw, 38px);
          margin: 0 0 10px;
        }

        .jigsaw-header p {
          color: #52685e;
          font-size: 17px;
          line-height: 1.6;
        }

        .jigsaw-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 5px 20px #1946300d;
        }

        .jigsaw-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .jigsaw-label {
          display: block;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 9px;
        }

        .jigsaw-levels,
        .jigsaw-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .jigsaw-app button {
          font: inherit;
          cursor: pointer;
          border: 2px solid transparent;
          border-radius: 12px;
          min-height: 46px;
          padding: 10px 16px;
          font-weight: 700;
        }

        .jigsaw-app button:focus-visible {
          outline: 3px solid #e6a23c;
          outline-offset: 3px;
        }

        .jigsaw-app button:disabled {
          cursor: default;
        }

        .jigsaw-level-button,
        .jigsaw-secondary {
          color: var(--dark);
          background: #edf5ef;
          border-color: var(--border) !important;
        }

        .jigsaw-level-button.active,
        .jigsaw-primary {
          background: var(--primary);
          color: white;
          border-color: var(--primary) !important;
        }

        .jigsaw-primary:hover {
          background: var(--dark);
        }

        .jigsaw-game-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, .85fr);
          gap: 24px;
          align-items: start;
        }

        .jigsaw-section-title {
          font-size: 21px;
          margin: 0 0 7px;
          color: var(--dark);
        }

        .jigsaw-description {
          margin: 0 0 18px;
          line-height: 1.6;
          color: #52685e;
          font-size: 15px;
        }

        .jigsaw-board {
          display: grid;
          gap: 5px;
          width: 100%;
          max-width: 430px;
          margin: auto;
          padding: 8px;
          background: #e2ece5;
          border-radius: 16px;
          border: 2px solid var(--border);
        }

        .jigsaw-slot {
          aspect-ratio: 1;
          min-width: 0;
          padding: 0 !important;
          overflow: hidden;
          border-radius: 7px !important;
          border: 2px dashed #a7bdb0 !important;
          background: #f5f8f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .jigsaw-slot.filled {
          border-style: solid !important;
          border-color: #7db49b !important;
        }

        .jigsaw-slot.hint {
          border: 4px solid #e5a13c !important;
          box-shadow: inset 0 0 0 2px white;
        }

        .jigsaw-slot-number {
          font-size: clamp(20px, 4vw, 34px);
          font-weight: 700;
          color: var(--dark);
        }

        .jigsaw-picture {
          width: 100%;
          height: 100%;
          background-repeat: no-repeat;
        }

        .jigsaw-preview {
          max-width: 430px;
          margin: 16px auto 0;
        }

        .jigsaw-preview img {
          width: 100%;
          max-height: 170px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .jigsaw-piece-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .jigsaw-piece {
          padding: 0 !important;
          aspect-ratio: 1;
          overflow: hidden;
          background-color: #edf3ee;
          border: 3px solid transparent !important;
          border-radius: 12px !important;
          position: relative;
          min-width: 0;
          background-repeat: no-repeat;
        }

        .jigsaw-piece.selected {
          border-color: #e5a13c !important;
          box-shadow: 0 0 0 2px #fff2d9;
        }

        .jigsaw-piece:disabled {
          opacity: .28;
        }

        .jigsaw-piece-number {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: white;
          color: var(--dark);
          padding: 3px 7px;
          border-radius: 8px;
          font-size: 13px;
        }

        .jigsaw-progress {
          height: 12px;
          width: 100%;
          background: #e5ede7;
          border-radius: 99px;
          overflow: hidden;
          margin: 10px 0;
        }

        .jigsaw-progress-fill {
          height: 100%;
          background: #38a276;
          transition: width .3s ease;
        }

        .jigsaw-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .jigsaw-stat {
          background: #f2f7f3;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 13px 8px;
          text-align: center;
        }

        .jigsaw-stat strong {
          display: block;
          font-size: 23px;
          color: var(--dark);
          margin-bottom: 5px;
        }

        .jigsaw-stat span {
          font-size: 13px;
          color: #52685e;
        }

        .jigsaw-message {
          margin-top: 18px;
          padding: 16px;
          border-radius: 14px;
          background: #edf6ef;
          color: var(--dark);
          line-height: 1.6;
          font-weight: 600;
        }

        .jigsaw-success {
          background: #e2f6e8;
          border: 1px solid #a9d7b6;
          text-align: center;
        }

        .jigsaw-success h3 {
          font-size: 25px;
        }

        .jigsaw-note {
          font-size: 13px;
          color: #617368;
          line-height: 1.6;
          margin-top: 14px;
        }

        .jigsaw-image-name {
          display: inline-block;
          background: #edf6ef;
          color: var(--dark);
          border-radius: 20px;
          padding: 7px 13px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        @media (max-width: 760px) {
          .jigsaw-app {
            padding: 14px;
          }

          .jigsaw-card {
            padding: 16px;
          }

          .jigsaw-game-grid {
            grid-template-columns: 1fr;
          }

          .jigsaw-toolbar {
            align-items: flex-start;
          }

          .jigsaw-stats {
            gap: 6px;
          }

          .jigsaw-stat strong {
            font-size: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .jigsaw-app * {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>

      <div className="jigsaw-shell">
        <header className="jigsaw-header">
          <h1>🧩 Simple Jigsaw Puzzle</h1>
          <p>
            Put the picture together, one piece at a time.
            There is no time limit. Enjoy the game!
          </p>
        </header>

        <section className="jigsaw-card">
          <div className="jigsaw-toolbar">
            <div>
              <span className="jigsaw-label">Choose Your Level</span>

              <div className="jigsaw-levels">
                {([2, 4, 6, 9] as Difficulty[]).map((level) => (
                  <button
                    key={level}
                    className={
                      difficulty === level
                        ? "jigsaw-level-button active"
                        : "jigsaw-level-button"
                    }
                    onClick={() => startGame(level)}
                    aria-pressed={difficulty === level}
                  >
                    {level} Pieces
                  </button>
                ))}
              </div>
            </div>

            <button
              className="jigsaw-secondary"
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);

                if (next) {
                  const speech = new SpeechSynthesisUtterance(
                    "Voice guidance is on."
                  );
                  window.speechSynthesis.speak(speech);
                } else {
                  window.speechSynthesis.cancel();
                }
              }}
            >
              {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
            </button>
          </div>

          <div className="jigsaw-game-grid">
            <div>
              <h2 className="jigsaw-section-title">
                Your Puzzle Board
              </h2>

              <div className="jigsaw-image-name">
                🖼️ {currentImage.name}
              </div>

              <p className="jigsaw-description">
                Select a piece and then select its correct position.
                You can also drag a piece onto the board.
              </p>

              <div
                className="jigsaw-board"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: difficulty }, (_, slot) => {
                  const filled = placed[slot] !== undefined;
                  const isHint =
                    showHint &&
                    selectedPiece === slot &&
                    !filled;

                  return (
                    <button
                      key={slot}
                      className={[
                        "jigsaw-slot",
                        filled ? "filled" : "",
                        isHint ? "hint" : "",
                      ].join(" ")}
                      onClick={() => handleSlotClick(slot)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();

                        const id = Number(
                          event.dataTransfer.getData("text/plain")
                        );

                        if (Number.isInteger(id)) {
                          placePiece(slot, id);
                        }
                      }}
                      disabled={filled || isComplete}
                      aria-label={`Position ${slot + 1}`}
                    >
                      {filled ? (
                        <div
                          className="jigsaw-picture"
                          style={getPieceStyle(slot)}
                        />
                      ) : (
                        <span className="jigsaw-slot-number">
                          {slot + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {preview && (
                <div className="jigsaw-preview">
                  <span className="jigsaw-label">
                    Picture to Complete
                  </span>

                  <img
                    src={currentImage.src}
                    alt={currentImage.name}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(false)}
                  />

                  {!imageLoaded && (
                    <p className="jigsaw-note">
                      Loading picture...
                    </p>
                  )}
                </div>
              )}

              <div className="jigsaw-stats">
                <div className="jigsaw-stat">
                  <strong>
                    {completedCount}/{difficulty}
                  </strong>
                  <span>Pieces Placed</span>
                </div>

                <div className="jigsaw-stat">
                  <strong>{moves}</strong>
                  <span>Moves</span>
                </div>

                <div className="jigsaw-stat">
                  <strong>{percent}%</strong>
                  <span>Completed</span>
                </div>
              </div>

              <div
                className="jigsaw-progress"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="jigsaw-progress-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div>
              <h2 className="jigsaw-section-title">
                Puzzle Pieces
              </h2>

              <p className="jigsaw-description">
                Tap a piece and find its matching position.
                Take your time!
              </p>

              <div className="jigsaw-piece-grid">
                {unplacedPieces.map((piece) => (
                  <button
                    key={piece.id}
                    className={[
                      "jigsaw-piece",
                      selectedPiece === piece.id ? "selected" : "",
                    ].join(" ")}
                    style={getPieceStyle(piece.correctPosition)}
                    onClick={() => handlePieceClick(piece.id)}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "text/plain",
                        String(piece.id)
                      );
                    }}
                    aria-label={`Puzzle piece ${piece.id + 1}`}
                    aria-pressed={selectedPiece === piece.id}
                  >
                    <span className="jigsaw-piece-number">
                      {piece.id + 1}
                    </span>
                  </button>
                ))}
              </div>

              {selectedPiece !== null && (
                <div className="jigsaw-message" role="status">
                  Piece {selectedPiece + 1} selected.
                  Now tap its matching position.
                </div>
              )}

              <div className="jigsaw-actions">
                <button
                  className="jigsaw-primary"
                  onClick={handleHint}
                  disabled={isComplete}
                >
                  💡 Show Hint
                </button>

                <button
                  className="jigsaw-secondary"
                  onClick={() => setPreview((current) => !current)}
                >
                  {preview ? "Hide Picture" : "Show Picture"}
                </button>

                <button
                  className="jigsaw-secondary"
                  onClick={resetGame}
                >
                  ↻ Restart Puzzle
                </button>
              </div>

              <p className="jigsaw-note">
                Start with 2 pieces and gradually increase
                difficulty when the player feels comfortable.
              </p>
            </div>
          </div>

          {isComplete && (
            <div className="jigsaw-message jigsaw-success">
              <h3>🎉 Wonderful Work!</h3>

              <p>
                You completed {currentImage.name} successfully!
                All {difficulty} pieces are in the correct place.
              </p>

              <p>
                Loading your next picture in 3 seconds...
              </p>

              <button
                className="jigsaw-primary"
                onClick={() => {
                  // Allow the patient to move to the next image immediately.
                  // Completion has already been recorded.
                  nextImage();
                  startGame(difficulty);
                }}
              >
                Next Picture →
              </button>
            </div>
          )}
        </section>

        <section className="jigsaw-card">
          <h2 className="jigsaw-section-title">
            Your Game Progress
          </h2>

          <p className="jigsaw-description">
            Your game progress is saved on this device.
          </p>

          <div className="jigsaw-stats">
            <div className="jigsaw-stat">
              <strong>{completedGames}</strong>
              <span>Games Completed</span>
            </div>

            <div className="jigsaw-stat">
              <strong>{bestMoves ?? "—"}</strong>
              <span>Best Move Count</span>
            </div>

            <div className="jigsaw-stat">
              <strong>{gameNumber}</strong>
              <span>Current Game</span>
            </div>
          </div>

          <p className="jigsaw-note">
            This is a cognitive engagement game, not a medical
            diagnostic tool. Progress is saved locally and is
            not automatically shared with a caregiver.
          </p>
        </section>
      </div>
    </div>
  );
}
