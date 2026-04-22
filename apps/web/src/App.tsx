import "./App.css";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layouts/Layout";

import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import SignupPage from "./pages/SignupPage/SignupPage";
import Homepage from "./pages/HomePage/Homepage";
import WorkoutSelectPage from "./pages/WorkoutSelectPage/WorkoutSelectPage";
import ExerciseSelectPage from "./pages/ExerciseSelectPage/ExerciseSelectPage";
import WorkoutSummaryPage from "./pages/WorkoutSummaryPage/WorkoutSummaryPage";
import WorkoutPage from "./pages/WorkoutPage/WorkoutPage";
import WorkoutResultSummaryPage from "./pages/WorkoutResultSummaryPage/WorkoutResultSummaryPage";
import CreateExercisePage from "./pages/CreateExercisePage/CreateExercisePage";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import RoleRoute from "./routes/RoleRoute";

function AdminPage() {
  return <div>Admin Page</div>;
}

function TemplatesPage() {
  return <div>Public Templates Page</div>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />

        <Route
          path="login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />

        <Route path="templates" element={<TemplatesPage />} />

        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          }
        />

        <Route
          path="workout-select"
          element={
            <ProtectedRoute>
              <WorkoutSelectPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="exercise-select"
          element={
            <ProtectedRoute>
              <ExerciseSelectPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="workout-summary"
          element={
            <ProtectedRoute>
              <WorkoutSummaryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="workout"
          element={
            <ProtectedRoute>
              <WorkoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="workout-result"
          element={
            <ProtectedRoute>
              <WorkoutResultSummaryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminPage />
            </RoleRoute>
          }
        />
      </Route>

      <Route
        path="create-exercise"
        element={
          <ProtectedRoute>
            <CreateExercisePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;