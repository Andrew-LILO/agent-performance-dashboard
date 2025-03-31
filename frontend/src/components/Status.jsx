import React, { useEffect, useState } from 'react';

function Status() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/status`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error('Error fetching status:', err);
        setError(err.message);
      }
    };

    fetchStatus();
  }, []);

  if (error) return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      <h2 className="font-bold">Error:</h2>
      <p>{error}</p>
    </div>
  );

  if (!status) return (
    <div className="p-4">
      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
      <p>Loading status...</p>
    </div>
  );

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Backend Status</h2>
      <div className="space-y-2">
        <p><span className="font-semibold">Status:</span> {status.status}</p>
        <p><span className="font-semibold">Environment:</span> {status.environment}</p>
        <p><span className="font-semibold">Uptime:</span> {Math.floor(status.uptime)} seconds</p>
        <p><span className="font-semibold">Last Check:</span> {new Date(status.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default Status; 