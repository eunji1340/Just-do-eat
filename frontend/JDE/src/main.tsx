// main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { initMsw } = await import('./mocks/browser');
    await initMsw();
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    // StrictMode 사용 - 개발 환경에서 컴포넌트 의도적으로 두 번씩 렌더링
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}

bootstrap();
