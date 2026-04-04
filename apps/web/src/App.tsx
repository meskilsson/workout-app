import "./App.css";
import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/HomePage/HomePage";
import Layout from "./components/layouts/Layout";
import WorkoutSelectPage from "./pages/WorkoutSelectPage/WorkoutSelectPage";
import ExerciseSelectPage from "./pages/ExerciseSelectPage/ExerciseSelectPage";
import WorkoutSummaryPage from "./pages/WorkoutSummaryPage/WorkoutSummaryPage";
import WorkoutPage from "./pages/WorkoutPage/WorkoutPage";
import WorkoutResultSummaryPage from "./pages/WorkoutResultSummaryPage/WorkoutResultSummaryPage";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Homepage />} />
        <Route path="homepage" element={<Homepage />} />
        <Route path="workout-select" element={<WorkoutSelectPage />} />
        <Route path="exercise-select" element={<ExerciseSelectPage />} />
        <Route path="workout-summary" element={<WorkoutSummaryPage />} />
        <Route path="workout" element={<WorkoutPage />} />
        <Route path="workout-result" element={<WorkoutResultSummaryPage />} />
      </Route>
    </Routes>
  );
}

export default App;
