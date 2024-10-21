import React, { useState } from 'react';
import StudentList from './StudentList';
import ContactForm from './ContactForm';
import '../styles/components.css';

const Home = () => {
  const [students, setStudents] = useState([
    { id: 1, name: 'John Doe', course: 'Computer Science' },
    { id: 2, name: 'Jane Smith', course: 'Business' },
    { id: 3, name: 'Bob Johnson', course: 'Engineering' }
  ]);

  const handleAddStudent = (newStudent) => {
    setStudents([...students, { ...newStudent, id: students.length + 1 }]);
  };

  return (
    <div className="home">
      <h1>Welcome to the College Portal</h1>
      <section className="students-section">
        <h2>Our Students</h2>
        <StudentList students={students} />
      </section>
      <section className="contact-section">
        <h2>Contact Us</h2>
        <ContactForm onAddStudent={handleAddStudent} />
      </section>
    </div>
  );
};

export default Home;
