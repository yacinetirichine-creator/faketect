import { memo } from 'react';

const Logo = memo(({ size = 'md', animated = true, className = '' }) => {
  const sizes = {
    sm: { fontSize: '24px', checkSize: '18px' },
    md: { fontSize: '36px', checkSize: '28px' },
    lg: { fontSize: '48px', checkSize: '36px' },
    xl: { fontSize: '64px', checkSize: '48px' }
  };

  const { fontSize, checkSize } = sizes[size] || sizes.md;

  return (
    <div className={`faketect-logo ${className}`} style={{ fontSize }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

        .faketect-logo {
          display: flex;
          align-items: center;
          font-family: 'Orbitron', sans-serif;
        }

        .fake-part {
          position: relative;
          margin-right: 2px;
          color: #fff;
          overflow: hidden;
        }

        .fake-part .logo-text {
          background: linear-gradient(90deg, #8a2be2, #00ffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          opacity: 0.9;
          letter-spacing: 2px;
          font-weight: 700;
        }

        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 100%;
          background-color: #00ffff;
          box-shadow: 0 0 10px #00ffff;
          animation: scan 2s infinite linear;
          z-index: 10;
        }

        .scan-line.paused {
          animation: none;
          opacity: 0;
        }

        @keyframes scan {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        .tect-part {
          display: flex;
          align-items: center;
          color: #fff;
        }

        .tect-part .logo-text {
          font-weight: 900;
          letter-spacing: 2px;
          text-shadow: 0 0 15px rgba(0, 150, 255, 0.5);
        }

        .check-icon {
          stroke: #00ff88;
          margin-left: -5px;
          filter: drop-shadow(0 0 5px #00ff88);
        }

        .check-icon.animated {
          animation: popIn 0.5s ease-out forwards;
        }

        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          80% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="fake-part">
        <span className="logo-text">FAKE</span>
        <div className={`scan-line ${!animated ? 'paused' : ''}`}></div>
      </div>

      <div className="tect-part">
        <span className="logo-text">TECT</span>
        <svg
          className={`check-icon ${animated ? 'animated' : ''}`}
          style={{ width: checkSize, height: checkSize }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;
