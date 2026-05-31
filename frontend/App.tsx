import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { Home } from './pages/Home';
import { FacilityList } from './pages/FacilityList';
import { BookingForm } from './pages/BookingForm';
import { MyBookings } from './pages/MyBookings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { FacilityEditor } from './pages/FacilityEditor';
import { UserProfile } from './pages/UserProfile';
import { TendikDashboard } from './pages/TendikDashboard';
import { UserManagement } from './pages/UserManagement';

import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/facilities" element={<FacilityList />} />
            <Route path="/book" element={<BookingForm />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<UserProfile />} />
            
            {/* Role Based Routes */}
            <Route path="/tendik/dashboard" element={<TendikDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/facility/edit/:id" element={<FacilityEditor />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;