import React from 'react';
import '../styles/components.css';

const StudentList = ({ students }) => {
  return (
    <ul className="student-list">
      {students.map((student) => (
        <li key={student.id} className="student-card">
          <h3>{student.name}</h3>
          <p>Course: {student.course}</p>
        </li>
      ))}
    </ul>
  );
};

export default StudentList;
