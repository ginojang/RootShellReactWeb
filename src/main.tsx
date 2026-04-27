
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

const globalStyle = document.createElement('style')
globalStyle.textContent = `
  html, body {
    font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: ${isMobile ? 'flex-start' : 'center'};
    align-items: center;
    background-color: #000;
  }

  .loader {
    border: 4px solid rgba(255, 255, 255, 0.2);
    border-top: 4px solid #fff;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

document.head.appendChild(globalStyle)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)