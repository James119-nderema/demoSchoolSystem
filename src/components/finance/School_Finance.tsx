// src/components/Fees/School_Finance.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

const SchoolFinance: React.FC = () => {
  // In a real application, you'd get the school ID from context, a user session, or a prop.
  // For this example, we'll use a hardcoded ID.
  const schoolId = 'school-abc-123'; 
  const navigate = useNavigate();

  const handleViewMethods = () => {
    navigate(`/school/${schoolId}/fee-payment-methods`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>School Finance Dashboard</h2>
      <p>Manage financial settings and fee payments for your school.</p>
      
      <button 
        onClick={handleViewMethods}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        View Payment Methods
      </button>
    </div>
  );
};

export default SchoolFinance;