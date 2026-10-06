import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import "./index.css";
import "./styles/base.css";

import { AuthProvider } from "./context/AuthContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { BodyModelProvider } from "./context/BodyModelContext.tsx";

import WebWorkoutProvider from "./context/WebWorkoutProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <BodyModelProvider>
          <AuthProvider>
            <WebWorkoutProvider>
              <App />
            </WebWorkoutProvider>
          </AuthProvider>
        </BodyModelProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);