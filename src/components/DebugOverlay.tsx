// src/components/UnityDebugOverlay.tsx
import { useEffect, useState } from 'react';

interface LogEntry {
  type: 'log' | 'warn' | 'error';
  message: string;
}


export default function DebugOverlay() {
  if (import.meta.env.VITE_APP_IS_DEBUG_CONSOL === 'false')
    return null;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [visible, setVisible] = useState(true);

  const debugOverlayVersion = import.meta.env.VITE_APP_VERSION;
  const filterLogText = import.meta.env.VITE_APP_VITE_FILTER_LOG_TEXT;

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (type: LogEntry['type'], ...args: any[]) => {
      const message = args.join(' ');
      if (message.includes(filterLogText)) {
        setLogs((prev) => [...prev.slice(-50), { type, message }]);
      }
    };


    console.log = (...args) => {
      addLog('log', ...args);
      originalLog(...args);
    };
    console.warn = (...args) => {
      addLog('warn', ...args);
      originalWarn(...args);
    };
    console.error = (...args) => {
      addLog('error', ...args);
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setLogs([])} // <-- 로그 비우기 기능!
        style={{
          position: 'fixed',
          top: '1%',
          left: '12%',
          transform: 'translateX(-50%)',
          background: '#222',
          color: 'white',
          padding: '10px 20px',
          fontSize: '16px',
          borderRadius: '8px',
          zIndex: 10000,
          border: '2px solid white',
          cursor: 'pointer',
        }}
      >
        {'Clear All Logs'}
      </button>

      <div
        style={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: '12px',
          padding: '4px 8px',
          borderRadius: '4px',
          zIndex: 10001,
        }}
      >
        ver: {debugOverlayVersion}
      </div>

      {visible && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            maxHeight: '40%',
            overflowY: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            fontSize: '12px',
            padding: '10px',
            zIndex: 9999,
            whiteSpace: 'pre-wrap',
          }}
        >
          <button
            onClick={() => setVisible(false)}
            style={{
              position: 'absolute',
              top: 5,
              right: 10,
              background: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 6px',
              cursor: 'pointer',
            }}
          >
            X
          </button>
          {logs.map((log, i) => (
            <div key={i} style={{ color: getColor(log.type) }}>
              {log.message}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function getColor(type: 'log' | 'warn' | 'error') {
  if (type === 'warn') return 'orange';
  if (type === 'error') return 'red';
  return 'lightgray';
}
