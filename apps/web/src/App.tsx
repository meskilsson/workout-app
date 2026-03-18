
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Homepage from './pages/homepage/Homepage'
import Layout from './components/layouts/Layout'
function App() {


  return (

    <Routes>
      <Route path="/" element={<Layout />} />
      <Route index element={<Homepage />} />
      <Route path="homepage" element={<Homepage />} />
    </Routes>

  )
}

export default App
