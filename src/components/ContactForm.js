import React, { useState } from 'react';
import '../styles/components.css';

const ContactForm = ({ onAddStudent }) => {
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && course) {
      onAddStudent({ name, course });
      setName('');
      setCourse('');
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Student Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Course"
        value={course}
        onChange={(e) => setCourse(e.target.value)}
      />
      <button type="submit">Add Student</button>
    </form>
  );
};

export default ContactForm;
