import React, { useState } from 'react';
import { motion } from 'framer-motion';

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
    <motion.form
      className="bg-zinc-800 text-white p-6 rounded-2xl shadow-lg max-w-md w-full mx-auto space-y-4"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <input
        type="text"
        placeholder="Student Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-2 rounded-md bg-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
      <input
        type="text"
        placeholder="Course"
        value={course}
        onChange={(e) => setCourse(e.target.value)}
        className="w-full px-4 py-2 rounded-md bg-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-md transition-all duration-300"
      >
        Add Student
      </button>
    </motion.form>
  );
};

export default ContactForm;
