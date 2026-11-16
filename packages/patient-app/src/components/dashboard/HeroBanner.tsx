import React from 'react';
import { PlayIcon, SparklesIcon } from '../common/Icons.js';

interface HeroBannerProps {
  onStartJourney: () => void;
  patientName: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onStartJourney }) => {
  return (
    <div
      className="hero-banner"
      style={{
        background: 'linear-gradient(135deg, #EEF2FF 0%, #E0F2FE 50%, #F5F3FF 100%)',
        borderRadius: 28,
        border: '1.5px solid #BAE6FD',
        boxShadow: '0 10px 30px rgba(37, 99, 235, 0.08), 0 2px 8px rgba(37, 99, 235, 0.04)',
        padding: '36px 36px',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 28,
      }}
    >
      {/* Decorative Background Elements */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147, 197, 253, 0.35) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -30,
          left: 100,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196, 181, 253, 0.3) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 28,
          position: 'relative',
          zIndex: 1,
          flexWrap: 'wrap',
        }}
      >
        {/* Left Content */}
        <div style={{ flex: '1 1 440px', maxWidth: 640 }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#FFFFFF',
              border: '1px solid #BFDBFE',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 800,
              color: '#1D4ED8',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)',
              marginBottom: 16,
            }}
          >
            <SparklesIcon size={16} color="#2563EB" />
            <span>AI-Driven Dementia Care & Cognitive Companion</span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: 'clamp(24px, 3.2vw, 34px)',
              fontWeight: 900,
              color: '#0F172A',
              lineHeight: 1.25,
              margin: '0 0 12px 0',
              letterSpacing: '-0.5px',
            }}
          >
            Stay Active • Sharpen Your Mind • Live Happily
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(15px, 1.8vw, 17px)',
              color: '#475569',
              lineHeight: 1.55,
              margin: '0 0 24px 0',
              fontWeight: 500,
            }}
          >
            AI-Powered Cognitive Games & Memory Assistance for Elderly Dementia Patients
          </p>

          {/* Action CTA & Quick Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onStartJourney}
              className="hero-start-btn"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 18,
                padding: '16px 32px',
                fontSize: 18,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 10px 24px rgba(37, 99, 235, 0.32)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span>Start Your Journey</span>
              <PlayIcon size={18} color="#FFFFFF" />
            </button>

            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 18 }}>🛡️</span>
              Adaptive • Calm • Zero Stress
            </span>
          </div>

          {/* Highlights Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 24,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                padding: '5px 12px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                color: '#334155',
                border: '1px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              <span>🧠</span> 6 Domains
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                padding: '5px 12px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                color: '#334155',
                border: '1px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              <span>🔒</span> 100% Offline
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                padding: '5px 12px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                color: '#334155',
                border: '1px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              <span>🎙️</span> Voice Guided
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                padding: '5px 12px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                color: '#334155',
                border: '1px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              <span>❤️</span> Family Recall
            </div>
          </div>
        </div>

        {/* Right Illustration: Brain & Elderly Caring Scene */}
        <div
          className="hero-illustration-container"
          style={{
            flex: '0 0 280px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <svg
            viewBox="0 0 280 220"
            width="280"
            height="220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ maxWidth: '100%', height: 'auto', filter: 'drop-shadow(0 12px 24px rgba(37,99,235,0.14))' }}
          >
            {/* Soft backdrop clouds */}
            <ellipse cx="140" cy="115" rx="125" ry="85" fill="#FFFFFF" fillOpacity="0.85" />
            <circle cx="75" cy="85" r="45" fill="#DBEAFE" fillOpacity="0.6" />
            <circle cx="205" cy="85" r="45" fill="#EDE9FE" fillOpacity="0.6" />

            {/* Glowing Brain Network at center top */}
            <g transform="translate(100, 20)">
              {/* Brain outline stylized */}
              <path
                d="M40 12 C25 12, 14 22, 14 36 C14 42, 17 48, 22 52 C18 56, 16 62, 18 68 C20 76, 28 82, 38 82 C42 82, 46 80, 50 78 C54 80, 58 82, 62 82 C72 82, 80 76, 82 68 C84 62, 82 56, 78 52 C83 48, 86 42, 86 36 C86 22, 75 12, 60 12 C56 12, 52 13, 50 16 C48 13, 44 12, 40 12 Z"
                fill="url(#brainGrad)"
                stroke="#3B82F6"
                strokeWidth="2.5"
              />
              {/* Brain Synapse Nodes */}
              <circle cx="35" cy="35" r="4" fill="#FFFFFF" />
              <circle cx="65" cy="35" r="4" fill="#FFFFFF" />
              <circle cx="50" cy="50" r="5" fill="#FDE047" />
              <circle cx="34" cy="62" r="3.5" fill="#6EE7B7" />
              <circle cx="66" cy="62" r="3.5" fill="#6EE7B7" />
              {/* Synapse Lines */}
              <line x1="35" y1="35" x2="50" y2="50" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="65" y1="35" x2="50" y2="50" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="34" y1="62" x2="50" y2="50" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="66" y1="62" x2="50" y2="50" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
              {/* Neural pulses */}
              <circle cx="50" cy="24" r="3" fill="#F43F5E" />
            </g>

            {/* Elderly Character (Left: smiling grandfather) */}
            <g transform="translate(45, 95)">
              {/* Body */}
              <path d="M15 75 C15 52, 28 42, 42 42 C56 42, 69 52, 69 75 Z" fill="#3B82F6" />
              {/* Collar & Sweater */}
              <path d="M34 42 L42 54 L50 42 Z" fill="#DBEAFE" />
              {/* Head */}
              <circle cx="42" cy="28" r="18" fill="#FED7AA" />
              {/* Grey Hair */}
              <path d="M24 24 C24 14, 32 10, 42 10 C52 10, 60 14, 60 24 C60 18, 54 12, 42 12 C30 12, 24 18, 24 24 Z" fill="#94A3B8" />
              {/* Glasses */}
              <circle cx="36" cy="27" r="4.5" stroke="#1E293B" strokeWidth="1.8" fill="rgba(255,255,255,0.4)" />
              <circle cx="48" cy="27" r="4.5" stroke="#1E293B" strokeWidth="1.8" fill="rgba(255,255,255,0.4)" />
              <line x1="40.5" y1="27" x2="43.5" y2="27" stroke="#1E293B" strokeWidth="1.8" />
              {/* Gentle Smile */}
              <path d="M38 36 Q42 40 46 36" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>

            {/* Elderly Character (Right: smiling grandmother) */}
            <g transform="translate(155, 98)">
              {/* Body / Saree */}
              <path d="M15 72 C15 50, 26 40, 40 40 C54 40, 65 50, 65 72 Z" fill="#EC4899" />
              {/* Pallu */}
              <path d="M22 55 Q35 44 48 56 L55 72 L35 72 Z" fill="#F472B6" />
              {/* Head */}
              <circle cx="40" cy="26" r="17" fill="#FED7AA" />
              {/* Grey/Silver Hair Bun */}
              <path d="M23 24 C23 13, 31 9, 40 9 C49 9, 57 13, 57 24 C57 17, 50 11, 40 11 C30 11, 23 17, 23 24 Z" fill="#CBD5E1" />
              <circle cx="40" cy="7" r="6" fill="#94A3B8" />
              {/* Eyes smiling */}
              <path d="M33 24 Q36 21 39 24" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M42 24 Q45 21 48 24" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              {/* Bindi */}
              <circle cx="40.5" cy="18" r="1.8" fill="#DC2626" />
              {/* Gentle Smile */}
              <path d="M37 32 Q40.5 36 44 32" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </g>

            {/* Heart symbol connecting them */}
            <g transform="translate(130, 145)">
              <circle cx="10" cy="10" r="14" fill="#FFFFFF" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.08))" />
              <path
                d="M10 15 C7 12 4 10 4 7 C4 4.5 6 3 8 3 C9.2 3 10 3.8 10 3.8 C10 3.8 10.8 3 12 3 C14 3 16 4.5 16 7 C16 10 13 12 10 15 Z"
                fill="#EF4444"
              />
            </g>

            {/* Linear Gradient Definitions */}
            <defs>
              <linearGradient id="brainGrad" x1="14" y1="12" x2="86" y2="82" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60A5FA" />
                <stop offset="0.5" stopColor="#818CF8" />
                <stop offset="1" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <style>{`
        .hero-start-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.4) !important;
        }
        .hero-start-btn:active {
          transform: translateY(0) scale(0.98);
        }
        @media (max-width: 900px) {
          .hero-banner {
            padding: 24px 20px !important;
          }
          .hero-illustration-container {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

