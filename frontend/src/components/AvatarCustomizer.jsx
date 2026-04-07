// AvatarCustomizer.jsx
import { useState } from 'react';
import { HealthAvatar } from './HealthAvatar';
import { useTranslation } from "react-i18next";

export const AvatarCustomizer = ({ onSave }) => {
  const existing = JSON.parse(localStorage.getItem('healix_avatar') || '{}');

  const [avatarData, setAvatarData] = useState({
    gender: existing.gender || 'male',
    skinTone: existing.skinTone || '#f7c9a5',
    hairColor: existing.hairColor || '#2e2935',
    hairStyle: existing.hairStyle || 'short',
    eyeColor: existing.eyeColor || '#2880d8',
  });

  const { t } = useTranslation();

  const skinTones = [
    { name: 'Fair', color: '#fde0c8' },
    { name: 'Light', color: '#f7c9a5' },
    { name: 'Medium', color: '#e0a676' },
    { name: 'Tan', color: '#c68642' },
    { name: 'Brown', color: '#8d5524' },
    { name: 'Deep', color: '#5a3821' },
  ];

  const maleHairStyles = [
  { label: t("short"), value: 'short' },
  { label: t("fade"), value: 'fade' },
  { label: t("quiff"), value: 'quiff' },
  { label: t("slick"), value: 'slick' },
  { label: t("bald"), value: 'bald' },
];

const femaleHairStyles = [
  { label: t("braid"), value: 'braid' },
  { label: t("bob"), value: 'bob' },
  { label: t("longHair"), value: 'long' },
  { label: t("curly"), value: 'curly' },
  { label: t("wavy"), value: 'wavy' },
];

  const hairColors = [
    { name: 'Black', color: '#1b1b1f' },
    { name: 'Dark Brown', color: '#2e2935' },
    { name: 'Brown', color: '#5b3b22' },
    { name: 'Chestnut', color: '#7b4a2e' },
    { name: 'Blonde', color: '#d8b37a' },
    { name: 'Red', color: '#a63e2e' },
    { name: 'Blue‑Black', color: '#232945' },
  ];

  const eyeColors = [
    { name: 'Blue', color: '#2880d8' },
    { name: 'Brown', color: '#5a4630' },
    { name: 'Hazel', color: '#8b6b3b' },
    { name: 'Green', color: '#1f8a4d' },
    { name: 'Gray', color: '#6b7280' },
  ];

  const hairStyles =
    avatarData.gender === 'male' ? maleHairStyles : femaleHairStyles;

  const update = (patch) =>
    setAvatarData((prev) => ({
      ...prev,
      ...patch,
    }));

  const handleSave = () => {
    localStorage.setItem('healix_avatar', JSON.stringify(avatarData));
    onSave?.(avatarData);
  };

  return (
    <div
      style={{
        background: 'var(--bg-3)',
        border: '1px solid var(--border-solid)',
        borderRadius: '20px',
        padding: '32px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <h2
        style={{
          color: 'var(--text)',
          fontSize: '24px',
          fontWeight: '700',
          margin: '0 0 8px 0',
        }}
      >
        {t("createHealthAvatar")}
      </h2>
      <p
        style={{
          color: 'var(--text-subtle)',
          fontSize: '14px',
          margin: '0 0 24px 0',
        }}
      >
        {t("customizeAvatarDesc")}
      </p>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Live Preview: directly uses avatarData */}
        <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '8px',
            }}
          >
            <HealthAvatar
              gender={avatarData.gender}
              skinTone={avatarData.skinTone}
              hairColor={avatarData.hairColor}
              hairStyle={avatarData.hairStyle}
              eyeColor={avatarData.eyeColor}
              healthStatus={{ warnings: 0, hasData: true }}
              size={190}
            />
          </div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {t("livePreview")}
          </div>
        </div>

        {/* Controls */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {/* Gender */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'block',
                marginBottom: '10px',
              }}
            >
              {t("gender")}
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              {[
                { label: t("male"), value: 'male', emoji: '👨' },
                { label: t("female"), value: 'female', emoji: '👩' },
              ].map((g) => (
                <button
                  key={g.value}
                  onClick={() =>
                    update({
                      gender: g.value,
                      hairStyle:
                        g.value === 'male' ? 'short' : 'braid',
                    })
                  }
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background:
                      avatarData.gender === g.value ? '#3b82f6' : 'var(--bg)',
                    border: '1px solid var(--border-solid)',
                    color:
                      avatarData.gender === g.value ? '#fff' : 'var(--text)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{g.emoji}</span>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skin Tone */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'block',
                marginBottom: '10px',
              }}
            >
              {t("skinTone")}
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              {skinTones.map((tone) => (
                <button
                  key={tone.color}
                  onClick={() => update({ skinTone: tone.color })}
                  style={{
                    height: 40,
                    borderRadius: 12,
                    background: tone.color,
                    border:
                      avatarData.skinTone === tone.color
                        ? '3px solid #3b82f6'
                        : '2px solid var(--border-solid)',
                    cursor: 'pointer',
                  }}
                  title={tone.name}
                />
              ))}
            </div>
          </div>

          {/* Hair Style */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'block',
                marginBottom: '10px',
              }}
            >
              {t("hairStyle")}
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
              }}
            >
              {hairStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => update({ hairStyle: style.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background:
                      avatarData.hairStyle === style.value
                        ? '#3b82f6'
                        : 'var(--bg)',
                    border: '1px solid var(--border-solid)',
                    color:
                      avatarData.hairStyle === style.value
                        ? '#fff'
                        : 'var(--text)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Color */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'block',
                marginBottom: '10px',
              }}
            >
              {t("hairColor")}
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
              }}
            >
              {hairColors.map((hc) => (
                <button
                  key={hc.color}
                  onClick={() => update({ hairColor: hc.color })}
                  style={{
                    height: 34,
                    borderRadius: 10,
                    background: hc.color,
                    border:
                      avatarData.hairColor === hc.color
                        ? '3px solid #3b82f6'
                        : '2px solid var(--border-solid)',
                    cursor: 'pointer',
                  }}
                  title={hc.name}
                />
              ))}
            </div>
          </div>

          {/* Eye Color */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'block',
                marginBottom: '10px',
              }}
            >
              {t("eyeColor")}
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
              }}
            >
              {eyeColors.map((ec) => (
                <button
                  key={ec.color}
                  onClick={() => update({ eyeColor: ec.color })}
                  style={{
                    height: 28,
                    borderRadius: 999,
                    background: ec.color,
                    border:
                      avatarData.eyeColor === ec.color
                        ? '3px solid #3b82f6'
                        : '2px solid var(--border-solid)',
                    cursor: 'pointer',
                  }}
                  title={ec.name}
                />
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t("saveAvatar")}
          </button>
        </div>
      </div>
    </div>
  );
};