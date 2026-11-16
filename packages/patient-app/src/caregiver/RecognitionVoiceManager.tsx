import React, { useEffect, useMemo, useRef, useState } from 'react';
import { OfflineStorageService } from '../storage/localStorage.js';
import { RecognitionImage } from '../storage/indexedDbStorage.js';

type VoiceSource = 'record' | 'upload';
const MAX_VOICE_BYTES = 10 * 1024 * 1024;
const RECORD_LIMIT_MS = 20_000;

export const RecognitionVoiceManager: React.FC<{ onOpenPhotoLibrary: () => void }> = ({ onOpenPhotoLibrary }) => {
  const patientId = OfflineStorageService.getPatientProfile().patientId;
  const [family, setFamily] = useState<RecognitionImage[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [voiceDraft, setVoiceDraft] = useState<Blob | undefined>();
  const [includeInGame, setIncludeInGame] = useState(true);
  const [source, setSource] = useState<VoiceSource>('record');
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const keepRecordingRef = useRef(true);

  const selected = family.find((member) => member.id === selectedId);
  const eligibleCount = useMemo(() => family.filter((member) => member.voice && member.includeInPersonGame !== false).length, [family]);

  const refresh = async () => {
    try {
      const all = await OfflineStorageService.getRecognitionImages(patientId);
      const members = all.filter((item) => item.category === 'family');
      setFamily(members);
      setSelectedId((previous) => members.some((member) => member.id === previous) ? previous : members[0]?.id || '');
    } catch { setError('Family profiles could not be loaded. Please try again.'); }
  };
  useEffect(() => { void refresh(); }, [patientId]);
  useEffect(() => {
    setVoiceDraft(selected?.voice);
    setIncludeInGame(selected?.includeInPersonGame !== false);
    setError(''); setNotice('');
  }, [selectedId, selected?.updatedAt]);

  const stopRecording = (keep = true) => {
    keepRecordingRef.current = keep;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    else { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setRecording(false); }
  };

  const startRecording = async () => {
    setError(''); setNotice('');
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setError('Live recording is not supported here. Choose Upload recording to use an existing audio file.'); return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; chunksRef.current = []; keepRecordingRef.current = true;
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        if (keepRecordingRef.current && chunksRef.current.length) {
          setVoiceDraft(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
          setNotice('Recording ready. Play it back, then save it to this family member.');
        }
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null; recorderRef.current = null; setRecording(false);
      };
      recorder.start(); setRecording(true);
      timerRef.current = window.setTimeout(() => stopRecording(true), RECORD_LIMIT_MS);
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null;
      setRecording(false); setError('Microphone access was unavailable. Choose Upload recording to use an existing audio file.');
    }
  };

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    recorderRef.current?.stop(); streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const selectMember = (id: string) => { stopRecording(false); setSelectedId(id); };
  const chooseUpload = (file?: File) => {
    setError(''); setNotice('');
    if (!file) return;
    if (!file.type.startsWith('audio/') || file.size > MAX_VOICE_BYTES) {
      setError('Choose an audio recording smaller than 10 MB.'); return;
    }
    setVoiceDraft(file); setNotice('Audio file ready. Play it back, then save it to this family member.');
  };

  const save = async () => {
    if (!selected) return;
    if (voiceDraft && (!voiceDraft.type.startsWith('audio/') || voiceDraft.size > MAX_VOICE_BYTES)) {
      setError('Choose an audio recording smaller than 10 MB.'); return;
    }
    setSaving(true); setError(''); setNotice('');
    try {
      await OfflineStorageService.saveRecognitionImage({
        ...selected, voice: voiceDraft, voiceMimeType: voiceDraft?.type || undefined,
        includeInPersonGame: includeInGame, updatedAt: new Date().toISOString(),
      });
      await refresh(); setNotice(voiceDraft ? 'Voice saved. The patient game will play this recording.' : 'Saved. This member will not appear until a voice is added.');
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message.includes('Secure photo storage')
        ? 'Secure voice storage needs a secure browser context such as HTTPS or localhost.'
        : 'Voice recording could not be saved. Please try again.');
    } finally { setSaving(false); }
  };

  const removeVoice = () => { setVoiceDraft(undefined); setIncludeInGame(false); setNotice('Voice removal is pending. Save to remove it from this device.'); };

  return <section style={{ maxWidth: 1000, margin: '0 auto', padding: 24, color: '#17324D' }}>
    <h2 style={{ margin: '0 0 8px', fontSize: 28 }}>Recognition Voice</h2>
    <p style={{ margin: '0 0 22px', color: '#475569', lineHeight: 1.5, fontSize: 16 }}>Manage the actual family voice recordings used by Identify the Person. Record a voice live or upload an existing recording, preview it, then save it for the patient game.</p>
    {family.length === 0 ? <div style={panelStyle}><h3 style={{ marginTop: 0 }}>Add family profiles first</h3><p style={{ color: '#475569', lineHeight: 1.5 }}>Create a family member with a name, relationship, and photo in the recognition photo library. Then come back here to add their voice.</p><button type="button" onClick={onOpenPhotoLibrary} style={primaryButton}>Open photo library</button></div> : <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14, marginBottom: 18 }}>
        <label style={fieldLabel}>Family member<select value={selectedId} onChange={(event) => selectMember(event.target.value)} style={inputStyle}>{family.map((member) => <option key={member.id} value={member.id}>{member.name}{member.relationship ? ` — ${member.relationship}` : ''}</option>)}</select></label>
        <div style={{ ...panelStyle, padding: 14 }}><div style={{ color: '#64748B', fontSize: 14, fontWeight: 700 }}>Ready for the game</div><strong style={{ display: 'block', fontSize: 23, marginTop: 5 }}>{eligibleCount} family {eligibleCount === 1 ? 'voice' : 'voices'}</strong><span style={{ color: '#64748B', fontSize: 13 }}>Selected members with a saved recording</span></div>
      </div>
      {selected && <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}><FamilyPhoto image={selected.image} name={selected.name} /><div><h3 style={{ fontSize: 22, margin: 0 }}>{selected.name}</h3><div style={{ color: '#64748B', marginTop: 4 }}>{selected.relationship || 'Family member'} · {selected.voice ? 'Voice saved' : 'No voice saved yet'}</div></div></div>
        <div role="tablist" aria-label="Choose voice recording method" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <button type="button" role="tab" aria-selected={source === 'record'} onClick={() => { stopRecording(false); setSource('record'); setError(''); }} style={sourceButton(source === 'record')}>Record live voice</button>
          <button type="button" role="tab" aria-selected={source === 'upload'} onClick={() => { stopRecording(false); setSource('upload'); setError(''); }} style={sourceButton(source === 'upload')}>Upload existing recording</button>
        </div>
        {source === 'record' ? <div style={sourcePanel}>
          <strong style={{ fontSize: 18 }}>Record a new voice clip</strong>
          <p style={{ margin: '6px 0 14px', color: '#64748B' }}>Record up to 20 seconds. Ask the family member to say a familiar greeting or short phrase.</p>
          {!recording ? <button type="button" onClick={() => void startRecording()} style={primaryButton}>🎙️ Start recording</button> : <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><span role="status" style={{ color: '#B91C1C', fontWeight: 800 }}>● Recording…</span><button type="button" onClick={() => stopRecording(true)} style={{ ...secondaryButton, color: '#B91C1C' }}>Stop and keep recording</button></div>}
        </div> : <div style={sourcePanel}>
          <label style={fieldLabel}>Choose an audio recording<input type="file" accept="audio/*" onChange={(event) => chooseUpload(event.target.files?.[0])} style={inputStyle} /></label>
          <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: 14 }}>Audio files up to 10 MB. The game plays this file itself; it does not generate a voice from the label.</p>
        </div>}
        {voiceDraft && <div style={{ marginTop: 16 }}><strong style={{ display: 'block', marginBottom: 8 }}>Preview the recording</strong><VoicePreview blob={voiceDraft} /></div>}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, fontSize: 16, fontWeight: 700, color: '#334155' }}><input type="checkbox" checked={includeInGame} disabled={!voiceDraft} onChange={(event) => setIncludeInGame(event.target.checked)} style={{ width: 22, height: 22 }} />Include {selected.name} in Identify the Person</label>
        {error && <p role="alert" style={{ color: '#B91C1C', fontWeight: 700 }}>{error}</p>}{notice && <p role="status" style={{ color: '#166534', fontWeight: 700 }}>{notice}</p>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}><button type="button" disabled={saving || recording} onClick={() => void save()} style={{ ...primaryButton, opacity: saving || recording ? .6 : 1 }}>{saving ? 'Saving…' : 'Save voice and game selection'}</button>{selected.voice && <button type="button" disabled={saving || recording} onClick={removeVoice} style={{ ...secondaryButton, color: '#B91C1C' }}>Remove saved voice</button>}</div>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 0 }}>Voice recordings are encrypted and kept on this device. They are played only for selected family members in the patient game.</p>
      </div>}
    </>}
  </section>;
};

const FamilyPhoto: React.FC<{ image: Blob; name: string }> = ({ image, name }) => {
  const [src, setSrc] = useState('');
  useEffect(() => { const url = URL.createObjectURL(image); setSrc(url); return () => URL.revokeObjectURL(url); }, [image]);
  return src ? <img src={src} alt="" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', background: '#F1F5F9' }} /> : <span aria-hidden="true" style={{ width: 64, height: 64, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#FBE8EE', fontSize: 25 }}>{name.slice(0, 1)}</span>;
};
const VoicePreview: React.FC<{ blob: Blob }> = ({ blob }) => {
  const [src, setSrc] = useState('');
  useEffect(() => { const url = URL.createObjectURL(blob); setSrc(url); return () => URL.revokeObjectURL(url); }, [blob]);
  return src ? <audio controls src={src} aria-label="Preview selected family member voice" style={{ width: '100%', maxWidth: 560, minHeight: 46 }} /> : null;
};
const fieldLabel: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7, fontWeight: 700, color: '#334155' };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #94A3B8', borderRadius: 10, background: 'white', minHeight: 48, padding: '10px 12px', fontSize: 16, color: '#17324D' };
const panelStyle: React.CSSProperties = { border: '1px solid #DDE5ED', borderRadius: 18, background: '#FFFFFF', padding: 20, boxShadow: '0 3px 12px rgba(18,59,99,.04)' };
const sourcePanel: React.CSSProperties = { border: '1px solid #DDE5ED', borderRadius: 16, background: '#F8FAFC', padding: 18 };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 12, background: '#9C2754', color: '#FFFFFF', minHeight: 50, padding: '11px 18px', fontSize: 16, fontWeight: 800, cursor: 'pointer' };
const secondaryButton: React.CSSProperties = { border: '1px solid #94A3B8', borderRadius: 10, background: '#FFFFFF', color: '#17324D', minHeight: 46, padding: '10px 16px', fontSize: 15, fontWeight: 700, cursor: 'pointer' };
const sourceButton = (active: boolean): React.CSSProperties => ({ border: `2px solid ${active ? '#9C2754' : '#CBD5E1'}`, borderRadius: 12, background: active ? '#FBE8EE' : '#FFFFFF', color: active ? '#9C2754' : '#334155', minHeight: 48, padding: '10px 16px', fontSize: 16, fontWeight: 800, cursor: 'pointer' });
