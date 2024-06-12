import React from 'react';

const LoadingDots: React.FC = () => {
  return (
    <div className="loading-dots">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
      <style jsx>{`
        .loading-dots {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dot {
          width: 8px;
          height: 8px;
          margin: 0 2px;
          background-color: currentColor;
          border-radius: 50%;
          animation: loading-dots 0.8s infinite;
        }
        @keyframes loading-dots {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        .dot:nth-child(1) {
          animation-delay: 0s;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
};

export default LoadingDots;