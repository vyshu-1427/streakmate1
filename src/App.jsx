import { Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import HabitCircles from './pages/HabitCircles';
import HabitMap from './components/map/HabitMap';
import NotFound from './pages/NotFound';
import ChatBot from './pages/NewChatBot';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  const location = useLocation();
  const hideChatbot = ["/login", "/signup"].includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/circles" element={<HabitCircles />} />
          <Route path="/map" element={<HabitMap />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {!hideChatbot && <ChatBot />}
    </>
  );
}

export default App;
