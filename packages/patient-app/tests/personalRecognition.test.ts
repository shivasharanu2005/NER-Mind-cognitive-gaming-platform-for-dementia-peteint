import { beforeEach, describe, expect, it } from 'vitest';
import { createRecognitionQuestion } from '../src/games/recognitionQuestion.js';
import { createPersonVoiceQuestion } from '../src/games/IdentifyPersonGame.js';
import { IndexedDbStorageService, RecognitionImage, RecognitionAttempt } from '../src/storage/indexedDbStorage.js';

const photo = (id: string, category: RecognitionImage['category'] = 'family'): RecognitionImage => ({
  id, patientId: 'patient-ner-001', name: id, category, description: '', mimeType: 'image/png',
  image: new Blob([id], { type: 'image/png' }), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
});

describe('personal recognition game', () => {
  beforeEach(async () => IndexedDbStorageService.resetForTesting());

  it('only creates choices from the selected category and includes one correct image', () => {
    const library = [photo('Dad'), photo('Mom'), photo('Uncle'), photo('Dog', 'animals')];
    for (const optionCount of [2, 3]) {
      const question = createRecognitionQuestion(library, 'family', optionCount, undefined, () => 0.45);
      expect(question).not.toBeNull();
      expect(question!.optionIds).toHaveLength(optionCount);
      expect(new Set(question!.optionIds).size).toBe(optionCount);
      expect(question!.optionIds).toContain(question!.correctId);
      expect(question!.optionIds).not.toContain('Dog');
    }
  });

  it('requires enough caretaker photos for the selected difficulty', () => {
    const library = [photo('Dad'), photo('Mom'), photo('Dog', 'animals')];
    expect(createRecognitionQuestion(library, 'family', 2)).not.toBeNull();
    expect(createRecognitionQuestion(library, 'family', 3)).toBeNull();
    expect(createRecognitionQuestion(library, 'family', 4)).toBeNull();
  });

  it('uses only selected family profiles with recorded voices for person questions', () => {
    const family = [
      { ...photo('Dad'), voice: new Blob(['dad'], { type: 'audio/webm' }) },
      { ...photo('Mom'), voice: new Blob(['mom'], { type: 'audio/webm' }) },
      { ...photo('Uncle'), voice: new Blob(['uncle'], { type: 'audio/webm' }), includeInPersonGame: false },
      { ...photo('Brother'), voice: undefined },
      { ...photo('Dog', 'animals'), voice: new Blob(['dog'], { type: 'audio/webm' }) },
    ];
    const question = createPersonVoiceQuestion(family, 2, undefined, () => 0.4);
    expect(question).not.toBeNull();
    expect(question!.optionIds).toHaveLength(2);
    expect(question!.optionIds).toContain(question!.correctId);
    expect(question!.optionIds.every((id) => id === 'Dad' || id === 'Mom')).toBe(true);
    expect(createPersonVoiceQuestion(family, 3)).toBeNull();
  });

  it('stores voice recordings with a caretaker-controlled game selection', async () => {
    const person = { ...photo('Dad'), voice: new Blob(['recorded voice'], { type: 'audio/webm' }), voiceMimeType: 'audio/webm', includeInPersonGame: false };
    await IndexedDbStorageService.saveRecognitionImage(person);
    const [saved] = await IndexedDbStorageService.getRecognitionImages('patient-ner-001');
    expect(saved.voice?.type).toBe('audio/webm');
    expect(saved.includeInPersonGame).toBe(false);
  });

  it('updates the same person-game question when the patient retries', async () => {
    const base: RecognitionAttempt = {
      id: 'question-1', patientId: 'patient-ner-001', category: 'family', imageId: 'Dad', correct: false,
      durationMs: 2100, difficulty: 'easy', answeredAt: new Date().toISOString(), activity: 'identify-person',
    };
    await IndexedDbStorageService.recordRecognitionAttempt(base);
    await IndexedDbStorageService.recordRecognitionAttempt({ ...base, durationMs: 4600 });
    const attempts = await IndexedDbStorageService.getRecognitionAttempts('patient-ner-001');
    expect(attempts).toHaveLength(1);
    expect(attempts[0].durationMs).toBe(4600);
  });

  it('saves and reads caregiver photos and patient answer progress by patient', async () => {
    await IndexedDbStorageService.saveRecognitionImage(photo('Dad'));
    await IndexedDbStorageService.saveRecognitionImage(photo('Dog', 'animals'));
    const attempt: RecognitionAttempt = {
      id: 'attempt-1', patientId: 'patient-ner-001', category: 'family', imageId: 'Dad', correct: true,
      durationMs: 3400, difficulty: 'easy', answeredAt: new Date().toISOString(),
    };
    await IndexedDbStorageService.recordRecognitionAttempt(attempt);
    expect((await IndexedDbStorageService.getRecognitionImages('patient-ner-001')).map((item) => item.name)).toEqual(['Dad', 'Dog']);
    expect(await IndexedDbStorageService.getRecognitionAttempts('patient-ner-001')).toEqual([attempt]);
    await IndexedDbStorageService.deleteRecognitionImage('Dad');
    expect((await IndexedDbStorageService.getRecognitionImages('patient-ner-001')).map((item) => item.name)).toEqual(['Dog']);
  });
});
