import React, { useState, useEffect } from 'react';
import StudentList from './StudentList';
import ContactForm from './ContactForm';
import PushNotificationDemo from './PushNotificationDemo';
import '../styles/components.css';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { updateServiceWorker } from '../serviceWorkerRegistration';

const Home = () => {
  const [students, setStudents] = useState([
    { id: 1, name: 'Aryan Patil', course: 'Computer Science' },
    { id: 2, name: 'Kedar Jadhav', course: 'Business' },
    { id: 3, name: 'Aditya Kumar', course: 'Engineering' }
  ]);
  const [showPushDemo, setShowPushDemo] = useState(false);

  // Update service worker when component mounts
  useEffect(() => {
    // Update the service worker to ensure we have the latest version
    updateServiceWorker();
  }, []);

  const handleAddStudent = (newStudent) => {
    setStudents([...students, { ...newStudent, id: students.length + 1 }]);
  };
  
  const togglePushDemo = () => {
    setShowPushDemo(!showPushDemo);
  };

  return (
    <motion.div
      className="home-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="hero-section">
        <GraduationCap size={48} className="hero-icon" />
        <h1>Welcome to the College Portal</h1>
        <p className="tagline">Empowering students for a brighter future</p>
      </div>

      <section className="feature-cards">
        <motion.div 
          className="feature-card"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <h3>📝 Assignment Tracker</h3>
          <p>Keep track of all your assignments, set reminders, and never miss a deadline.</p>
          <Link to="/assignments" className="feature-link">Manage Assignments</Link>
        </motion.div>

        <motion.div 
          className="feature-card"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <h3>📚 Study Resources</h3>
          <p>Access course materials, lecture notes, and study guides for all your classes.</p>
          <Link to="/resources" className="feature-link">Browse Resources</Link>
        </motion.div>
      </section>

      <section className="students-section">
        <h2>📚 Our Students</h2>
        <StudentList students={students} />
      </section>

      <section className="contact-section">
        <h2>➕ Add a Student</h2>
        <ContactForm onAddStudent={handleAddStudent} />
      </section>

      <section className="push-demo-section">
        <h2>🔔 Push Notifications</h2>
        <button 
          onClick={togglePushDemo} 
          className="toggle-push-demo-btn"
        >
          {showPushDemo ? 'Hide Push Demo' : 'Show Push Demo'}
        </button>
        
        {showPushDemo && <PushNotificationDemo />}
      </section>
    </motion.div>
  );
};

export default Home;
