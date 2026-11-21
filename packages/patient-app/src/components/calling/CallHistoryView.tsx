import React, { useState, useEffect } from 'react';
import { CallLog } from '@ner-mind/core';
import { CallingStorageService } from '../../calling/callingStorage.js';
import { OfflineStorageService } from '../../storage/localStorage.js';

export const CallHistoryView: React.FC = () => {
  const [logs, setLogs] = useState<CallLog[]>(() => CallingStorageService.getCallLogs());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const activePatient = OfflineStorageService.getPatientProfile();

  useEffect(() => {
    setLogs(CallingStorageService.getCallLogs());
    const unsub = CallingStorageService.subscribe(() => {
      setLogs(CallingStorageService.getCallLogs());
    });
    return () => unsub();
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all call history logs?')) {
      CallingStorageService.clearCallLogs();
    }
  };

  const formatDuration = (totalSeconds: number): string => {
    if (totalSeconds === 0) return '0s';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatDateTime = (isoString: string): string => {
    try {
      const dt = new Date(isoString);
      return dt.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === 'all') return true;
    return log.status === filterStatus;
  });

  return (
    <div className="call-history-view" style={{ padding: '8px 0' }}>
      {/* Header and Filter Controls */}
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
            📋 Real-Time Call History & Logs
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0, fontWeight: 600 }}>
            Audit log of all video and audio calls with {activePatient.displayName}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: '1.5px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              color: '#334155',
            }}
          >
            <option value="all">All Statuses ({logs.length})</option>
            <option value="answered">Answered Only</option>
            <option value="missed">Missed Only</option>
            <option value="declined">Declined Only</option>
          </select>

          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              style={{
                backgroundColor: '#F8FAFC',
                color: '#64748B',
                border: '1px solid #CBD5E1',
                borderRadius: 12,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* Logs Table / Cards */}
      {filteredLogs.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: '40px 24px',
            textAlign: 'center',
            border: '1.5px dashed #CBD5E1',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📞</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#334155', margin: '0 0 4px 0' }}>
            No Call Records Found
          </h3>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
            When calls are made or received, duration and timestamps will be logged here automatically.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredLogs.map((log) => {
            const isAnswered = log.status === 'answered';
            const isMissed = log.status === 'missed';

            return (
              <div
                key={log.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  border: '1.5px solid #E2E8F0',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Status Indicator Icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: isAnswered ? '#ECFDF5' : isMissed ? '#FEF3C7' : '#FFF1F2',
                      color: isAnswered ? '#059669' : isMissed ? '#D97706' : '#E11D48',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    {isAnswered ? '📞' : isMissed ? '⚠️' : '✕'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                        {log.callerName} → {log.receiverName}
                      </span>
                      <span
                        style={{
                          backgroundColor: isAnswered ? '#D1FAE5' : isMissed ? '#FDE68A' : '#FECDD3',
                          color: isAnswered ? '#065F46' : isMissed ? '#92400E' : '#9F1239',
                          borderRadius: 8,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {log.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: 600 }}>
                      <span>📅 {formatDateTime(log.startTime)}</span>
                      <span style={{ margin: '0 6px' }}>•</span>
                      <span>Type: {log.callType === 'video' ? 'Video 📹' : 'Audio 🎙️'}</span>
                    </div>
                  </div>
                </div>

                {/* Duration Badge */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#1E293B' }}>
                    {formatDuration(log.durationInSeconds)}
                  </div>
                  <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                    Duration
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
