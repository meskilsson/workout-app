import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.tsx'
import { WorkoutTimerProvider } from "@workout-app/shared/timer";
import { ThemeProvider } from './context/ThemeContext.tsx'
import { BodyModelProvider } from './context/BodyModelContext.tsx'
import "./styles/base.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <BodyModelProvider>
          <AuthProvider>
            <WorkoutTimerProvider>
              <App />
            </WorkoutTimerProvider>
          </AuthProvider>
        </BodyModelProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
