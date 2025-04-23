import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './CourseSchedule.css';

// Sample course data - in a real app, this would come from an API
const SAMPLE_COURSES = [
  {
    id: 'cs101',
    code: 'CS101',
    name: 'Introduction to Computer Science',
    instructor: 'Dr. Alan Turing',
    schedule: [
      { day: 'Monday', startTime: '09:00', endTime: '10:30', room: 'Hall A-101' },
      { day: 'Wednesday', startTime: '09:00', endTime: '10:30', room: 'Hall A-101' }
    ],
    color: '#4f46e5'
  },
  {
    id: 'math201',
    code: 'MATH201',
    name: 'Calculus II',
    instructor: 'Dr. Katherine Johnson',
    schedule: [
      { day: 'Tuesday', startTime: '11:00', endTime: '12:30', room: 'Hall B-205' },
      { day: 'Thursday', startTime: '11:00', endTime: '12:30', room: 'Hall B-205' }
    ],
    color: '#10b981'
  },
  {
    id: 'phys101',
    code: 'PHYS101',
    name: 'Physics for Engineers',
    instructor: 'Dr. Richard Feynman',
    schedule: [
      { day: 'Monday', startTime: '14:00', endTime: '15:30', room: 'Lab C-310' },
      { day: 'Friday', startTime: '14:00', endTime: '16:00', room: 'Lab C-310' }
    ],
    color: '#f59e0b'
  },
  {
    id: 'eng102',
    code: 'ENG102',
    name: 'Technical Writing',
    instructor: 'Prof. Ada Lovelace',
    schedule: [
      { day: 'Wednesday', startTime: '13:00', endTime: '14:30', room: 'Hall D-111' }
    ],
    color: '#ec4899'
  }
];

// Days of the week for our schedule
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Time slots for our schedule (8 AM to 6 PM)
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => {
  const hour = i + 8;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const CourseSchedule = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState('');

  // Load courses (in a real app, this would be an API call)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCourses(SAMPLE_COURSES);
    }, 500);
  }, []);

  // Function to get courses for a specific day and time
  const getCoursesForTimeSlot = (day, timeSlot) => {
    const hour = parseInt(timeSlot.split(':')[0]);
    const minute = parseInt(timeSlot.split(':')[1] || '0');
    
    return courses.filter(course => {
      return course.schedule.some(schedule => {
        if (schedule.day !== day) return false;
        
        const startHour = parseInt(schedule.startTime.split(':')[0]);
        const startMinute = parseInt(schedule.startTime.split(':')[1]);
        const endHour = parseInt(schedule.endTime.split(':')[0]);
        const endMinute = parseInt(schedule.endTime.split(':')[1]);
        
        const slotStartTime = hour * 60 + minute;
        const courseStartTime = startHour * 60 + startMinute;
        const courseEndTime = endHour * 60 + endMinute;
        
        return slotStartTime >= courseStartTime && slotStartTime < courseEndTime;
      });
    });
  };

  // Handle course selection
  const handleCourseClick = (course) => {
    setSelectedCourse(course);
  };

  // Add course to calendar
  const addToCalendar = () => {
    if (!selectedCourse) return;
    
    setIsAddingToCalendar(true);
    
    // Check if the Web Share API is available
    if (navigator.share && navigator.canShare) {
      // Create calendar event data
      const courseSchedule = selectedCourse.schedule[0]; // Use first schedule for simplicity
      const eventDate = getNextDayOfWeek(courseSchedule.day);
      
      const eventData = {
        title: `${selectedCourse.code}: ${selectedCourse.name}`,
        text: `Instructor: ${selectedCourse.instructor}\nLocation: ${courseSchedule.room}`,
        url: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedCourse.code + ': ' + selectedCourse.name)}&dates=${formatDateForGCal(eventDate, courseSchedule.startTime)}/${formatDateForGCal(eventDate, courseSchedule.endTime)}&details=${encodeURIComponent('Instructor: ' + selectedCourse.instructor)}&location=${encodeURIComponent(courseSchedule.room)}&sf=true&output=xml`
      };
      
      // Try to share the event
      if (navigator.canShare(eventData)) {
        navigator.share(eventData)
          .then(() => {
            setCalendarStatus('Event shared successfully!');
            setTimeout(() => setCalendarStatus(''), 3000);
          })
          .catch(error => {
            console.error('Error sharing event:', error);
            setCalendarStatus('Could not share event. Try the direct link instead.');
            setTimeout(() => setCalendarStatus(''), 3000);
          })
          .finally(() => {
            setIsAddingToCalendar(false);
          });
      } else {
        // Fallback to opening Google Calendar directly
        window.open(eventData.url, '_blank');
        setCalendarStatus('Opened calendar in new tab');
        setTimeout(() => setCalendarStatus(''), 3000);
        setIsAddingToCalendar(false);
      }
    } else {
      // Fallback for browsers without Web Share API
      const courseSchedule = selectedCourse.schedule[0];
      const eventDate = getNextDayOfWeek(courseSchedule.day);
      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedCourse.code + ': ' + selectedCourse.name)}&dates=${formatDateForGCal(eventDate, courseSchedule.startTime)}/${formatDateForGCal(eventDate, courseSchedule.endTime)}&details=${encodeURIComponent('Instructor: ' + selectedCourse.instructor)}&location=${encodeURIComponent(courseSchedule.room)}&sf=true&output=xml`;
      
      window.open(calendarUrl, '_blank');
      setCalendarStatus('Opened calendar in new tab');
      setTimeout(() => setCalendarStatus(''), 3000);
      setIsAddingToCalendar(false);
    }
  };

  // Helper function to get the next occurrence of a day of the week
  const getNextDayOfWeek = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const dayIndex = days.indexOf(dayName);
    
    if (dayIndex === -1) return today; // Invalid day name
    
    const todayIndex = today.getDay();
    let daysUntilNext = dayIndex - todayIndex;
    if (daysUntilNext <= 0) daysUntilNext += 7; // If today or earlier this week, get next week
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilNext);
    return nextDate;
  };

  // Helper function to format date for Google Calendar
  const formatDateForGCal = (date, timeString) => {
    const [hours, minutes] = timeString.split(':');
    const eventDate = new Date(date);
    eventDate.setHours(parseInt(hours), parseInt(minutes), 0);
    
    return eventDate.toISOString().replace(/-|:|\.\d+/g, '');
  };

  // Render the course schedule grid
  return (
    <div className="course-schedule">
      <h2 className="text-2xl font-bold text-white mb-6">Course Schedule</h2>
      
      <div className="schedule-container">
        <div className="time-labels">
          <div className="time-header"></div>
          {TIME_SLOTS.map(time => (
            <div key={time} className="time-slot">
              {time}
            </div>
          ))}
        </div>
        
        <div className="schedule-grid">
          {DAYS.map(day => (
            <div key={day} className="day-column">
              <div className="day-header">{day}</div>
              
              {TIME_SLOTS.map(timeSlot => {
                const coursesInSlot = getCoursesForTimeSlot(day, timeSlot);
                
                return (
                  <div key={`${day}-${timeSlot}`} className="grid-cell">
                    {coursesInSlot.map(course => (
                      <motion.div
                        key={course.id}
                        className="course-item"
                        style={{ backgroundColor: course.color }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleCourseClick(course)}
                      >
                        <div className="course-code">{course.code}</div>
                        <div className="course-room">{course.schedule.find(s => s.day === day)?.room}</div>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {selectedCourse && (
        <motion.div 
          className="course-details"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="course-title">
            <span className="course-code-badge" style={{ backgroundColor: selectedCourse.color }}>
              {selectedCourse.code}
            </span>
            {selectedCourse.name}
          </h3>
          
          <div className="course-info">
            <div className="info-item">
              <span className="info-label">Instructor:</span>
              <span className="info-value">{selectedCourse.instructor}</span>
            </div>
            
            <div className="schedule-list">
              <span className="info-label">Schedule:</span>
              <ul>
                {selectedCourse.schedule.map((schedule, index) => (
                  <li key={index} className="schedule-item">
                    {schedule.day}: {schedule.startTime} - {schedule.endTime} @ {schedule.room}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="course-actions">
            <button 
              className="add-calendar-btn"
              onClick={addToCalendar}
              disabled={isAddingToCalendar}
            >
              {isAddingToCalendar ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 7a.5.5 0 0 1 .5.5V9H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V10H6a.5.5 0 0 1 0-1h1.5V7.5A.5.5 0 0 1 8 7z"/>
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                  </svg>
                  Add to Calendar
                </>
              )}
            </button>
            
            {calendarStatus && (
              <div className="calendar-status">{calendarStatus}</div>
            )}
          </div>
        </motion.div>
      )}
      
      {!selectedCourse && (
        <div className="course-details-placeholder">
          <p>Click on a course to view details and add it to your calendar</p>
        </div>
      )}
    </div>
  );
};

export default CourseSchedule;
