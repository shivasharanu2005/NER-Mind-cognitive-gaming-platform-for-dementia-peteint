import React, { useEffect, useMemo, useState } from 'react';
import { OfflineStorageService } from '../storage/localStorage.js';
import { RecognitionAttempt, RecognitionCategory, RecognitionImage } from '../storage/indexedDbStorage.js';
import { SpeechService } from '../audio/speechService.js';
import { createRecognitionQuestion } from './recognitionQuestion.js';
import { GameLevelManager, TOTAL_GAME_LEVELS } from '../services/GameLevelManager.js';
import { GameLevelHeader } from '../components/common/GameLevelHeader.js';

const CATEGORIES: { id: RecognitionCategory; label: string; prompt: string; icon: string }[] = [
  { id: 'family', label: 'Family members', prompt: 'Who is this person?', icon: '👨‍👩‍👧' },
  { id: 'friends', label: 'Friends & relatives', prompt: 'Who is this person?', icon: '🤝' },
  { id: 'animals', label: 'Animals', prompt: 'What animal is this?', icon: '🐾' },
  { id: 'plants', label: 'Plants', prompt: 'Which plant is this?', icon: '🌿' },
  { id: 'objects', label: 'Familiar objects', prompt: 'What is this?', icon: '🧺' },
];
type Difficulty = 'easy' | 'medium' | 'hard';

export const PersonalRecognitionGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const patientId = OfflineStorageService.getPatientProfile().patientId;
  const [currentLevel, setCurrentLevel] = useState(1);
  const [images, setImages] = useState<RecognitionImage[]>([]);
  const [attempts, setAttempts] = useState<RecognitionAttempt[]>([]);
  const [category, setCategory] = useState<RecognitionCategory>('family');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [srcs, setSrcs] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedLvl = GameLevelManager.getGameLevel('personalRecognition');
    setCurrentLevel(savedLvl);
  }, []);

  const changeLevel = (lvl: number) => {
    const bounded = Math.max(1, Math.min(TOTAL_GAME_LEVELS, lvl));
    setCurrentLevel(bounded);
    GameLevelManager.saveGameLevel('personalRecognition', bounded);
    setCurrentId(null);
  };

  const difficulty: Difficulty = currentLevel <= 6 ? 'easy' : currentLevel <= 18 ? 'medium' : 'hard';
  const rawCount = currentLevel <= 6 ? 2 : currentLevel <= 18 ? 3 : 4;

  const refresh = async () => {
    setLoading(true);
    try {
      const [library, history] = await Promise.all([
        OfflineStorageService.getRecognitionImages(patientId), OfflineStorageService.getRecognitionAttempts(patientId),
      ]);
      setImages(library); setAttempts(history.filter((item) => item.activity !== 'identify-person'));
    } catch { setError('Photos could not be loaded. Please return to the photo library and try again.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [patientId]);
  useEffect(() => {
    const urls = Object.fromEntries(images.map((item) => [item.id, URL.createObjectURL(item.image)]));
    setSrcs(urls);
    return () => Object.values(urls).forEach(URL.revokeObjectURL);
  }, [images]);

  const inCategory = useMemo(() => images.filter((item) => item.category === category), [images, category]);
  const requiredCount = Math.max(2, Math.min(inCategory.length, rawCount));
  const available = inCategory.length >= 2;
  const current = inCategory.find((item) => item.id === currentId);
  const prompt = CATEGORIES.find((item) => item.id === category)!;

  const nextQuestion = (preferredCategory = category) => {
    const question = createRecognitionQuestion(images, preferredCategory, requiredCount, currentId || undefined);
    if (!question) { setCurrentId(null); setOptionIds([]); setAnswer(null); return; }
    setCurrentId(question.correctId);
    setOptionIds(question.optionIds);
    setAnswer(null); setStartedAt(Date.now());
  };

  useEffect(() => { if (!loading && available && !currentId) nextQuestion(category); }, [loading, available, category, currentId, images, currentLevel]);

  const choose = async (selectedId: string) => {
    if (answer || saving || !current) return;
    const correct = selectedId === current.id;
    setSaving(true); setError('');
    const attempt: RecognitionAttempt = {
      id: crypto.randomUUID(), patientId, category, imageId: current.id, correct,
      durationMs: Math.max(0, Date.now() - startedAt), difficulty, answeredAt: new Date().toISOString(),
      activity: 'photo-recognition',
    };
    try {
      await OfflineStorageService.recordRecognitionAttempt(attempt);
      setAttempts((old) => [...old, attempt]);
      setAnswer(selectedId);
      if (correct) {
        GameLevelManager.completeLevel('personalRecognition', currentLevel, 100);
      }
      SpeechService.speak(correct ? `That's right. This is ${current.name}.` : `Good try. This is ${current.name}.`);
    } catch { setError('Your answer could not be saved. Please choose again.'); }
    finally { setSaving(false); }
  };

  const now = Date.now();
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
  const daily = attempts.filter((item) => new Date(item.answeredAt).getTime() >= dayStart.getTime());
  const weekly = attempts.filter((item) => new Date(item.answeredAt).getTime() >= weekStart.getTime() && new Date(item.answeredAt).getTime() <= now);
  const categoryAttempts = attempts.filter((item) => item.category === category);
  const accuracy = (list: RecognitionAttempt[]) => list.length ? Math.round(list.filter((item) => item.correct).length / list.length * 100) : 0;
  const avgTime = categoryAttempts.length ? Math.round(categoryAttempts.reduce((sum, item) => sum + item.durationMs, 0) / categoryAttempts.length / 1000) : 0;

  return <div style={{ maxWidth: 900, margin: '0 auto', padding: '4px 0 30px', color: '#17324D' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
      <div><div style={{ fontSize: 14, color: '#64748B', fontWeight: 700 }}>PERSONAL RECOGNITION</div><h2 style={{ margin: '4px 0', fontSize: 28 }}>Familiar photos</h2></div>
      <button type="button" onClick={onExit} style={secondaryButton}>Exit game</button>
    </div>

    <div style={{ marginBottom: 16 }}>
      <GameLevelHeader
        gameId="personalRecognition"
        currentLevel={currentLevel}
        onSelectLevel={(lvl) => changeLevel(lvl)}
        gameTitle="Familiar Photos"
      />
    </div>

    {error && <p role="alert" style={{ color: '#B91C1C', fontWeight: 700 }}>{error}</p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 18 }}>
      <label style={fieldLabel}>Choose a photo category<select value={category} onChange={(e) => { const next = e.target.value as RecognitionCategory; setCategory(next); setCurrentId(null); }} style={inputStyle}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    </div>
    {loading ? <div role="status" style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Loading your photos…</div> : !available ? <div style={{ textAlign: 'center', padding: 28, background: '#F8FAFC', borderRadius: 18, border: '1px solid #CBD5E1' }}>
      <div style={{ fontSize: 44 }}>{prompt.icon}</div><h3 style={{ fontSize: 22 }}>Add more {prompt.label.toLowerCase()}</h3><p style={{ fontSize: 16, color: '#475569' }}>This category needs at least 2 different photos. Ask your caregiver to add them.</p><button type="button" onClick={onExit} style={secondaryButton}>Back</button>
    </div> : current ? <section aria-label="Recognition question" style={{ borderRadius: 22, border: '2px solid #DDE5ED', background: 'white', padding: 20, boxShadow: '0 4px 16px rgba(18,59,99,.05)' }}>
      <h3 style={{ textAlign: 'center', fontSize: 25, margin: '0 0 16px' }}>{prompt.prompt}</h3>
      {srcs[current.id] && <img src={srcs[current.id]} alt="Photo to recognize" style={{ display: 'block', width: '100%', maxWidth: 540, height: 'min(46vh, 380px)', minHeight: 230, margin: '0 auto 18px', objectFit: 'contain', background: '#F1F5F9', borderRadius: 16 }} />}
      <button type="button" onClick={() => SpeechService.speak(`${prompt.prompt} ${optionIds.map((id, i) => `${String.fromCharCode(65 + i)}. ${images.find((item) => item.id === id)?.name}`).join('. ')}`)} style={{ ...secondaryButton, display: 'block', margin: '0 auto 18px', minHeight: 48 }}>🔊 Hear question and choices</button>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {optionIds.map((id, index) => { const item = images.find((entry) => entry.id === id)!; const selected = answer === id; const isCorrect = id === current.id;
          const background = answer ? isCorrect ? '#DCFCE7' : selected ? '#FEE2E2' : 'white' : 'white';
          const border = answer ? isCorrect ? '#16A34A' : selected ? '#DC2626' : '#CBD5E1' : '#64748B';
          return <button key={id} type="button" disabled={!!answer} onClick={() => void choose(id)} aria-pressed={selected} style={{ background, border: `2px solid ${border}`, borderRadius: 15, minHeight: 70, padding: '12px 16px', fontSize: 20, fontWeight: 800, color: '#17324D', cursor: answer ? 'default' : 'pointer', textAlign: 'left' }}><span style={{ marginRight: 10, color: '#64748B' }}>{String.fromCharCode(65 + index)}.</span>{item.name}</button>;
        })}
      </div>
      {answer && <div role="status" aria-live="polite" style={{ textAlign: 'center', marginTop: 18, fontSize: 22, fontWeight: 800, color: answer === current.id ? '#166534' : '#9A3412' }}>{answer === current.id ? 'Wonderful! That is right. 🌟' : `Good try. This is ${current.name}.`}</div>}
      <button type="button" disabled={!answer || saving} onClick={() => { if (currentLevel < TOTAL_GAME_LEVELS) changeLevel(currentLevel + 1); else nextQuestion(); }} style={{ ...primaryButton, display: 'block', width: '100%', marginTop: 18, opacity: answer ? 1 : .55 }}>{saving ? 'Saving answer…' : currentLevel < TOTAL_GAME_LEVELS ? `Next Level (Level ${currentLevel + 1}) →` : 'Next question →'}</button>
    </section> : null}
    <section aria-label="Your practice progress" style={{ marginTop: 18 }}>
      <h3 style={{ fontSize: 20, margin: '0 0 10px' }}>Practice progress</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
        {[['Today', daily, ''], ['Last 7 days', weekly, ''], [prompt.label, categoryAttempts, `${avgTime}s average answer time`]].map(([title, data, detail]) => {
          const rows = data as RecognitionAttempt[];
          return <div key={title as string} style={{ background: '#F8FAFC', border: '1px solid #DDE5ED', borderRadius: 14, padding: 14 }}><strong style={{ fontSize: 16 }}>{title as string}</strong><div style={{ marginTop: 5 }}>{rows.length} questions · {accuracy(rows)}% accuracy</div><div style={{ color: '#475569', fontSize: 14, marginTop: 3 }}>{rows.filter((item) => item.correct).length} correct · {rows.filter((item) => !item.correct).length} incorrect{detail ? ` · ${detail as string}` : ''}</div></div>;
        })}
      </div>
      <h4 style={{ fontSize: 17, margin: '16px 0 8px' }}>By category</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORIES.map((item) => { const rows = attempts.filter((attempt) => attempt.category === item.id); return <span key={item.id} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 10, padding: '8px 11px', fontSize: 14 }}>{item.label}: {rows.length ? `${accuracy(rows)}% (${rows.length})` : 'Not played yet'}</span>; })}
      </div>
    </section>
  </div>;
};

const fieldLabel: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, fontWeight: 700 };
const inputStyle: React.CSSProperties = { minHeight: 48, border: '1px solid #94A3B8', borderRadius: 12, padding: '10px 12px', fontSize: 16, background: 'white', color: '#17324D' };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 14, background: '#1677D2', color: 'white', minHeight: 58, padding: 14, fontSize: 19, fontWeight: 800, cursor: 'pointer' };
const secondaryButton: React.CSSProperties = { border: '1px solid #94A3B8', borderRadius: 12, background: 'white', color: '#17324D', minHeight: 46, padding: '10px 16px', fontSize: 16, fontWeight: 700, cursor: 'pointer' };
