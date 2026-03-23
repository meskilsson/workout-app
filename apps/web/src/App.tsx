import "./App.css";
import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/homepage/Homepage";
import Layout from "./components/layouts/Layout";
import WorkoutSelectPage from "./pages/workoutselectpage/WorkoutSelectPage";
import ExerciseSelectPage from "./pages/exerciseselectpage/ExerciseSelectPage";
import WorkoutSummary from "./pages/workoutsummarypage/WorkoutSummary";
import WorkoutPage from "./pages/workoutpage/WorkoutPage";
import WorkoutResultSummaryPage from "./pages/workoutresultsummarypage/WorkoutResultSummaryPage";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Homepage />} />
        <Route path="homepage" element={<Homepage />} />
        <Route path="workout-select" element={<WorkoutSelectPage />} />
        <Route path="exercise-select" element={<ExerciseSelectPage />} />
        <Route path="workout-summary" element={<WorkoutSummary />} />
        <Route path="workout" element={<WorkoutPage />} />
        <Route path="workout-result" element={<WorkoutResultSummaryPage />} />
      </Route>
    </Routes>
  );
}

export default App;
