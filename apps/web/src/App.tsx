
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Homepage from './pages/homepage/Homepage'
import Layout from './components/layouts/Layout'
import WorkoutSelectPage from './pages/workoutSelectPage/WorkoutSelectPage';
function App() {


  return (

    <Routes>
      <Route path="/" element={<Layout />} />
      <Route index element={<Homepage />} />
      <Route path="homepage" element={<Homepage />} />
      <Route path="workoutselect" element={<WorkoutSelectPage />} />
    </Routes>

  )
}

export default App
