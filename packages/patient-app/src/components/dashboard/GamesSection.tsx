import React, { useState } from 'react';
import { CognitiveDomain } from '@ner-mind/core';
import { StandaloneGameId } from '../patient/CognitiveGamesMenu.js';
import { PlayIcon } from '../common/Icons.js';
import { SpeechService, SupportedAppLanguage } from '../../audio/speechService.js';
import { useLocalization } from '../../localization/index.js';

interface GameItem {
  id: string;
  title: string;
  category: 'memory' | 'visual' | 'daily' | 'language';
  categoryLabel: string;
  description: string;
  icon: string;
  bgGradient: string;
  borderColor: string;
  accentColor: string;
  textColor: string;
  badgeBg: string;
  action: () => void;
}

interface GamesSectionProps {
  onStartDomain: (domain: CognitiveDomain) => void;
  onSelectActivity: (activity: StandaloneGameId) => void;
  onStartMission: () => void;
  onOpenSafetySimulator: () => void;
}

export const GamesSection: React.FC<GamesSectionProps> = ({
  onStartDomain,
  onSelectActivity,
  onStartMission,
  onOpenSafetySimulator,
}) => {
  const { language } = useLocalization();
  const [activeFilter, setActiveFilter] = useState<'all' | 'memory' | 'visual' | 'daily' | 'language'>('all');

  const games: GameItem[] = [
    {
      id: 'memory-games',
      title: 'Memory Games',
      category: 'memory',
      categoryLabel: 'Memory Domain',
      description: 'Strengthen everyday recall with market shopping, object recall, and fun memory challenges.',
      icon: '🧠',
      bgGradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
      borderColor: '#FECDD3',
      accentColor: '#E11D48',
      textColor: '#9F1239',
      badgeBg: '#FFE4E6',
      action: () => onStartDomain('memory'),
    },
    {
      id: 'picture-recognition',
      title: 'Picture Recognition',
      category: 'visual',
      categoryLabel: 'Visual Perception',
      description: 'Recognize familiar household objects, cultural tools, and peaceful everyday sights.',
      icon: '🖼️',
      bgGradient: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
      borderColor: '#BAE6FD',
      accentColor: '#0284C7',
      textColor: '#075985',
      badgeBg: '#E0F2FE',
      action: () => onSelectActivity('pictureRecognition'),
    },
    {
      id: 'jigsaw-puzzle',
      title: 'Jigsaw Puzzle',
      category: 'visual',
      categoryLabel: 'Spatial Harmony',
      description: 'Gently piece together beautiful, serene nature photos and regional landmarks.',
      icon: '🧩',
      bgGradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
      borderColor: '#A7F3D0',
      accentColor: '#059669',
      textColor: '#065F46',
      badgeBg: '#D1FAE5',
      action: () => onSelectActivity('jigsawPuzzle'),
    },
    {
      id: 'virtual-shopping',
      title: 'Virtual Shopping',
      category: 'daily',
      categoryLabel: 'Life Skills',
      description: 'Step into the local market: pick fresh groceries, count coins, and check your shopping list.',
      icon: '🛒',
      bgGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      borderColor: '#FDE68A',
      accentColor: '#D97706',
      textColor: '#92400E',
      badgeBg: '#FEF3C7',
      action: () => onStartMission(),
    },
    {
      id: 'safety-simulator',
      title: 'Safety Simulator',
      category: 'daily',
      categoryLabel: 'Emergency & Care',
      description: 'Feel secure at home: practice quick responses for stove, door, and panic button assistance.',
      icon: '🚨',
      bgGradient: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
      borderColor: '#FECACA',
      accentColor: '#DC2626',
      textColor: '#991B1B',
      badgeBg: '#FEE2E2',
      action: () => onOpenSafetySimulator(),
    },
    {
      id: 'music-memory',
      title: 'Music Memory',
      category: 'memory',
      categoryLabel: 'Auditory Recall',
      description: 'Listen to familiar loved ones’ voices, soothing melodies, and identify who is speaking.',
      icon: '🎵',
      bgGradient: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
      borderColor: '#DDD6FE',
      accentColor: '#7C3AED',
      textColor: '#5B21B6',
      badgeBg: '#EDE9FE',
      action: () => onSelectActivity('identifyPerson'),
    },
    {
      id: 'family-recognition',
      title: 'Family Recognition',
      category: 'memory',
      categoryLabel: 'Personal Bonds',
      description: 'Cherish memories and practice identifying your beloved children, spouse, and grandchildren.',
      icon: '👨‍👩‍👧‍👦',
      bgGradient: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
      borderColor: '#FBCFE8',
      accentColor: '#DB2777',
      textColor: '#9D174D',
      badgeBg: '#FCE7F3',
      action: () => onSelectActivity('personalRecognition'),
    },
    {
      id: 'virtual-gardening',
      title: 'Virtual Gardening',
      category: 'daily',
      categoryLabel: 'Nature & Sequence',
      description: 'Care for tea plants and flowers: follow relaxing morning watering and planting routines.',
      icon: '🌿',
      bgGradient: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)',
      borderColor: '#99F6E4',
      accentColor: '#0D9488',
      textColor: '#115E59',
      badgeBg: '#CCFBF1',
      action: () => onStartDomain('sequencing'),
    },
    {
      id: 'word-arrangement',
      title: 'Word Arrangement',
      category: 'language',
      categoryLabel: 'Language & Words',
      description: 'Arrange letter tiles to spell familiar everyday words with encouraging audio hints.',
      icon: '🔤',
      bgGradient: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
      borderColor: '#FED7AA',
      accentColor: '#EA580C',
      textColor: '#9A3412',
      badgeBg: '#FFEDD5',
      action: () => onSelectActivity('wittyWords'),
    },
    {
      id: 'shape-recognition',
      title: 'Shape Recognition',
      category: 'visual',
      categoryLabel: 'Pattern Attention',
      description: 'Match colourful circles, stars, and traditional Gamusa diamond patterns.',
      icon: '🔷',
      bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
      borderColor: '#C7D2FE',
      accentColor: '#4F46E5',
      textColor: '#3730A3',
      badgeBg: '#E0E7FF',
      action: () => onSelectActivity('shapeFinding'),
    },
  ];

  const filteredGames = activeFilter === 'all'
    ? games
    : games.filter((g) => g.category === activeFilter);

  const handleReadCard = (game: GameItem, e: React.MouseEvent) => {
    e.stopPropagation();
    SpeechService.speak(`${game.title}. ${game.description}`, 0.9, (language as SupportedAppLanguage) || 'en');
  };

  return (
    <section aria-label="Cognitive Games and Activities" style={{ marginBottom: 36 }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🎮</span>
            <h3
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#0F172A',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Cognitive Games & Activities
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: 15, color: '#64748B', fontWeight: 500 }}>
            Gentle, engaging brain exercises designed for memory, attention and joy
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            borderRadius: 14,
            padding: 4,
            gap: 4,
            flexWrap: 'wrap',
          }}
        >
          {[
            { id: 'all', label: 'All Games (10)' },
            { id: 'memory', label: 'Memory' },
            { id: 'visual', label: 'Visual & Shapes' },
            { id: 'daily', label: 'Daily Life' },
            { id: 'language', label: 'Words' },
          ].map((tab) => {
            const isTabActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: isTabActive ? '#FFFFFF' : 'transparent',
                  color: isTabActive ? '#2563EB' : '#475569',
                  fontWeight: isTabActive ? 800 : 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: isTabActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 10 Colorful Game Cards Grid */}
      <div
        className="games-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {filteredGames.map((game) => (
          <div
            key={game.id}
            onClick={game.action}
            className="game-card"
            style={{
              background: game.bgGradient,
              border: `2px solid ${game.borderColor}`,
              borderRadius: 24,
              padding: '24px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 250,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top row: Icon + Category Badge + Audio Readout */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 18,
                    backgroundColor: '#FFFFFF',
                    border: `1.5px solid ${game.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                  }}
                >
                  {game.icon}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      backgroundColor: game.badgeBg,
                      color: game.textColor,
                      padding: '4px 10px',
                      borderRadius: 10,
                      border: `1px solid ${game.borderColor}`,
                    }}
                  >
                    {game.categoryLabel}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleReadCard(game, e)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: `1px solid ${game.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                    title="Read card aloud"
                    aria-label={`Read ${game.title} aloud`}
                  >
                    🔊
                  </button>
                </div>
              </div>

              {/* Title */}
              <h4
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: game.textColor,
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.3px',
                }}
              >
                {game.title}
              </h4>

              {/* Description */}
              <p
                style={{
                  fontSize: 14,
                  color: '#475569',
                  lineHeight: 1.5,
                  margin: '0 0 20px 0',
                  fontWeight: 500,
                }}
              >
                {game.description}
              </p>
            </div>

            {/* Play Button CTA */}
            <button
              type="button"
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                color: game.textColor,
                border: `2px solid ${game.borderColor}`,
                borderRadius: 16,
                padding: '12px 16px',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
              className="card-play-btn"
            >
              <span>Play Game</span>
              <PlayIcon size={14} color={game.textColor} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .game-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08) !important;
        }
        .game-card:hover .card-play-btn {
          background-color: #0F172A !important;
          color: #FFFFFF !important;
          border-color: #0F172A !important;
        }
        .game-card:hover .card-play-btn svg {
          fill: #FFFFFF !important;
          stroke: #FFFFFF !important;
        }
      `}</style>
    </section>
  );
};

