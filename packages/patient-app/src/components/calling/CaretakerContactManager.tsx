import React, { useState, useEffect } from 'react';
import { CaretakerContact } from '@ner-mind/core';
import { CallingStorageService } from '../../calling/callingStorage.js';
import { CallingService } from '../../calling/callingService.js';
import { OfflineStorageService } from '../../storage/localStorage.js';

export const CaretakerContactManager: React.FC = () => {
  const [contacts, setContacts] = useState<CaretakerContact[]>(() => CallingStorageService.getContacts());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phoneOrUserId, setPhoneOrUserId] = useState('');
  const [relationship, setRelationship] = useState('Son / Daughter');
  const [photoUrl, setPhotoUrl] = useState('');
  const [avatarColor, setAvatarColor] = useState('#2563EB');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isEmergencyContact, setIsEmergencyContact] = useState(true);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const activePatient = OfflineStorageService.getPatientProfile();

  useEffect(() => {
    setContacts(CallingStorageService.getContacts());
    const unsub = CallingStorageService.subscribe(() => {
      setContacts(CallingStorageService.getContacts());
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setName('');
    setPhoneOrUserId('');
    setRelationship('Son / Daughter');
    setPhotoUrl('');
    setAvatarColor('#2563EB');
    setIsPrimary(false);
    setIsEmergencyContact(true);
    setEditId(null);
    setIsEditing(false);
    setFormMsg(null);
  };

  const handleEditClick = (c: CaretakerContact) => {
    setEditId(c.id);
    setName(c.name);
    setPhoneOrUserId(c.phoneOrUserId);
    setRelationship(c.relationship);
    setPhotoUrl(c.photoUrl || '');
    setAvatarColor(c.avatarColor || '#2563EB');
    setIsPrimary(Boolean(c.isPrimary));
    setIsEmergencyContact(Boolean(c.isEmergencyContact));
    setIsEditing(true);
    setFormMsg(null);
  };

  const handleDeleteClick = (contactId: string) => {
    if (window.confirm('Are you sure you want to remove this contact from the patient’s calling screen?')) {
      CallingStorageService.deleteContact(contactId);
      setFormMsg('Contact removed successfully.');
      setTimeout(() => setFormMsg(null), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a name.');
      return;
    }
    if (!phoneOrUserId.trim()) {
      alert('Please enter a phone number or user ID.');
      return;
    }

    if (isEditing && editId) {
      const existing = contacts.find((c) => c.id === editId);
      if (existing) {
        CallingStorageService.updateContact({
          ...existing,
          name: name.trim(),
          phoneOrUserId: phoneOrUserId.trim(),
          relationship: relationship.trim(),
          photoUrl: photoUrl.trim() || undefined,
          avatarColor,
          isPrimary,
          isEmergencyContact,
        });
        setFormMsg(`Updated contact for "${name.trim()}".`);
      }
    } else {
      CallingStorageService.addContact({
        patientId: activePatient.patientId,
        name: name.trim(),
        phoneOrUserId: phoneOrUserId.trim(),
        relationship: relationship.trim(),
        photoUrl: photoUrl.trim() || undefined,
        avatarColor,
        isPrimary,
        isEmergencyContact,
      });
      setFormMsg(`Added "${name.trim()}" to patient’s calling cards.`);
    }

    resetForm();
    setTimeout(() => setFormMsg(null), 3000);
  };

  // Allows Caretaker to initiate call to Patient for testing or check-in
  const handleTestCallPatient = (contact: CaretakerContact) => {
    CallingService.startCall({
      ...contact,
      name: `${activePatient.displayName} (Patient)`,
      relationship: 'Patient',
    }, 'video');
  };

  return (
    <div className="caretaker-contact-manager" style={{ padding: '8px 0' }}>
      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '0 0 4px 0' }}>
            👥 Patient Contact Management
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0, fontWeight: 600 }}>
            Contacts listed here appear instantly as large 1-tap call cards on{' '}
            <strong style={{ color: '#2563EB' }}>{activePatient.displayName}</strong>’s screen.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsEditing(!isEditing);
          }}
          style={{
            backgroundColor: isEditing ? '#F1F5F9' : '#2563EB',
            color: isEditing ? '#334155' : '#FFFFFF',
            border: isEditing ? '1.5px solid #CBD5E1' : 'none',
            borderRadius: 14,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{isEditing ? '✕ Cancel' : '➕ Add New Contact'}</span>
        </button>
      </div>

      {formMsg && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            color: '#065F46',
            border: '1.5px solid #A7F3D0',
            borderRadius: 14,
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          ✓ {formMsg}
        </div>
      )}

      {/* Add / Edit Contact Form */}
      {isEditing && (
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: '24px',
            border: '2px solid #3B82F6',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.1)',
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', margin: '0 0 16px 0' }}>
            {editId ? '✏️ Edit Caretaker Contact' : '➕ Create Caretaker Contact Card'}
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pranjal Sharma"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Phone Number / User ID *
              </label>
              <input
                type="text"
                value={phoneOrUserId}
                onChange={(e) => setPhoneOrUserId(e.target.value)}
                placeholder="e.g. +91 98640 12345"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Relationship *
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 14,
                  backgroundColor: '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Son / Daughter">Son / Daughter</option>
                <option value="Spouse">Spouse</option>
                <option value="Brother / Sister">Brother / Sister</option>
                <option value="Primary Caregiver">Primary Caregiver</option>
                <option value="Family Physician">Family Physician / Doctor</option>
                <option value="Home Care Nurse">Home Care Nurse</option>
                <option value="Close Friend">Close Friend / Neighbor</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Profile Photo URL (Optional)
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://... or leave empty for initial"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Color & Badges */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Card Avatar Color
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['#2563EB', '#D97706', '#059669', '#7C3AED', '#DC2626'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: avatarColor === color ? '3px solid #0F172A' : '2px solid #FFFFFF',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}
                  />
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 18 }}>
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                Primary Caregiver (Pinned to top)
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 18 }}>
              <input
                type="checkbox"
                checked={isEmergencyContact}
                onChange={(e) => setIsEmergencyContact(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                Emergency Contact
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={resetForm}
              style={{
                backgroundColor: '#F8FAFC',
                color: '#64748B',
                border: '1px solid #CBD5E1',
                borderRadius: 12,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              {editId ? 'Save Changes' : 'Create Contact'}
            </button>
          </div>
        </form>
      )}

      {/* Existing Contacts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {contacts.map((contact) => (
          <div
            key={contact.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              border: '1.5px solid #E2E8F0',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: contact.avatarColor || '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  border: '2px solid #E2E8F0',
                }}
              >
                {contact.photoUrl ? (
                  <img
                    src={contact.photoUrl}
                    alt={contact.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  contact.name.charAt(0)
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {contact.name}
                  </h3>
                  {contact.isPrimary && (
                    <span
                      style={{
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        borderRadius: 10,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      Primary
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: 600 }}>
                  <span>{contact.relationship}</span> • <span>{contact.phoneOrUserId}</span>
                </div>
              </div>
            </div>

            {/* Actions: Test Call, Edit, Delete */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleTestCallPatient(contact)}
                title="Simulate call to patient screen"
                style={{
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  border: '1.5px solid #A7F3D0',
                  borderRadius: 12,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>📞 Call Patient</span>
              </button>

              <button
                type="button"
                onClick={() => handleEditClick(contact)}
                style={{
                  backgroundColor: '#F8FAFC',
                  color: '#334155',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: 12,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => handleDeleteClick(contact.id)}
                style={{
                  backgroundColor: '#FFF1F2',
                  color: '#BE123C',
                  border: '1.5px solid #FECDD3',
                  borderRadius: 12,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
