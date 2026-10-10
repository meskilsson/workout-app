import "./App.css";

import Layout from "./components/layouts/Layout";
import AccountLayout from "./components/layouts/AccountLayout";
import { Navigate } from "./routes/navigation";


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


import { createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "./context/ThemeContext";
import { BodyModelProvider } from "./context/BodyModelContext";
import { AuthProvider } from "./context/AuthContext";
import WebWorkoutProvider from "./context/WebWorkoutProvider";
import type { ReactNode } from "react";

const rootRoute = createRootRoute({ component: () =>
    <ThemeProvider><BodyModelProvider><AuthProvider><WebWorkoutProvider>
        <Layout />
    </WebWorkoutProvider></AuthProvider></BodyModelProvider></ThemeProvider>,
    notFoundComponent: () => <main><h1>Page not found</h1><a href="/">Return home</a></main>,
});
const page = (path: string, element: ReactNode) => createRoute({ getParentRoute: () => rootRoute, path, component: () => element });
const protectedPage = (path: string, element: ReactNode) => page(path, <ProtectedRoute>{element}</ProtectedRoute>);
const templates = createRoute({ getParentRoute: () => rootRoute, path: "templates", component: TemplatesLayout });
const templatePage = (path: string, element: ReactNode) => createRoute({ getParentRoute: () => templates, path, component: () => element });
const profile = createRoute({ getParentRoute: () => rootRoute, path: "profile", component: () => <ProtectedRoute><AccountLayout /></ProtectedRoute> });
const profilePage = (path: string, element: ReactNode) => createRoute({ getParentRoute: () => profile, path, component: () => element });
const routeTree = rootRoute.addChildren([
    page("/", <Homepage />),
    page("homepage", <PublicRoute><Homepage /></PublicRoute>),
    page("login", <PublicRoute><LoginPage /></PublicRoute>),
    page("signup", <PublicRoute><SignupPage /></PublicRoute>),
    page("library", <LibraryPage />),
    page("exercises/$id", <ExerciseDetailsPage />),
    page("admin", <RoleRoute allowedRoles={["admin"]}><AdminPage /></RoleRoute>),
    page("admin/$section", <RoleRoute allowedRoles={["admin"]}><AdminPage /></RoleRoute>),
    protectedPage("workout-select", <WorkoutSelectPage />),
    protectedPage("exercise-select/$draftId", <ExerciseSelectPage />),
    protectedPage("workout-summary/$draftId", <WorkoutSummaryPage />),
    protectedPage("workout/$draftId", <WorkoutPage />),
    protectedPage("workout-result/$sessionId", <WorkoutResultPage />),
    protectedPage("create-exercise", <CreateExercisePage />),
    protectedPage("edit-exercise/$id", <EditExercisePage />),
    templates.addChildren([
        templatePage("/", <Navigate to="/templates/pre-made" replace />),
        templatePage("pre-made", <TemplatesPage />),
        templatePage("pre-made/templates-details/$id", <TemplatesDetailsPage templateSource="public" />),
        templatePage("my", <ProtectedRoute><MyTemplatesPage /></ProtectedRoute>),
        templatePage("my/templates-details/$id", <ProtectedRoute><TemplatesDetailsPage templateSource="my" /></ProtectedRoute>),
        templatePage("create", <ProtectedRoute><CreateTemplatePage /></ProtectedRoute>),
    ]),
    profile.addChildren([
        profilePage("/", <ProfilePage />), profilePage("workouts", <ProfileWorkoutsPage />),
        profilePage("workouts/$id", <WorkoutHistoryDetailPage />),
        profilePage("exercises", <ProfileExercisesPage />), profilePage("settings", <ProfileSettingsPage />),
    ]),
]);
const router = createRouter({ routeTree, defaultPreload: false });
export default function App() { return <RouterProvider router={router} />; }
