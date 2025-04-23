import React from 'react';
import { motion } from 'framer-motion';

const Profile = () => {
  return (
    <motion.div
      className="max-w-3xl mx-auto p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-3xl font-bold mb-4">👨‍🎓 My Profile</h1>
      <p className="text-gray-300 mb-4">Welcome to your personalized student profile.</p>
      <img
        src="https://images.unsplash.com/photo-1618886614638-80f9672ee2f6"
        alt="Profile"
        className="rounded-2xl w-full max-w-md mx-auto shadow-lg"
      />
    </motion.div>
  );
};

export default Profile;
