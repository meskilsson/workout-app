import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Homepage from "./pages/HomePage/Homepage";
import Layout from "./components/layouts/Layout";
import WorkoutSelectPage from "./pages/WorkoutSelectPage/WorkoutSelectPage";
import ExerciseSelectPage from "./pages/ExerciseSelectPage/ExerciseSelectPage";
import WorkoutSummaryPage from "./pages/WorkoutSummaryPage/WorkoutSummaryPage";
import WorkoutPage from "./pages/WorkoutPage/WorkoutPage";
import WorkoutResultSummaryPage from "./pages/WorkoutResultSummaryPage/WorkoutResultSummaryPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import SignupPage from "./pages/SignupPage/SignupPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/homepage" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
        <Route path="workout-select" element={<ProtectedRoute><WorkoutSelectPage /></ProtectedRoute>} />
        <Route path="exercise-select" element={<ProtectedRoute><ExerciseSelectPage /></ProtectedRoute>} />
        <Route path="workout-summary" element={<ProtectedRoute><WorkoutSummaryPage /></ProtectedRoute>} />
        <Route path="workout" element={<ProtectedRoute><WorkoutPage /></ProtectedRoute>} />
        <Route path="workout-result" element={<ProtectedRoute><WorkoutResultSummaryPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
