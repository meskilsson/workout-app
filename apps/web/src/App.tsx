import "./App.css";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layouts/Layout";
import AccountLayout from "./components/layouts/AccountLayout";


import LoginPage from "./pages/LoginPage/LoginPage";
import SignupPage from "./pages/SignupPage/SignupPage";
import Homepage from "./pages/HomePage/Homepage";
import WorkoutSelectPage from "./pages/WorkoutSelectPage/WorkoutSelectPage";
import ExerciseSelectPage from "./pages/ExerciseSelectPage/ExerciseSelectPage";
import WorkoutSummaryPage from "./pages/WorkoutSummaryPage/WorkoutSummaryPage";
import WorkoutPage from "./pages/WorkoutPage/WorkoutPage";
import WorkoutResultPage from "./pages/WorkoutResultPage/WorkoutResultPage";
import CreateExercisePage from "./pages/CreateExercisePage/CreateExercisePage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import ProfileWorkoutsPage from "./pages/ProfileWorkoutsPage/ProfileWorkoutsPage";
import ProfileExercisesPage from "./pages/ProfileExercisesPage/ProfileExercisesPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage/ProfileSettingsPage";
import EditExercisePage from "./pages/EditExercisePage/EditExercisePage";
import WorkoutHistoryDetailPage from "./pages/WorkoutHistoryDetailPage/WorkoutHistoryDetailPage";
import LibraryPage from "./pages/LibraryPage/LibraryPage";

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
        <Route index element={<Homepage />} />

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

        <Route path="/library" element={<LibraryPage />} />

        <Route
          path="homepage"
          element={
            <PublicRoute>
              <Homepage />
            </PublicRoute>
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
              <WorkoutResultPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="create-exercise"
          element={
            <ProtectedRoute>
              <CreateExercisePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <AccountLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProfilePage />} />
          <Route path="workouts" element={<ProfileWorkoutsPage />} />
          <Route
            path="workouts/:id"
            element={<WorkoutHistoryDetailPage />}
          />
          <Route path="exercises" element={<ProfileExercisesPage />} />
          <Route path="settings" element={<ProfileSettingsPage />} />
        </Route>

        <Route
          path="admin"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminPage />
            </RoleRoute>
          }
        />

        <Route
          path="edit-exercise/:id"
          element={
            <ProtectedRoute>
              <EditExercisePage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;