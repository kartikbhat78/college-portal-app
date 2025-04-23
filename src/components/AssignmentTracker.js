import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './AssignmentTracker.css';

// Sample assignment data - in a real app, this would come from an API
const SAMPLE_ASSIGNMENTS = [
  {
    id: 'a1',
    title: 'Algorithm Analysis Report',
    course: 'CS101',
    dueDate: '2025-05-10T23:59:00',
    description: 'Analyze the time and space complexity of the provided algorithms and submit a detailed report.',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 'a2',
    title: 'Calculus Problem Set 3',
    course: 'MATH201',
    dueDate: '2025-05-05T23:59:00',
    description: 'Complete problems 3.1 through 3.15 in the textbook.',
    status: 'completed',
    priority: 'medium'
  },
  {
    id: 'a3',
    title: 'Physics Lab Report',
    course: 'PHYS101',
    dueDate: '2025-05-15T23:59:00',
    description: 'Write a comprehensive lab report on the pendulum experiment conducted in class.',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 'a4',
    title: 'Technical Writing Essay',
    course: 'ENG102',
    dueDate: '2025-05-20T23:59:00',
    description: 'Write a 1500-word essay on the ethical implications of artificial intelligence in modern society.',
    status: 'pending',
    priority: 'medium'
  },
  {
    id: 'a5',
    title: 'Group Project Proposal',
    course: 'CS101',
    dueDate: '2025-04-28T23:59:00',
    description: 'Submit a proposal for your final group project, including team members, objectives, and timeline.',
    status: 'pending',
    priority: 'urgent'
  }
];

// Priority colors
const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981'
};

const AssignmentTracker = () => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('dueDate');
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    course: '',
    dueDate: '',
    description: '',
    priority: 'medium'
  });
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [isReminderSet, setIsReminderSet] = useState({});

  // Load assignments (in a real app, this would be an API call)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const savedAssignments = localStorage.getItem('assignments');
      if (savedAssignments) {
        setAssignments(JSON.parse(savedAssignments));
      } else {
        setAssignments(SAMPLE_ASSIGNMENTS);
        localStorage.setItem('assignments', JSON.stringify(SAMPLE_ASSIGNMENTS));
      }
    }, 500);
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...assignments];
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === filter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sort === 'dueDate') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sort === 'priority') {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sort === 'course') {
        return a.course.localeCompare(b.course);
      }
      return 0;
    });
    
    setFilteredAssignments(filtered);
    
    // Check for reminders that have been set
    const reminderStatus = {};
    assignments.forEach(assignment => {
      reminderStatus[assignment.id] = localStorage.getItem(`reminder_${assignment.id}`) === 'true';
    });
    setIsReminderSet(reminderStatus);
  }, [assignments, filter, sort]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate days remaining
  const getDaysRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Handle assignment status toggle
  const toggleAssignmentStatus = (id) => {
    const updatedAssignments = assignments.map(assignment => {
      if (assignment.id === id) {
        const newStatus = assignment.status === 'completed' ? 'pending' : 'completed';
        return { ...assignment, status: newStatus };
      }
      return assignment;
    });
    
    setAssignments(updatedAssignments);
    localStorage.setItem('assignments', JSON.stringify(updatedAssignments));
  };

  // Handle new assignment input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAssignment(prev => ({ ...prev, [name]: value }));
  };

  // Handle adding a new assignment
  const handleAddAssignment = (e) => {
    e.preventDefault();
    
    const newId = `a${Date.now()}`;
    const assignmentToAdd = {
      ...newAssignment,
      id: newId,
      status: 'pending'
    };
    
    const updatedAssignments = [...assignments, assignmentToAdd];
    setAssignments(updatedAssignments);
    localStorage.setItem('assignments', JSON.stringify(updatedAssignments));
    
    // Reset form
    setNewAssignment({
      title: '',
      course: '',
      dueDate: '',
      description: '',
      priority: 'medium'
    });
    setIsAddingAssignment(false);
  };

  // Handle assignment selection
  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  // Set a reminder for an assignment
  const setReminder = (assignment) => {
    if (notificationPermission !== 'granted') {
      requestNotificationPermission();
      return;
    }
    
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    
    // Calculate when to send the reminder (1 day before due date)
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    
    // If the reminder date is in the past, set it to 1 hour from now
    if (reminderDate < now) {
      reminderDate.setTime(now.getTime() + (60 * 60 * 1000));
    }
    
    const timeUntilReminder = reminderDate.getTime() - now.getTime();
    
    // Store that a reminder has been set
    localStorage.setItem(`reminder_${assignment.id}`, 'true');
    setIsReminderSet(prev => ({ ...prev, [assignment.id]: true }));
    
    // Schedule the notification
    setTimeout(() => {
      const notification = new Notification(`Assignment Due Soon: ${assignment.title}`, {
        body: `Your assignment for ${assignment.course} is due on ${formatDate(assignment.dueDate)}`,
        icon: '/icons/icon-192x192.png'
      });
      
      notification.onclick = () => {
        window.focus();
        setSelectedAssignment(assignment);
      };
      
      // Remove the reminder flag after showing
      localStorage.removeItem(`reminder_${assignment.id}`);
      setIsReminderSet(prev => ({ ...prev, [assignment.id]: false }));
    }, timeUntilReminder);
    
    // Show confirmation
    alert(`Reminder set for "${assignment.title}" on ${formatDate(reminderDate)}`);
  };

  // Remove a reminder
  const removeReminder = (assignment) => {
    localStorage.removeItem(`reminder_${assignment.id}`);
    setIsReminderSet(prev => ({ ...prev, [assignment.id]: false }));
    alert(`Reminder for "${assignment.title}" has been removed`);
  };

  // Delete an assignment
  const deleteAssignment = (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      const updatedAssignments = assignments.filter(assignment => assignment.id !== id);
      setAssignments(updatedAssignments);
      localStorage.setItem('assignments', JSON.stringify(updatedAssignments));
      
      // Clear any reminders
      localStorage.removeItem(`reminder_${id}`);
      
      // Clear selection if the deleted assignment was selected
      if (selectedAssignment && selectedAssignment.id === id) {
        setSelectedAssignment(null);
      }
    }
  };

  return (
    <div className="assignment-tracker">
      <h2 className="text-2xl font-bold text-white mb-6">Assignment Tracker</h2>
      
      <div className="controls">
        <div className="filters">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By:</label>
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="filter-select"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="course">Course</option>
            </select>
          </div>
        </div>
        
        <button 
          className="add-btn"
          onClick={() => setIsAddingAssignment(!isAddingAssignment)}
        >
          {isAddingAssignment ? 'Cancel' : '+ Add Assignment'}
        </button>
      </div>
      
      {isAddingAssignment && (
        <motion.div 
          className="add-assignment-form"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={handleAddAssignment}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newAssignment.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Assignment title"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="course">Course</label>
                <input
                  type="text"
                  id="course"
                  name="course"
                  value={newAssignment.course}
                  onChange={handleInputChange}
                  required
                  placeholder="Course code"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  type="datetime-local"
                  id="dueDate"
                  name="dueDate"
                  value={newAssignment.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={newAssignment.priority}
                  onChange={handleInputChange}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={newAssignment.description}
                onChange={handleInputChange}
                placeholder="Assignment details"
                rows="3"
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-btn">Add Assignment</button>
              <button type="button" className="cancel-btn" onClick={() => setIsAddingAssignment(false)}>Cancel</button>
            </div>
          </form>
        </motion.div>
      )}
      
      <div className="assignments-container">
        <div className="assignments-list">
          {filteredAssignments.length === 0 ? (
            <div className="no-assignments">
              <p>No assignments found</p>
              <button 
                className="add-btn-small"
                onClick={() => setIsAddingAssignment(true)}
              >
                + Add Assignment
              </button>
            </div>
          ) : (
            filteredAssignments.map(assignment => {
              const daysRemaining = getDaysRemaining(assignment.dueDate);
              const isOverdue = daysRemaining < 0 && assignment.status !== 'completed';
              
              return (
                <motion.div
                  key={assignment.id}
                  className={`assignment-item ${assignment.status === 'completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleAssignmentClick(assignment)}
                >
                  <div className="assignment-checkbox">
                    <input
                      type="checkbox"
                      checked={assignment.status === 'completed'}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleAssignmentStatus(assignment.id);
                      }}
                    />
                  </div>
                  
                  <div className="assignment-content">
                    <div className="assignment-header">
                      <h3 className="assignment-title">{assignment.title}</h3>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: PRIORITY_COLORS[assignment.priority] }}
                      >
                        {assignment.priority}
                      </span>
                    </div>
                    
                    <div className="assignment-details">
                      <span className="course-code">{assignment.course}</span>
                      <span className="due-date">
                        {isOverdue ? 'Overdue' : `Due: ${formatDate(assignment.dueDate)}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="assignment-actions">
                    {notificationPermission === 'granted' && assignment.status !== 'completed' && (
                      isReminderSet[assignment.id] ? (
                        <button 
                          className="reminder-btn active"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeReminder(assignment);
                          }}
                          title="Remove reminder"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
                          </svg>
                        </button>
                      ) : (
                        <button 
                          className="reminder-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReminder(assignment);
                          }}
                          title="Set reminder"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
                          </svg>
                        </button>
                      )
                    )}
                    
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAssignment(assignment.id);
                      }}
                      title="Delete assignment"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        
        {selectedAssignment && (
          <motion.div 
            className="assignment-details-panel"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="panel-header">
              <h3>Assignment Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedAssignment(null)}
              >
                ×
              </button>
            </div>
            
            <div className="panel-content">
              <div className="detail-header">
                <h4>{selectedAssignment.title}</h4>
                <span 
                  className="priority-badge large"
                  style={{ backgroundColor: PRIORITY_COLORS[selectedAssignment.priority] }}
                >
                  {selectedAssignment.priority}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Course:</span>
                <span className="detail-value">{selectedAssignment.course}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Due Date:</span>
                <span className="detail-value">{formatDate(selectedAssignment.dueDate)}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${selectedAssignment.status}`}>
                  {selectedAssignment.status.charAt(0).toUpperCase() + selectedAssignment.status.slice(1)}
                </span>
              </div>
              
              <div className="detail-item description">
                <span className="detail-label">Description:</span>
                <p className="detail-value">{selectedAssignment.description || 'No description provided.'}</p>
              </div>
              
              <div className="detail-actions">
                <button 
                  className={`status-toggle-btn ${selectedAssignment.status === 'completed' ? 'completed' : 'pending'}`}
                  onClick={() => toggleAssignmentStatus(selectedAssignment.id)}
                >
                  {selectedAssignment.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                </button>
                
                {selectedAssignment.status !== 'completed' && notificationPermission === 'granted' && (
                  isReminderSet[selectedAssignment.id] ? (
                    <button 
                      className="reminder-toggle-btn active"
                      onClick={() => removeReminder(selectedAssignment)}
                    >
                      Remove Reminder
                    </button>
                  ) : (
                    <button 
                      className="reminder-toggle-btn"
                      onClick={() => setReminder(selectedAssignment)}
                    >
                      Set Reminder
                    </button>
                  )
                )}
                
                {notificationPermission !== 'granted' && (
                  <button 
                    className="notification-permission-btn"
                    onClick={requestNotificationPermission}
                  >
                    Enable Notifications
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AssignmentTracker;
