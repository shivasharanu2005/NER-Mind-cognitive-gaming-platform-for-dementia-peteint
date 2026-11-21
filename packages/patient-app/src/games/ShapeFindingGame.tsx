
import { useEffect, useState } from "react";
import { GameLevelManager, TOTAL_GAME_LEVELS } from "../services/GameLevelManager.js";
import { GameLevelHeader } from "../components/common/GameLevelHeader.js";

type Shape =
  | "Circle" | "Square" | "Triangle" | "Rectangle"
  | "Oval" | "Pentagon" | "Hexagon" | "Diamond" | "Star";

type Option = {
  id: string;
  shape: Shape;
  color: string;
};

const ALL_AVAILABLE_SHAPES: Shape[] = [
  "Circle", "Square", "Triangle", "Rectangle",
  "Oval", "Pentagon", "Hexagon", "Diamond", "Star"
];

// Progressive 30 levels with escalating visual complexity
function getShapesForLevel(lvl: number): Shape[] {
  // Tier 1 (Levels 1-6): Gentle start with 2-3 shapes
  if (lvl === 1) return ["Circle", "Square"];
  if (lvl === 2) return ["Circle", "Triangle"];
  if (lvl === 3) return ["Square", "Triangle"];
  if (lvl === 4) return ["Circle", "Square", "Triangle"];
  if (lvl === 5) return ["Circle", "Square", "Rectangle"];
  if (lvl === 6) return ["Square", "Triangle", "Rectangle"];

  // Tier 2 (Levels 7-12): 4 distinct shapes
  if (lvl === 7) return ["Circle", "Square", "Triangle", "Rectangle"];
  if (lvl === 8) return ["Circle", "Square", "Triangle", "Oval"];
  if (lvl === 9) return ["Circle", "Triangle", "Rectangle", "Oval"];
  if (lvl === 10) return ["Square", "Rectangle", "Oval", "Diamond"];
  if (lvl === 11) return ["Circle", "Triangle", "Oval", "Diamond"];
  if (lvl === 12) return ["Triangle", "Rectangle", "Diamond", "Pentagon"];

  // Tier 3 (Levels 13-18): 5 shapes with subtle angles
  if (lvl === 13) return ["Circle", "Square", "Triangle", "Rectangle", "Oval"];
  if (lvl === 14) return ["Circle", "Square", "Rectangle", "Oval", "Pentagon"];
  if (lvl === 15) return ["Square", "Triangle", "Rectangle", "Pentagon", "Hexagon"];
  if (lvl === 16) return ["Triangle", "Rectangle", "Diamond", "Pentagon", "Hexagon"];
  if (lvl === 17) return ["Circle", "Oval", "Diamond", "Hexagon", "Star"];
  if (lvl === 18) return ["Square", "Diamond", "Pentagon", "Hexagon", "Star"];

  // Tier 4 (Levels 19-24): 6-7 shapes with visual density
  if (lvl === 19) return ["Circle", "Square", "Triangle", "Rectangle", "Oval", "Pentagon"];
  if (lvl === 20) return ["Square", "Triangle", "Rectangle", "Oval", "Pentagon", "Hexagon"];
  if (lvl === 21) return ["Circle", "Triangle", "Rectangle", "Pentagon", "Hexagon", "Diamond"];
  if (lvl === 22) return ["Triangle", "Rectangle", "Oval", "Hexagon", "Diamond", "Star"];
  if (lvl === 23) return ["Circle", "Square", "Oval", "Pentagon", "Hexagon", "Diamond", "Star"];
  if (lvl === 24) return ["Square", "Rectangle", "Oval", "Pentagon", "Hexagon", "Diamond", "Star"];

  // Tier 5 (Levels 25-30): 8-9 shapes with high interference (Grand Master challenge)
  if (lvl === 25) return ["Circle", "Square", "Triangle", "Rectangle", "Oval", "Pentagon", "Hexagon", "Diamond"];
  if (lvl === 26) return ["Square", "Triangle", "Rectangle", "Oval", "Pentagon", "Hexagon", "Diamond", "Star"];
  if (lvl === 27) return ["Circle", "Triangle", "Rectangle", "Oval", "Pentagon", "Hexagon", "Diamond", "Star"];
  if (lvl === 28) return ALL_AVAILABLE_SHAPES;
  if (lvl === 29) return ALL_AVAILABLE_SHAPES;
  return ALL_AVAILABLE_SHAPES; // Level 30
}

const COLORS = [
  "#4389E8", "#F39A56", "#39A985", "#AA83E8",
  "#E66D89", "#E4BB45", "#54B8C4", "#E07845", "#7189CF",
];

function shuffle<T,>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makePuzzle(level: number) {
  const shapes = getShapesForLevel(level);
  const target = shapes[Math.floor(Math.random() * shapes.length)];

  const options: Option[] = shuffle(
    shapes.map((shape, index) => ({
      id: `${level}-${shape}-${Math.random().toString(36).slice(2)}`,
      shape,
      color: COLORS[index % COLORS.length],
    }))
  );

  return { target, options };
}

function speak(text: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const message = new SpeechSynthesisUtterance(text);
    message.rate = 0.82;
    window.speechSynthesis.speak(message);
  }
}

function ShapeIcon({
  shape, color,
}: {
  shape: Shape; color: string;
}) {
  const common = {
    fill: color,
    stroke: "#30445B",
    strokeWidth: 2.5,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 120 120" className="shape-art" aria-hidden="true">
      {shape === "Circle" && <circle cx="60" cy="60" r="39" {...common} />}
      {shape === "Square" && <rect x="22" y="22" width="76" height="76" rx="5" {...common} />}
      {shape === "Triangle" && <polygon points="60,14 106,100 14,100" {...common} />}
      {shape === "Rectangle" && <rect x="12" y="31" width="96" height="58" rx="5" {...common} />}
      {shape === "Oval" && <ellipse cx="60" cy="60" rx="47" ry="31" {...common} />}
      {shape === "Pentagon" && <polygon points="60,12 105,45 88,100 32,100 15,45" {...common} />}
      {shape === "Hexagon" && <polygon points="35,16 85,16 108,60 85,104 35,104 12,60" {...common} />}
      {shape === "Diamond" && <polygon points="60,10 105,60 60,110 15,60" {...common} />}
      {shape === "Star" && <polygon points="60,8 73,42 109,43 81,66 91,103 60,82 29,103 39,66 11,43 47,42" {...common} />}
    </svg>
  );
}

const css = `
* { box-sizing: border-box; }

.sf-game {
  --blue: #347bd0;
  --text: #21364d;
  --muted: #64758a;
  width: min(100% - 24px, 960px);
  margin: 24px auto;
  padding: clamp(16px, 3vw, 32px);
  color: var(--text);
  font-family: Inter, "Segoe UI", Arial, sans-serif;
  background:
    radial-gradient(ellipse at top left, #e4f2ff, transparent 42%),
    radial-gradient(ellipse at bottom right, #e4f7ed, transparent 38%),
    #f4f8fd;
  border: 1px solid #e3edf6;
  border-radius: 26px;
}

.sf-game button { font: inherit; -webkit-tap-highlight-color: transparent; }
.sf-game button:focus-visible { outline: 4px solid #f0bd4e; outline-offset: 3px; }

.sf-header, .sf-brand, .sf-level-row, .sf-footer, .sf-actions,
.sf-bottom-stats {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap;
}

.sf-header { margin-bottom: 24px; }
.sf-brand { justify-content: flex-start; }

.sf-logo {
  width: 58px; height: 58px; display: grid; place-items: center;
  border-radius: 18px; color: white; font-size: 32px;
  background: linear-gradient(135deg, #347bd0, #77b8ef);
  box-shadow: 0 8px 20px #347bd02a;
}

.sf-eyebrow {
  margin: 0 0 6px; color: var(--blue);
  font-size: 11px; font-weight: 800; letter-spacing: 1.2px;
}

.sf-title { margin: 0; font-size: clamp(25px, 4vw, 34px); font-weight: 800; }
.sf-muted { color: var(--muted); line-height: 1.65; font-size: 17px; }

.sf-voice, .sf-secondary, .sf-restart {
  min-height: 50px; padding: 12px 16px; border: 1px solid #d7e5f4;
  border-radius: 14px; background: white; color: var(--text);
  font-weight: 700; cursor: pointer;
}

.sf-voice-on { background: #e0f5e9; border-color: #9bd5b5; }

.sf-level-card, .sf-panel, .sf-bottom-stats {
  padding: 22px; margin-bottom: 20px; border: 1px solid #dce6f0;
  border-radius: 21px; background: #ffffffed;
  box-shadow: 0 5px 20px #254b7010;
}

.sf-level-row { margin-bottom: 16px; }
.sf-level-row h2 { margin: 0; font-size: 25px; }
.sf-level-row h2 span { color: var(--muted); font-size: 16px; font-weight: 500; }

.sf-round { padding: 10px 14px; border-radius: 12px; background: #edf5ff; }
.sf-progress-track { height: 12px; background: #e6edf5; border-radius: 30px; overflow: hidden; }
.sf-progress-fill { height: 100%; background: linear-gradient(90deg, #347bd0, #64b9a1); transition: width .3s ease; }
.sf-level-note { margin: 12px 0 0; color: var(--muted); font-size: 15px; }

.sf-panel { padding: clamp(20px, 4vw, 36px); text-align: center; }
.sf-icon { font-size: 32px; margin-bottom: 10px; }
.sf-panel h2 { font-size: clamp(23px, 3vw, 30px); margin: 8px 0 12px; }
.sf-instruction { max-width: 600px; margin: 0 auto 24px; color: var(--muted); font-size: 18px; line-height: 1.65; }

.sf-target {
  width: min(100%, 290px); margin: 24px auto; padding: 22px;
  border: 2px solid #e1edfb; border-radius: 22px;
  background: linear-gradient(145deg, #f3f8ff, white);
}

.sf-target .shape-art { width: 155px; height: 155px; }
.sf-shape-name { display: block; margin-top: 8px; font-size: 22px; font-weight: 800; }
.shape-art { display: block; width: 100%; height: 100%; }

.sf-mini-target {
  width: min(100%, 390px); margin: 22px auto; padding: 14px;
  display: flex; align-items: center; justify-content: center; gap: 15px;
  border: 2px solid #e0ecfa; border-radius: 18px; background: #f5f9ff;
  text-align: left;
}

.sf-mini-target .shape-art { width: 82px; height: 82px; }
.sf-mini-target strong { display: block; margin-top: 5px; font-size: 20px; }

.sf-options { display: grid; gap: 14px; margin: 25px 0; }
.sf-option {
  min-width: 0; min-height: 170px; padding: 14px 8px;
  display: flex; flex-direction: column; justify-content: center;
  align-items: center; gap: 9px;
  border: 2px solid #dce6f0; border-radius: 19px;
  background: white; color: var(--text); font-size: 17px;
  font-weight: 750; cursor: pointer;
  transition: transform .18s, border-color .18s, box-shadow .18s;
}
.sf-option:hover { transform: translateY(-3px); border-color: #8cb9ef; box-shadow: 0 8px 20px #347bd01c; }
.sf-option-selected { border-color: var(--blue); background: #eef6ff; }
.sf-option-hint { border-color: #269568; box-shadow: 0 0 0 3px #39a98530; }
.sf-option .shape-art { width: 100px; height: 100px; }

.sf-primary {
  width: min(100%, 520px); min-height: 60px; padding: 15px 20px;
  border: none; border-radius: 16px;
  background: linear-gradient(110deg, #347bd0, #428fe0);
  color: white; font-size: 18px; font-weight: 800; cursor: pointer;
  box-shadow: 0 7px 18px #347bd02b; transition: transform .2s;
}
.sf-primary:hover { transform: translateY(-2px); }

.sf-feedback { min-height: 30px; color: #31577d; font-size: 17px; font-weight: 700; line-height: 1.6; }
.sf-actions { justify-content: center; }
.sf-success { font-size: 55px; color: #22865d; }
.sf-bottom-stats { justify-content: space-around; margin-top: 20px; }
.sf-bottom-stats span { color: #31577d; font-size: 16px; }
.sf-footer { margin-top: 18px; color: var(--muted); font-size: 14px; }
.sf-restart { background: transparent; }

.sf-complete { padding: 35px 20px; text-align: center; }
.sf-complete h2 { font-size: 32px; }
.sf-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 25px 0; }
.sf-summary div { padding: 18px 8px; border-radius: 15px; background: #f3f8ff; }
.sf-summary strong, .sf-summary span { display: block; }
.sf-summary strong { font-size: 26px; color: #225ca4; }
.sf-summary span { margin-top: 6px; color: #64758a; font-size: 13px; }

@media (max-width: 560px) {
  .sf-game { width: calc(100% - 12px); margin: 6px auto; padding: 12px; border-radius: 19px; }
  .sf-header { align-items: flex-start; }
  .sf-logo { width: 46px; height: 46px; border-radius: 13px; }
  .sf-eyebrow { font-size: 9px; }
  .sf-title { font-size: 25px; }
  .sf-level-card { padding: 16px; }
  .sf-panel { padding: 18px 12px; }
  .sf-options { gap: 9px; }
  .sf-option { min-height: 140px; font-size: 15px; border-radius: 15px; }
  .sf-option .shape-art { width: 82px; height: 82px; }
  .sf-actions { flex-direction: column; }
  .sf-secondary { width: 100%; }
  .sf-summary { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .sf-game * { transition: none !important; }
}
`;

export default function ShapeFindingGame() {
  const [level, setLevel] = useState(() => GameLevelManager.getGameLevel('shapeFinding'));
  const [round, setRound] = useState(1);
  const [puzzle, setPuzzle] = useState(() => makePuzzle(GameLevelManager.getGameLevel('shapeFinding')));
  const [phase, setPhase] = useState<"preview" | "playing" | "result">("preview");
  const [feedback, setFeedback] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [voice, setVoice] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const savedLevel = GameLevelManager.getGameLevel('shapeFinding');
    setLevel(savedLevel);
    setPuzzle(makePuzzle(savedLevel));
  }, []);

  function handleSelectLevel(lvl: number) {
    setLevel(lvl);
    setRound(1);
    setPuzzle(makePuzzle(lvl));
    setPhase("preview");
    setFeedback("");
    setSelectedId(null);
    setShowHint(false);
    setCompleted(false);
    GameLevelManager.saveGameLevel('shapeFinding', lvl);
  }

  function announce(text: string) {
    if (voice) speak(text);
  }

  function choose(option: Option) {
    if (phase !== "playing") return;

    setSelectedId(option.id);
    setAttempts(value => value + 1);

    if (option.shape === puzzle.target) {
      setCorrect(value => value + 1);
      setFeedback(`Wonderful! You found the ${puzzle.target}.`);
      setPhase("result");
      announce(`Wonderful! You found the ${puzzle.target}.`);
    } else {
      setFeedback("Good try! Take your time and try another shape.");
      announce("Good try. Please try another shape.");
    }
  }

  function next() {
    if (round < 3) {
      setRound(value => value + 1);
      setPuzzle(makePuzzle(level));
    } else if (level < TOTAL_GAME_LEVELS) {
      GameLevelManager.completeLevel('shapeFinding', level, 100);
      const nextLvl = level + 1;
      setLevel(nextLvl);
      setRound(1);
      setPuzzle(makePuzzle(nextLvl));
    } else {
      GameLevelManager.completeLevel('shapeFinding', TOTAL_GAME_LEVELS, 100);
      setCompleted(true);
      announce("Congratulations! You mastered all 30 levels of Shape Finding!");
      return;
    }

    setSelectedId(null);
    setShowHint(false);
    setFeedback("");
    setPhase("preview");
  }

  function restart() {
    handleSelectLevel(1);
    setCorrect(0);
    setAttempts(0);
    setHints(0);
    setCompleted(false);
  }

  return (
    <>
      <style>{css}</style>

      <main className="sf-game">
        <header className="sf-header">
          <div className="sf-brand">
            <div className="sf-logo">✿</div>
            <div>
              <p className="sf-eyebrow">MEMORY & COGNITIVE GAMES</p>
              <h1 className="sf-title">Find the Shape</h1>
            </div>
          </div>

          <button
            className={`sf-voice ${voice ? "sf-voice-on" : ""}`}
            onClick={() => {
              if (voice) window.speechSynthesis?.cancel();
              setVoice(value => !value);
              if (!voice) speak("Voice instructions enabled.");
            }}
          >
            {voice ? "🔊 Voice On" : "🔈 Voice Off"}
          </button>
        </header>

        {completed ? (
          <section className="sf-panel sf-complete">
            <div className="sf-success">★</div>
            <h2>Wonderful Work!</h2>
            <p className="sf-muted">You completed all five levels. Well done!</p>

            <div className="sf-summary">
              <div><strong>{correct}</strong><span>Correct answers</span></div>
              <div><strong>{attempts}</strong><span>Attempts</span></div>
              <div><strong>{hints}</strong><span>Hints used</span></div>
            </div>

            <button className="sf-primary" onClick={restart}>Play Again ↻</button>
          </section>
        ) : (
          <>
            <GameLevelHeader
              gameId="shapeFinding"
              currentLevel={level}
              onSelectLevel={handleSelectLevel}
              gameTitle="Find the Shape"
            />

            <section className="sf-panel">
              {phase === "preview" && (
                <>
                  <div className="sf-icon">👀</div>
                  <h2>Look at this shape</h2>
                  <p className="sf-instruction">Remember this shape. Find the same one in the next step.</p>

                  <div className="sf-target">
                    <ShapeIcon shape={puzzle.target} color="#4389E8" />
                    <span className="sf-shape-name">{puzzle.target}</span>
                  </div>

                  <button className="sf-primary" onClick={() => {
                    setPhase("playing");
                    setFeedback("Choose the shape that matches.");
                    announce(`Find the ${puzzle.target}.`);
                  }}>
                    I'm Ready — Let's Find It →
                  </button>
                </>
              )}

              {phase === "playing" && (
                <>
                  <div className="sf-icon">🧩</div>
                  <h2>Can you find the matching shape?</h2>
                  <p className="sf-instruction">Look at the shape below and choose the same shape.</p>

                  <div className="sf-mini-target">
                    <div style={{ width: 82, height: 82 }}>
                      <ShapeIcon shape={puzzle.target} color="#4389E8" />
                    </div>
                    <div>
                      <p className="sf-eyebrow">FIND THIS SHAPE</p>
                      <strong>{showHint ? puzzle.target : "Look carefully"}</strong>
                    </div>
                  </div>

                  <div className="sf-options" style={{
                    gridTemplateColumns: puzzle.options.length <= 4
                      ? "repeat(2, minmax(0, 1fr))"
                      : "repeat(auto-fit, minmax(125px, 1fr))"
                  }}>
                    {puzzle.options.map(option => (
                      <button key={option.id}
                        className={[
                          "sf-option",
                          selectedId === option.id ? "sf-option-selected" : "",
                          showHint && option.shape === puzzle.target ? "sf-option-hint" : ""
                        ].join(" ")}
                        onClick={() => choose(option)}
                        aria-label={`Choose ${option.shape}`}>
                        <div style={{ width: 100, height: 100 }}>
                          <ShapeIcon shape={option.shape} color={option.color} />
                        </div>
                        <span>{option.shape}</span>
                      </button>
                    ))}
                  </div>

                  <p className="sf-feedback" role="status" aria-live="polite">{feedback}</p>

                  <div className="sf-actions">
                    <button className="sf-secondary" onClick={() => {
                      setShowHint(true);
                      setHints(value => value + 1);
                      setFeedback(`Look for the ${puzzle.target}.`);
                      announce(`Look for the ${puzzle.target}.`);
                    }}>💡 Give Me a Hint</button>

                    <button className="sf-secondary" onClick={() => {
                      setPuzzle(makePuzzle(level));
                      setSelectedId(null);
                      setShowHint(false);
                      setFeedback("Here is a new puzzle.");
                    }}>↻ New Puzzle</button>
                  </div>
                </>
              )}

              {phase === "result" && (
                <>
                  <div className="sf-success">✓</div>
                  <h2>Excellent Work!</h2>
                  <p className="sf-instruction">{feedback}</p>

                  <div className="sf-target">
                    <ShapeIcon shape={puzzle.target} color="#39A985" />
                    <span className="sf-shape-name">{puzzle.target}</span>
                  </div>

                  <button className="sf-primary" onClick={next}>
                    {round < 5 ? "Next Round →" :
                     level < 5 ? "Continue to Next Level →" :
                     "Finish Game ★"}
                  </button>
                </>
              )}
            </section>

            <section className="sf-bottom-stats">
              <span>✓ Correct: <strong>{correct}</strong></span>
              <span>◎ Attempts: <strong>{attempts}</strong></span>
              <span>💡 Hints: <strong>{hints}</strong></span>
            </section>

            <footer className="sf-footer">
              <span>💙 Play at your own pace</span>
              <button className="sf-restart" onClick={restart}>Restart Game</button>
            </footer>
          </>
        )}
      </main>
    </>
  );
}
