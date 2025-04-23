import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/components.css';

// Fallback icon (custom SVG cap)
const GraduationIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4f46e5"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12l-10 6L2 12l10-6 10 6z" />
    <path d="M6 12v6a6 6 0 0 0 12 0v-6" />
  </svg>
);

const StudentList = ({ students }) => {
  // State to track image loading errors
  const [imgErrors, setImgErrors] = useState({});
  
  // Handle image loading errors
  const handleImageError = (studentId) => {
    setImgErrors(prev => ({
      ...prev,
      [studentId]: true
    }));
  };
  
  // Get avatar URL - using UI Avatars as a reliable fallback
  const getAvatarUrl = (student) => {
    if (imgErrors[student.id]) {
      // If image failed to load, use UI Avatars API
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=4f46e5&color=fff&size=160`;
    }
    
    // Try to use a more reliable image source - Picsum Photos instead of Unsplash
    return `https://picsum.photos/seed/student${student.id}/160/160`;
  };

  return (
    <div className="student-list-grid">
      {students.map((student) => (
        <motion.div
          key={student.id}
          className="student-card"
          whileHover={{ scale: 1.06 }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="icon-wrapper">
            <GraduationIcon />
          </div>
          <img
            src={getAvatarUrl(student)}
            alt={student.name}
            className="student-img"
            onError={() => handleImageError(student.id)}
          />
          <h3 className="student-name">{student.name}</h3>
          <p className="student-course">{student.course}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StudentList;
