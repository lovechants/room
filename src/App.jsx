import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TEMPLATEPAGE from './pages/Welcome'
import Room3DConverter from './components/converter'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TEMPLATEPAGE />} />
        <Route path="/designer" element={<Room3DConverter />} />
      </Routes> 
    </Router>
  );
}

export default App
