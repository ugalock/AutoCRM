import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import { EmployeeWorkspace } from '@/pages/EmployeeWorkspace';
import { CustomerWorkspace } from '@/pages/CustomerWorkspace';
import KnowledgeBase from '@/pages/KnowledgeBase';

// Protected Route wrapper component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/customer" />
            </ProtectedRoute>
          } />
          <Route path="/employee/*" element={
            <ProtectedRoute>
              <EmployeeWorkspace />
            </ProtectedRoute>
          } />
          <Route path="/customer/*" element={
            <ProtectedRoute>
              <CustomerWorkspace />
            </ProtectedRoute>
          } />
          {/* <Route path="/kb/:articleId" element={<KnowledgeBase />} /> */}
          <Route path="/kb" element={<KnowledgeBase />} >
            <Route path=":articleId" element={<KnowledgeBase />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
