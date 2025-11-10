// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/router/router";
import "./app/styles/global.css";

async function bootstrap() {
  // 라이트 모드를 기본으로 설정
  document.documentElement.setAttribute("data-theme", "light");

  // 환경 변수로 MSW 활성화 여부 제어
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MSW !== 'false') {
    const { initMsw } = await import("./mocks/browser");
    await initMsw();
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
}

bootstrap();
