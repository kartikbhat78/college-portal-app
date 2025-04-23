import React, { useEffect, useState } from 'react';
import './StudyResourcesHub.css';

const StudyResourcesHub = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/resources.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch resources');
        return res.json();
      })
      .then(data => {
        setResources(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('[StudyResourcesHub] Fetch error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="resources-loading">Loading resources...</div>;
  if (error) return <div className="resources-error">Error: {error}</div>;

  return (
    <div className="study-resources-hub">
      <h2>Study Resources Hub</h2>
      <ul>
        {resources.map(resource => (
          <li key={resource.id}>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}</a>
            <span className="resource-course"> ({resource.course})</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudyResourcesHub;
