import React, { useState } from 'react';
import { GameLevelManager, TOTAL_GAME_LEVELS, getTierInfo } from '../../services/GameLevelManager.js';

interface Props {
  gameId: string;
  currentLevel: number;
  onSelectLevel: (level: number) => void;
  gameTitle?: string;
}

export const GameLevelHeader: React.FC<Props> = ({
  gameId,
  currentLevel,
  onSelectLevel,
  gameTitle,
}) => {
  const [showSelector, setShowSelector] = useState(false);
  const tier = getTierInfo(currentLevel);
  const maxUnlocked = GameLevelManager.getMaxUnlockedLevel(gameId);
  const progressPercent = Math.round((currentLevel / TOTAL_GAME_LEVELS) * 100);

  const levelsList = GameLevelManager.getAllLevelsList(gameId);

  return (
    <div
      className="game-level-header"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: 20,
        padding: '14px 18px',
        marginBottom: 18,
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Left: Level & Tier Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              backgroundColor: tier.accentBg,
              color: tier.color,
              border: `1.5px solid ${tier.borderColor}`,
              borderRadius: 14,
              padding: '6px 14px',
              fontSize: 16,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Level {currentLevel}</span>
            <span style={{ opacity: 0.7, fontSize: 13 }}>/ {TOTAL_GAME_LEVELS}</span>
          </div>

          <span
            style={{
              backgroundColor: '#F1F5F9',
              color: '#334155',
              borderRadius: 12,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {tier.badge}
          </span>
        </div>

        {/* Right: Quick Level Stepper & Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Previous Level */}
          <button
            type="button"
            onClick={() => onSelectLevel(Math.max(1, currentLevel - 1))}
            disabled={currentLevel <= 1}
            title="Previous level"
            style={{
              backgroundColor: currentLevel > 1 ? '#F8FAFC' : '#F1F5F9',
              color: currentLevel > 1 ? '#0F172A' : '#94A3B8',
              border: '1px solid #CBD5E1',
              borderRadius: 12,
              padding: '6px 12px',
              fontSize: 14,
              fontWeight: 800,
              cursor: currentLevel > 1 ? 'pointer' : 'not-allowed',
            }}
          >
            ◀
          </button>

          {/* Level Selector Modal Opener */}
          <button
            type="button"
            onClick={() => setShowSelector(true)}
            style={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 14,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            <span>🎯</span>
            <span>All 30 Levels</span>
          </button>

          {/* Next Level */}
          <button
            type="button"
            onClick={() => onSelectLevel(Math.min(TOTAL_GAME_LEVELS, currentLevel + 1))}
            disabled={currentLevel >= maxUnlocked}
            title={currentLevel >= maxUnlocked ? 'Complete this level to unlock the next' : 'Next level'}
            style={{
              backgroundColor: currentLevel < maxUnlocked ? '#F8FAFC' : '#F1F5F9',
              color: currentLevel < maxUnlocked ? '#0F172A' : '#94A3B8',
              border: '1px solid #CBD5E1',
              borderRadius: 12,
              padding: '6px 12px',
              fontSize: 14,
              fontWeight: 800,
              cursor: currentLevel < maxUnlocked ? 'pointer' : 'not-allowed',
            }}
          >
            ▶
          </button>
        </div>
      </div>

      {/* Progress Bar through 30 Levels */}
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#64748B',
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          <span>Progress to 30-Level Mastery</span>
          <span>{progressPercent}% • {TOTAL_GAME_LEVELS - currentLevel} levels remaining</span>
        </div>
        <div
          style={{
            height: 8,
            backgroundColor: '#E2E8F0',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: tier.color,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* 30-LEVEL SELECTOR MODAL */}
      {showSelector && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowSelector(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: '24px 22px',
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0F172A' }}>
                  Choose Level (1 to 30)
                </h3>
                <span style={{ fontSize: 13, color: '#64748B' }}>
                  {gameTitle ? `${gameTitle} • ` : ''}Replay completed levels or challenge yourself!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSelector(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: 12,
                  width: 36,
                  height: 36,
                  fontSize: 16,
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#64748B',
                }}
              >
                ✕
              </button>
            </div>

            {/* 30-Levels Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 10,
              }}
            >
              {levelsList.map((item) => {
                const isSelected = item.level === currentLevel;
                const isAvailable = item.isUnlocked;

                return (
                  <button
                    key={item.level}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => {
                      onSelectLevel(item.level);
                      setShowSelector(false);
                    }}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 16,
                      border: isSelected
                        ? `3px solid ${item.tier.color}`
                        : isAvailable
                        ? `1.5px solid ${item.tier.borderColor}`
                        : '1.5px dashed #CBD5E1',
                      backgroundColor: isSelected
                        ? item.tier.accentBg
                        : isAvailable
                        ? '#FFFFFF'
                        : '#F8FAFC',
                      color: isSelected
                        ? item.tier.color
                        : isAvailable
                        ? '#0F172A'
                        : '#94A3B8',
                      fontWeight: 900,
                      fontSize: 16,
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    <span>{item.level}</span>
                    <span style={{ fontSize: 9, opacity: 0.8, textTransform: 'uppercase' }}>
                      {isAvailable ? (isSelected ? 'Active' : 'Unlocked') : '🔒'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tier Legend */}
            <div
              style={{
                marginTop: 20,
                padding: '12px 14px',
                backgroundColor: '#F8FAFC',
                borderRadius: 16,
                fontSize: 12,
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 800, color: '#0F172A' }}>Difficulty Escalation:</div>
              <div>🟢 <strong>Levels 1–6 (Tier 1)</strong>: Foundations & Gentle Orientation</div>
              <div>🔵 <strong>Levels 7–12 (Tier 2)</strong>: Moderate Focus & Visual Discernment</div>
              <div>🟣 <strong>Levels 13–18 (Tier 3)</strong>: Mind Sharpener & Rich Pattern Logic</div>
              <div>🟠 <strong>Levels 19–24 (Tier 4)</strong>: Advanced Challenge & Distractor Filters</div>
              <div>🏆 <strong>Levels 25–30 (Tier 5)</strong>: Master Cognition & Multi-Item Challenge</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

