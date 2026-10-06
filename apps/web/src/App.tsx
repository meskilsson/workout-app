import "./App.css";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layouts/Layout";
import AccountLayout from "./components/layouts/AccountLayout";
import { Navigate } from "react-router-dom";


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
import ExerciseDetailsPage from "./pages/ExerciseDetailsPage/ExerciseDetailsPage";
import TemplatesPage from "./pages/TemplatesPage/TemplatesPage";
import TemplatesLayout from "./components/layouts/TemplatesLayout";
import CreateTemplatePage from "./pages/CreateTemplatePage/CreateTemplatePage";
import TemplatesDetailsPage from "./pages/TemplatesDetailsPage/TemplatesDetailsPage";


import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import MyTemplatesPage from "./pages/MyTemplatesPage/MyTemplatesPage";
import RoleRoute from "./routes/RoleRoute";
import AdminPage from "./pages/AdminPage/AdminPage";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="admin/:section?" element={<RoleRoute allowedRoles={["admin"]}><AdminPage /></RoleRoute>} />
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


        <Route path="templates" element={<TemplatesLayout />}>
          <Route index element={<Navigate to="pre-made" replace />} />

          <Route path="pre-made" element={<TemplatesPage />} />

          <Route
            path="pre-made/templates-details/:id"
            element={<TemplatesDetailsPage templateSource="public" />}
          />

          <Route
            path="my"
            element={
              <ProtectedRoute>
                <MyTemplatesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="my/templates-details/:id"
            element={
              <ProtectedRoute>
                <TemplatesDetailsPage templateSource="my" />
              </ProtectedRoute>
            }
          />

          <Route
            path="create"
            element={
              <ProtectedRoute>
                <CreateTemplatePage />
              </ProtectedRoute>
            }
          />
        </Route>


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
          path="exercise-select/:draftId"
          element={
            <ProtectedRoute>
              <ExerciseSelectPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="workout-summary/:draftId"
          element={
            <ProtectedRoute>
              <WorkoutSummaryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="workout/:draftId"
          element={
            <ProtectedRoute>
              <WorkoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="workout-result/:sessionId"
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

        <Route path="/exercises/:id" element={<ExerciseDetailsPage />} />

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
