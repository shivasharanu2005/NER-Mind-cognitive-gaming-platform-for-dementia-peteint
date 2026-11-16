import { RecognitionCategory, RecognitionImage } from '../storage/indexedDbStorage.js';

export function createRecognitionQuestion(
  images: RecognitionImage[], category: RecognitionCategory, optionCount: number, previousId?: string,
  random: () => number = Math.random,
): { correctId: string; optionIds: string[] } | null {
  const pool = images.filter((item) => item.category === category);
  if (pool.length < optionCount || optionCount < 2) return null;
  const shuffled = (values: RecognitionImage[]) => {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const eligible = pool.filter((item) => item.id !== previousId);
  const correct = shuffled(eligible.length ? eligible : pool)[0];
  const distractors = shuffled(pool.filter((item) => item.id !== correct.id)).slice(0, optionCount - 1);
  return { correctId: correct.id, optionIds: shuffled([correct, ...distractors]).map((item) => item.id) };
}
