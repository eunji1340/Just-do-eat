// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/router/router";
import "./app/styles/global.css";

async function bootstrap() {
  // 라이트 모드를 기본으로 설정
  document.documentElement.setAttribute("data-theme", "light");

  // DOM이 준비될 때까지 대기
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element not found!");
    return;
  }


  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
}

bootstrap();
