// HealthAvatar.jsx
// Pure presentational component. DOES NOT read localStorage.
// Props:
//   gender: 'male' | 'female'
//   skinTone: string
//   hairColor: string
//   hairStyle: string (male: short|fade|quiff|slick|bald; female: braid|bob|long|curly|wavy)
//   eyeColor: string
//   healthStatus: { warnings: number, hasData: boolean } | undefined
//   size?: number

export const HealthAvatar = ({
  gender = 'male',
  skinTone = '#f7c9a5',
  hairColor = '#2e2935',
  hairStyle = 'short',
  eyeColor = '#2880d8',
  healthStatus,
  size = 220,
}) => {
  const getExpression = () => {
    if (!healthStatus) return 'neutral';
    const { warnings, hasData } = healthStatus;
    if (!hasData) return 'neutral';
    if (warnings >= 3) return 'worried';
    if (warnings >= 1) return 'concerned';
    return 'happy';
  };

  const expression = getExpression();

  const faceConfig = {
    happy: {
      mouth: 'M 42 72 Q 50 78 58 72',
      color: '#16a34a',
      status: 'Feeling great',
    },
    neutral: {
      mouth: 'M 42 74 L 58 74',
      color: '#64748b',
      status: 'Doing okay',
    },
    concerned: {
      mouth: 'M 42 76 Q 50 72 58 76',
      color: '#f59e0b',
      status: 'Could be better',
    },
    worried: {
      mouth: 'M 42 78 Q 50 74 58 78',
      color: '#ef4444',
      status: 'Needs attention',
    },
  }[expression];

  // HAIR SHAPES
  const maleHair = {
    short:
      'M 20 55 Q 18 28 30 17 Q 40 9 50 8 Q 60 9 70 17 Q 82 28 80 55 Z',
    fade:
      'M 22 56 Q 20 34 30 22 Q 40 12 50 11 Q 60 12 70 22 Q 80 34 78 56 Z',
    quiff:
      'M 20 56 Q 18 30 28 18 Q 40 8 50 6 Q 60 8 72 18 Q 82 30 80 56 Z',
    slick:
      'M 20 55 Q 18 30 26 19 Q 38 9 50 7 Q 62 9 74 19 Q 82 30 80 55 Z',
    bald:
      'M 25 52 Q 23 32 33 22 Q 42 15 50 14 Q 58 15 67 22 Q 77 32 75 52 Z',
  };

  const femaleHair = {
    braid:
      'M 18 58 Q 16 32 26 20 Q 38 10 50 10 Q 62 10 74 20 Q 84 32 82 58 Z',
    bob:
      'M 16 58 Q 14 30 24 16 Q 38 6 50 4 Q 62 6 76 16 Q 86 30 84 58 L 84 70 L 16 70 Z',
    long:
      'M 14 60 Q 12 30 24 12 Q 38 2 50 2 Q 62 2 76 12 Q 88 30 86 60 L 86 84 L 14 84 Z',
    curly:
      'M 16 58 Q 14 32 26 18 Q 38 8 50 6 Q 62 8 74 18 Q 86 32 84 58 L 84 74 L 16 74 Z',
    wavy:
      'M 14 60 Q 12 32 24 16 Q 38 6 50 4 Q 62 6 76 16 Q 88 32 86 60 L 86 82 L 14 82 Z',
  };

  const hairPath =
    gender === 'male'
      ? maleHair[hairStyle] || maleHair.short
      : femaleHair[hairStyle] || femaleHair.braid;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 120"
        style={{ display: 'block' }}
      >
        <defs>
          <radialGradient id="faceGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={skinTone} />
            <stop offset="100%" stopColor={skinTone} />
          </radialGradient>
        </defs>

        {gender === 'male' ? (
          <>
            {/* torso */}
            <path
              d="M 20 110 Q 30 80 50 80 Q 70 80 80 110 Z"
              fill="#1f3b70"
            />
            <path
              d="M 35 110 Q 45 82 50 82 Q 55 82 65 110 Z"
              fill="#152647"
            />
            <path
              d="M 42 82 L 58 82 L 62 96 L 38 96 Z"
              fill="#ffffff"
              opacity="0.9"
            />

            {/* hair */}
            <path d={hairPath} fill={hairColor} />
            {hairStyle === 'short' && (
              <>
                <path
                  d="M 30 22 Q 28 10 36 14"
                  stroke={hairColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 40 16 Q 38 4 46 9"
                  stroke={hairColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 50 14 Q 50 2 58 10"
                  stroke={hairColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 60 16 Q 62 4 69 10"
                  stroke={hairColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 68 22 Q 72 10 64 14"
                  stroke={hairColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            )}

            {/* ears */}
            <ellipse cx="24" cy="54" rx="4" ry="7" fill={skinTone} />
            <ellipse cx="76" cy="54" rx="4" ry="7" fill={skinTone} />

            {/* head */}
            <ellipse cx="50" cy="55" rx="22" ry="26" fill="url(#faceGrad)" />

            {/* neck */}
            <rect x="44" y="72" width="12" height="11" fill={skinTone} />

            {/* eyes */}
            <ellipse cx="40" cy="52" rx="5" ry="6" fill="#ffffff" />
            <ellipse cx="60" cy="52" rx="5" ry="6" fill="#ffffff" />

            <circle cx="40" cy="53" r="3" fill={eyeColor} />
            <circle cx="60" cy="53" r="3" fill={eyeColor} />

            <circle cx="40" cy="53" r="1.6" fill="#000000" />
            <circle cx="60" cy="53" r="1.6" fill="#000000" />

            <circle cx="41.1" cy="51.9" r="0.9" fill="#ffffff" />
            <circle cx="61.1" cy="51.9" r="0.9" fill="#ffffff" />

            {/* eyebrows */}
            <path
              d="M 33 45 L 43 45"
              stroke={hairColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 57 45 L 67 45"
              stroke={hairColor}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* nose */}
            <path
              d="M 50 52 Q 51 58 50 60"
              stroke="#d09c7b"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />

            {/* mouth */}
            <path
              d={faceConfig.mouth}
              stroke="#b57b5b"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            {/* torso */}
            <path
              d="M 16 110 Q 28 82 50 82 Q 72 82 84 110 Z"
              fill="#a52a32"
            />
            <path
              d="M 20 110 Q 30 88 50 88 Q 70 88 80 110 Z"
              fill="#a52a32"
            />

            {/* back hair */}
            <path d={hairPath} fill={hairColor} />

            {/* braid for braid style */}
            {hairStyle === 'braid' && (
              <>
                <circle cx="30" cy="72" r="5.5" fill={hairColor} />
                <circle cx="33" cy="82" r="5.8" fill={hairColor} />
                <circle cx="30" cy="92" r="6" fill={hairColor} />
                <circle cx="33" cy="102" r="6.2" fill={hairColor} />
                <path
                  d="M 72 44 Q 78 60 70 72"
                  stroke={hairColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            )}

            {/* ears */}
            <ellipse cx="23" cy="60" rx="4" ry="7" fill={skinTone} />
            <ellipse cx="77" cy="60" rx="4" ry="7" fill={skinTone} />

            {/* head */}
            <ellipse cx="50" cy="58" rx="21" ry="26" fill="url(#faceGrad)" />

            {/* neck */}
            <rect x="44" y="74" width="12" height="12" fill={skinTone} />

            {/* eyes */}
            <ellipse cx="40" cy="56" rx="5.8" ry="7.3" fill="#ffffff" />
            <ellipse cx="60" cy="56" rx="5.8" ry="7.3" fill="#ffffff" />

            <circle cx="40" cy="57" r="3.6" fill={eyeColor} />
            <circle cx="60" cy="57" r="3.6" fill={eyeColor} />

            <circle cx="40" cy="57" r="2.1" fill="#000000" />
            <circle cx="60" cy="57" r="2.1" fill="#000000" />

            <circle cx="41.1" cy="55.6" r="1.1" fill="#ffffff" />
            <circle cx="61.1" cy="55.6" r="1.1" fill="#ffffff" />

            {/* eyebrows */}
            <path
              d="M 33 49 Q 38 47 43 49"
              stroke={hairColor}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 57 49 Q 62 47 67 49"
              stroke={hairColor}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />

            {/* nose */}
            <path
              d="M 50 54 Q 51 60 50 62"
              stroke="#8c5335"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />

            {/* mouth */}
            <path
              d="M 40 72 Q 50 76 60 72"
              stroke="#a63e4b"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="50" cy="73" rx="7" ry="2.3" fill="#c85a69" />
          </>
        )}
      </svg>

      <div
        style={{
          padding: '4px 14px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          color: faceConfig.color,
          border: `1px solid ${faceConfig.color}55`,
          background: `${faceConfig.color}15`,
        }}
      >
        {faceConfig.status}
      </div>
    </div>
  );
};