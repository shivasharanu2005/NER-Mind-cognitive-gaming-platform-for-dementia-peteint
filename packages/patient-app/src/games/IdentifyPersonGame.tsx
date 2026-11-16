import React, { useEffect, useMemo, useRef, useState } from 'react';
import { OfflineStorageService } from '../storage/localStorage.js';
import { RecognitionAttempt, RecognitionImage } from '../storage/indexedDbStorage.js';
import { SpeechService } from '../audio/speechService.js';
import { createRecognitionQuestion } from './recognitionQuestion.js';

type Difficulty = 'easy' | 'medium' | 'hard';
const OPTION_COUNT: Record<Difficulty, number> = { easy: 2, medium: 3, hard: 4 };

export function createPersonVoiceQuestion(
  profiles: RecognitionImage[], optionCount: number, previousId?: string, random: () => number = Math.random,
) {
  const eligible = profiles.filter((item) => item.category === 'family' && item.voice && item.includeInPersonGame !== false);
  return createRecognitionQuestion(eligible, 'family', optionCount, previousId, random);
}

export const IdentifyPersonGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const patientId = OfflineStorageService.getPatientProfile().patientId;
  const [profiles, setProfiles] = useState<RecognitionImage[]>([]);
  const [progress, setProgress] = useState<RecognitionAttempt[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [wrongChoiceId, setWrongChoiceId] = useState<string | null>(null);
  const [wrongTries, setWrongTries] = useState(0);
  const [solved, setSolved] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [questionRecordId, setQuestionRecordId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [allProfiles, allAttempts] = await Promise.all([
        OfflineStorageService.getRecognitionImages(patientId), OfflineStorageService.getRecognitionAttempts(patientId),
      ]);
      setProfiles(allProfiles.filter((item) => item.category === 'family' && item.voice && item.includeInPersonGame !== false));
      setProgress(allAttempts.filter((attempt) => attempt.activity === 'identify-person'));
    } catch { setError('Family voices could not be opened. Please return to the caregiver library and try again.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, [patientId]);
  useEffect(() => () => {
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const current = profiles.find((item) => item.id === currentId);
  const optionCount = OPTION_COUNT[difficulty];

  const replayVoice = async (person = current) => {
    if (!person?.voice || !audioRef.current) return;
    setAudioError(false);
    audioRef.current.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    const source = URL.createObjectURL(person.voice);
    audioUrlRef.current = source;
    audioRef.current.src = source;
    audioRef.current.load();
    try { await audioRef.current.play(); setAudioError(false); }
    catch { setAudioError(true); }
  };

  const startQuestion = async (previous = currentId) => {
    const next = createPersonVoiceQuestion(profiles, optionCount, previous || undefined);
    if (!next) return;
    setCurrentId(next.correctId);
    setOptionIds(next.optionIds);
    setWrongChoiceId(null); setWrongTries(0); setSolved(false); setQuestionStartedAt(Date.now()); setQuestionRecordId(`identify-person-${patientId}-${crypto.randomUUID()}`); setError('');
    const person = profiles.find((item) => item.id === next.correctId);
    if (person) await replayVoice(person);
  };

  const saveAnswer = async (person: RecognitionImage, wasCorrectFirstTry: boolean) => {
    const attempt: RecognitionAttempt = {
      // Reusing the question ID makes retries update one question instead of inflating totals.
      id: questionRecordId,
      patientId, category: 'family', imageId: person.id, correct: wasCorrectFirstTry,
      durationMs: Math.max(0, Date.now() - questionStartedAt), difficulty, answeredAt: new Date().toISOString(),
      activity: 'identify-person',
    };
    await OfflineStorageService.recordRecognitionAttempt(attempt);
    setProgress((previous) => [...previous.filter((entry) => entry.id !== attempt.id), attempt]);
  };

  const chooseAnswer = async (id: string) => {
    if (!current || solved || saving) return;
    if (id !== current.id) {
      const nextWrongTries = wrongTries + 1;
      setWrongTries(nextWrongTries); setWrongChoiceId(id); setSaving(true); setError('');
      try { await saveAnswer(current, false); }
      catch { setError('Your answer could not be saved. Please try again.'); }
      finally { setSaving(false); }
      SpeechService.speak('Good try. Listen again and take your time.', 0.85, undefined, undefined, () => { void replayVoice(current); });
      return;
    }
    setSaving(true); setError('');
    try {
      await saveAnswer(current, wrongTries === 0);
      setSolved(true); setWrongChoiceId(null);
      SpeechService.speak(wrongTries === 0 ? 'That is right. Well done!' : 'You found the voice. Well done!');
    } catch { setError('Your answer could not be saved. Please try again.'); }
    finally { setSaving(false); }
  };

  const dailyProgress = progress.filter((attempt) => new Date(attempt.answeredAt).toDateString() === new Date().toDateString());
  const correctCount = progress.filter((attempt) => attempt.correct).length;
  const incorrectCount = progress.length - correctCount;
  const accuracy = progress.length ? Math.round((correctCount / progress.length) * 100) : 0;
  const usableProfiles = useMemo(() => profiles.filter((item) => item.voice && item.includeInPersonGame !== false), [profiles]);

  return <div style={{ maxWidth: 900, margin: '0 auto', padding: '4px 0 32px', color: '#17324D' }}>
    <audio ref={audioRef} preload="none" />
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
      <div><div style={{ color: '#9C2754', fontSize: 14, fontWeight: 800, letterSpacing: '.04em' }}>FAMILY VOICE GAME</div><h2 style={{ margin: '4px 0', fontSize: 30 }}>Identify the Person</h2></div>
      <button type="button" onClick={() => { audioRef.current?.pause(); onExit(); }} style={secondaryButton}>Exit game</button>
    </header>
    <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.5, marginTop: 0 }}>Listen to a familiar family voice, then tap the name you hear.</p>
    {error && <p role="alert" style={{ color: '#B91C1C', fontWeight: 700 }}>{error}</p>}

    {loading ? <div role="status" style={{ textAlign: 'center', padding: 36 }}>Loading family voices…</div> : usableProfiles.length < optionCount ? <section style={panelStyle}>
      <div style={{ fontSize: 48, textAlign: 'center' }}>🎙️</div><h3 style={{ textAlign: 'center', fontSize: 23 }}>More family voices needed</h3>
      <p style={{ textAlign: 'center', color: '#475569', fontSize: 16, lineHeight: 1.5 }}>Ask your caregiver to add and select at least {optionCount} family members with voice recordings for this level.</p>
      <DifficultyControl difficulty={difficulty} onChange={setDifficulty} />
      <button type="button" onClick={onExit} style={{ ...secondaryButton, display: 'block', margin: '18px auto 0' }}>Back to games</button>
    </section> : !current ? <section style={panelStyle}>
      <div style={{ fontSize: 50, textAlign: 'center' }}>👂</div><h3 style={{ fontSize: 24, textAlign: 'center', margin: '8px 0' }}>Ready to listen?</h3>
      <p style={{ textAlign: 'center', color: '#475569', fontSize: 17 }}>Choose how many names you would like to see.</p>
      <DifficultyControl difficulty={difficulty} onChange={setDifficulty} />
      <button type="button" onClick={() => void startQuestion(null)} style={{ ...primaryButton, display: 'block', width: '100%', maxWidth: 400, margin: '20px auto 0' }}>Start listening</button>
    </section> : <section style={panelStyle} aria-label="Identify the speaking family member">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><span style={{ color: '#9C2754', background: '#FBE8EE', padding: '7px 13px', borderRadius: 99, fontSize: 14, fontWeight: 800 }}>{difficulty[0].toUpperCase() + difficulty.slice(1)} · {optionCount} names</span></div>
      <h3 style={{ textAlign: 'center', fontSize: 30, margin: '4px 0 18px' }}>Who is speaking?</h3>
      <button type="button" onClick={() => void replayVoice()} style={{ ...secondaryButton, display: 'block', minHeight: 58, margin: '0 auto 20px', color: '#9C2754', borderColor: '#F6A6A6', fontSize: 18 }}>🔊 Replay voice</button>
      <button type="button" onClick={() => { audioRef.current?.pause(); SpeechService.speak('Listen to the voice. Who is speaking? Tap the name you hear.', 0.85, undefined, undefined, () => { void replayVoice(); }); }} style={{ ...secondaryButton, display: 'block', minHeight: 48, margin: '0 auto 16px' }}>Hear instructions</button>
      {audioError && <p role="status" style={{ textAlign: 'center', color: '#9A3412', fontWeight: 700 }}>Tap Replay voice to listen again.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {optionIds.map((id, index) => { const person = profiles.find((profile) => profile.id === id)!; const isWrongSelection = wrongChoiceId === id;
          return <button key={id} type="button" disabled={solved || saving} onClick={() => void chooseAnswer(id)} style={{ border: `2px solid ${isWrongSelection ? '#E11D48' : solved && id === current.id ? '#16A34A' : '#D8A1B4'}`, background: isWrongSelection ? '#FFF1F2' : solved && id === current.id ? '#DCFCE7' : '#FFFFFF', borderRadius: 17, minHeight: 76, padding: '14px 18px', textAlign: 'left', color: '#17324D', fontSize: 22, fontWeight: 800, cursor: solved || saving ? 'default' : 'pointer', boxShadow: '0 3px 10px rgba(18,59,99,.05)' }}><span style={{ color: '#9C2754', marginRight: 12 }}>{String.fromCharCode(65 + index)}.</span>{person.name}</button>;
        })}
      </div>
      {!solved && wrongTries > 0 && <div role="status" aria-live="polite" style={{ textAlign: 'center', background: '#FFF7DC', color: '#755700', padding: 14, borderRadius: 14, marginTop: 16, fontSize: 17, fontWeight: 700 }}>Good try. Take your time. Listen again, then choose the name you hear.</div>}
      {solved && <div role="status" aria-live="polite" style={{ textAlign: 'center', color: wrongTries === 0 ? '#166534' : '#426B45', background: '#E8F7EF', padding: 14, borderRadius: 14, marginTop: 16, fontSize: 21, fontWeight: 800 }}>{wrongTries === 0 ? `That’s right! ${current.name} was speaking. 🌟` : `You found it! ${current.name} was speaking. 🌟`}</div>}
      <button type="button" disabled={!solved || saving} onClick={() => void startQuestion(currentId)} style={{ ...primaryButton, display: 'block', width: '100%', marginTop: 18, opacity: solved ? 1 : .55 }}>{saving ? 'Saving…' : 'Next question →'}</button>
    </section>}

    <section aria-label="Identify the Person progress" style={{ marginTop: 18 }}>
      <h3 style={{ fontSize: 20, margin: '0 0 10px' }}>Practice progress</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        <ProgressCard label="Questions" value={`${progress.length} total · ${dailyProgress.length} today`} />
        <ProgressCard label="Correct" value={`${correctCount}`} />
        <ProgressCard label="Incorrect" value={`${incorrectCount}`} />
        <ProgressCard label="Accuracy" value={`${accuracy}%`} />
      </div>
    </section>
  </div>;
};

const DifficultyControl: React.FC<{ difficulty: Difficulty; onChange: (level: Difficulty) => void }> = ({ difficulty, onChange }) => <label style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 360, margin: '14px auto', fontWeight: 700, fontSize: 16 }}>Answer choices<select value={difficulty} onChange={(event) => onChange(event.target.value as Difficulty)} style={{ minHeight: 50, border: '1px solid #94A3B8', borderRadius: 12, padding: 10, fontSize: 17, color: '#17324D', background: '#FFFFFF' }}><option value="easy">Easy · 2 names</option><option value="medium">Medium · 3 names</option><option value="hard">Hard · 4 names</option></select></label>;
const ProgressCard: React.FC<{ label: string; value: string }> = ({ label, value }) => <div style={{ border: '1px solid #DDE5ED', borderRadius: 14, padding: 14, background: '#F8FAFC' }}><div style={{ color: '#64748B', fontSize: 14, fontWeight: 700 }}>{label}</div><div style={{ marginTop: 5, color: '#17324D', fontSize: 18, fontWeight: 800 }}>{value}</div></div>;
const panelStyle: React.CSSProperties = { borderRadius: 22, border: '2px solid #F6A6A6', background: '#FFFFFF', padding: 22, boxShadow: '0 4px 16px rgba(18,59,99,.05)' };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 14, background: '#9C2754', color: 'white', minHeight: 60, padding: 14, fontSize: 19, fontWeight: 800, cursor: 'pointer' };
const secondaryButton: React.CSSProperties = { border: '1px solid #94A3B8', borderRadius: 12, background: 'white', color: '#17324D', minHeight: 48, padding: '10px 17px', fontSize: 16, fontWeight: 700, cursor: 'pointer' };
