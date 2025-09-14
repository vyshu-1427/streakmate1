import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Update to './context/useAuth' if refactored
import './App.css';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
// import Register from './pages/Register';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import HabitCircles from './pages/HabitCircles';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';


function App() {
  console.log('App.jsx: Rendering Routes');
  return (
    <>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      {/* <Route path="/register" element={<Register />} /> */}

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/circles" element={<ProtectedRoute><HabitCircles /></ProtectedRoute>} />
      </Route>
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}

export default App;