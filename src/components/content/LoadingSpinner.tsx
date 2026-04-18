// src/components/content/LoadingSpinner.tsx

//import React from 'react';

type Props = {
    message?: string;
    visible: boolean;
};

export function LoadingSpinner({ visible, message = " " }: Props) {
    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: 'white',
                fontFamily: `'Noto Sans KR', 'Segoe UI', 'Apple SD Gothic Neo', sans-serif`
            }}>
                {/* 물레방아 */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    border: '6px solid #ffffff',
                    borderTop: '6px solid #00d1b2',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    boxShadow: `
                        0 0 8px rgba(0, 0, 0, 0.3),
                        0 0 16px rgba(0, 0, 0, 0.2)
                    `
                }} />

                {/* 메시지 */}
                <p style={{
                    marginTop: '16px',
                    fontSize: '18px',
                    fontWeight: 500,
                    textShadow: `
                         0 1px 3px rgba(0,0,0,0.6),
                        0 2px 6px rgba(0,0,0,0.5)
                        `
                }}>
                    {message}
                </p>
            </div>

            {/* keyframes 삽입 */}
            <style>
                {`
          @keyframes spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
}
