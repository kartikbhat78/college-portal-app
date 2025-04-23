import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Profile from './components/Profile';
import FetchDemo from './components/FetchDemo';
import AnimatedBackground from './components/AnimatedBackground';
import AssignmentTracker from './components/AssignmentTracker';
import StudyResourcesHub from './components/StudyResourcesHub';
import './styles/App.css';

function App() {
  return (
    <div className="App min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Parallax or wave background that stays behind all content */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        <AnimatedBackground />
      </div>

      <Router>
        {/* Main content stacked above background */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />

          <main className="flex-grow pt-20 pb-20 px-4 sm:px-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/fetch-demo" element={<FetchDemo />} />
              <Route path="/assignments" element={<AssignmentTracker />} />
              <Route path="/resources" element={<StudyResourcesHub />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </div>
  );
}

export default App;
