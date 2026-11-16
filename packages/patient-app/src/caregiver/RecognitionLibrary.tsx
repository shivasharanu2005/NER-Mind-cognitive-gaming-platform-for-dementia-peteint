import React, { useEffect, useState } from 'react';
import { OfflineStorageService } from '../storage/localStorage.js';
import { RecognitionCategory, RecognitionImage } from '../storage/indexedDbStorage.js';

const CATEGORIES: { id: RecognitionCategory; label: string }[] = [
  { id: 'family', label: 'Family members' }, { id: 'friends', label: 'Friends & relatives' },
  { id: 'animals', label: 'Animals' }, { id: 'plants', label: 'Plants' }, { id: 'objects', label: 'Familiar objects' },
];
const emptyDraft = { name: '', relationship: '', category: 'family' as RecognitionCategory, description: '' };

export const RecognitionLibrary: React.FC = () => {
  const patientId = OfflineStorageService.getPatientProfile().patientId;
  const [items, setItems] = useState<RecognitionImage[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<RecognitionCategory | 'all'>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const refresh = async () => {
    try { setItems(await OfflineStorageService.getRecognitionImages(patientId)); }
    catch { setError('The photo library could not be opened. Your saved photos remain on this device.'); }
  };
  useEffect(() => { void refresh(); }, [patientId]);

  const reset = () => { setDraft(emptyDraft); setFile(null); setEditing(null); setError(''); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSaved('');
    if (!draft.name.trim()) { setError('Enter a name or label.'); return; }
    if (draft.category === 'family' && !draft.relationship.trim()) { setError('Enter this family member’s relationship, such as Dad, Mom, or Uncle.'); return; }
    if (items.some((item) => item.id !== editing && item.category === draft.category && item.name.trim().toLocaleLowerCase() === draft.name.trim().toLocaleLowerCase())) {
      setError('Each photo in a category needs a different answer label. Choose a unique name.'); return;
    }
    if (!editing && !file) { setError('Choose a photo to upload.'); return; }
    if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError('Use a JPG, PNG, or WebP image smaller than 5 MB.'); return;
    }
    setBusy(true);
    try {
      if (file) {
        const bitmap = await createImageBitmap(file);
        bitmap.close();
      }
      const previous = items.find((item) => item.id === editing);
      const now = new Date().toISOString();
      await OfflineStorageService.saveRecognitionImage({
        id: editing || crypto.randomUUID(), patientId, name: draft.name.trim(), category: draft.category,
        description: draft.description.trim(), relationship: draft.category === 'family' ? draft.relationship.trim() : undefined,
        mimeType: file?.type || previous?.mimeType || 'image/jpeg',
        image: file || previous!.image, createdAt: previous?.createdAt || now, updatedAt: now,
        voice: previous?.voice, voiceMimeType: previous?.voiceMimeType,
        includeInPersonGame: previous?.includeInPersonGame !== false,
      });
      await refresh(); reset(); setSaved(editing ? 'Photo details updated.' : 'Photo added to the recognition library.');
    } catch (saveError) {
      setError(saveError instanceof Error && (saveError.message.includes('Secure photo storage') || saveError.message.includes('Secure photo'))
        ? 'Secure storage is unavailable here. Open NER-MIND in a secure browser context and try again.'
        : 'This image could not be read or saved. Please choose a valid photo and try again.');
    } finally { setBusy(false); }
  };

  const beginEdit = (item: RecognitionImage) => {
    setEditing(item.id); setDraft({ name: item.name, relationship: item.relationship || '', category: item.category, description: item.description }); setFile(null);
    setError(''); setSaved('');
    document.getElementById('recognition-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const remove = async (item: RecognitionImage) => {
    const message = item.category === 'family'
      ? `Delete the family profile and its saved voice for “${item.name}”?`
      : `Delete the photo “${item.name}”?`;
    if (!window.confirm(message)) return;
    await OfflineStorageService.deleteRecognitionImage(item.id); await refresh();
    if (editing === item.id) reset();
    setSaved('Photo deleted.');
  };

  const visible = items.filter((item) => filter === 'all' || item.category === filter);
  return <section style={{ maxWidth: 1100, margin: '0 auto', padding: 24, color: '#17324D' }}>
    <h2 style={{ margin: '0 0 8px', fontSize: 28 }}>Personal recognition photos</h2>
    <p style={{ margin: '0 0 22px', color: '#475569', lineHeight: 1.5, fontSize: 16 }}>
      Add familiar photos and the labels the patient uses. Photos stay on this device. The game uses these labels; it does not identify people in photos.
    </p>
    <form id="recognition-editor" onSubmit={save} style={{ background: '#F8FAFC', padding: 20, border: '1px solid #CBD5E1', borderRadius: 18, marginBottom: 22 }}>
      <h3 style={{ fontSize: 20, margin: '0 0 14px' }}>{editing ? 'Edit photo' : 'Add a photo'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <label style={labelStyle}>Name or label<input required maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="For example, Dad" style={inputStyle} /></label>
        {draft.category === 'family' && <label style={labelStyle}>Relationship<input required maxLength={60} value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value })} placeholder="For example, Father" style={inputStyle} /></label>}
        <label style={labelStyle}>Category<select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as RecognitionCategory })} style={inputStyle}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
        <label style={labelStyle}>Photo{editing ? ' (optional replacement)' : ''}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} style={inputStyle} /></label>
        <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>Description (optional)<textarea maxLength={240} rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></label>
      </div>
      <p style={{ color: '#64748B', fontSize: 13 }}>JPG, PNG or WebP, up to 5 MB. Please use photos you have permission to share.</p>
      {error && <p role="alert" style={{ color: '#B91C1C', fontWeight: 700 }}>{error}</p>}
      {saved && <p role="status" style={{ color: '#166534', fontWeight: 700 }}>{saved}</p>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button disabled={busy} type="submit" style={primaryButton}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add photo'}</button>
        {editing && <button type="button" onClick={reset} style={secondaryButton}>Cancel edit</button>}
      </div>
    </form>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
      <h3 style={{ fontSize: 20, margin: 0, flex: 1 }}>Photo library ({items.length})</h3>
      <label style={{ fontWeight: 700 }}>Show <select value={filter} onChange={(e) => setFilter(e.target.value as RecognitionCategory | 'all')} style={{ ...inputStyle, width: 'auto', marginLeft: 8 }}>{[{ id: 'all', label: 'All categories' }, ...CATEGORIES].map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
    </div>
    {items.length === 0 ? <p style={{ padding: 24, background: '#F8FAFC', borderRadius: 14, color: '#475569' }}>No photos yet. Add at least two photos in a category to play with that category.</p> :
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {visible.map((item) => <RecognitionPhotoCard key={item.id} item={item} onEdit={() => beginEdit(item)} onDelete={() => void remove(item)} />)}
      </div>}
  </section>;
};

const RecognitionPhotoCard: React.FC<{ item: RecognitionImage; onEdit: () => void; onDelete: () => void }> = ({ item, onEdit, onDelete }) => {
  const [src, setSrc] = useState('');
  useEffect(() => { const url = URL.createObjectURL(item.image); setSrc(url); return () => URL.revokeObjectURL(url); }, [item.image]);
  return <article style={{ border: '1px solid #CBD5E1', borderRadius: 16, overflow: 'hidden', background: 'white' }}>
    {src && <img src={src} alt="" style={{ display: 'block', width: '100%', height: 170, objectFit: 'cover' }} />}
    <div style={{ padding: 14 }}><strong style={{ fontSize: 18 }}>{item.name}</strong><div style={{ color: '#475569', marginTop: 4 }}>{item.category === 'family' && item.relationship ? `${item.relationship} · ` : ''}{CATEGORIES.find((c) => c.id === item.category)?.label}</div>{item.description && <p style={{ color: '#64748B', margin: '8px 0 0' }}>{item.description}</p>}
      {item.category === 'family' && <div style={{ marginTop: 10, color: '#64748B', fontSize: 14 }}>Manage voice recording and game selection in Recognition Voice.</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button type="button" onClick={onEdit} style={secondaryButton}>Edit</button><button type="button" onClick={onDelete} style={{ ...secondaryButton, color: '#B91C1C' }}>Delete</button></div>
    </div>
  </article>;
};

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7, fontWeight: 700, color: '#334155' };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #94A3B8', borderRadius: 10, background: 'white', minHeight: 46, padding: '10px 12px', fontSize: 16, color: '#17324D' };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 12, background: '#1677D2', color: 'white', minHeight: 48, padding: '10px 20px', fontSize: 16, fontWeight: 800, cursor: 'pointer' };
const secondaryButton: React.CSSProperties = { border: '1px solid #94A3B8', borderRadius: 10, background: 'white', color: '#17324D', minHeight: 42, padding: '8px 14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' };
