import React, { useState, useEffect } from 'react';
import DigitalEmployeeHub from './pages/DigitalEmployeeHub';
import DigitalEmployeeH5 from './pages/DigitalEmployeeH5';
import './App.css';

function App() {
  const [isH5, setIsH5] = useState(false);
  const [h5EmpId, setH5EmpId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const check = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('h5-chat')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        setH5EmpId(params.get('id') || undefined);
        setIsH5(true);
      } else {
        setIsH5(false);
      }
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  if (isH5) {
    return <DigitalEmployeeH5 employeeId={h5EmpId} />;
  }

  return (
    <DigitalEmployeeHub
      initialTab="frontend"
      onBackToAdmin={undefined}
    />
  );
}

export default App;
