import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Clock, Trophy, Users, Sparkles, Flame, Star, Target, BarChart, Users2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 500], [0, -100]);

  const features = [
    {
      icon: <Clock size={24} className="text-purple-500" />,
      title: 'Track Your Habits',
      description: 'Create and monitor daily habits with ease. Mark tasks complete to build unstoppable streaks.',
    },
    {
      icon: <Users size={24} className="text-pink-500" />,
      title: 'Join Habit Circles',
      description: 'Stay accountable with friends or communities in public or private groups.',
    },
    {
      icon: <Trophy size={24} className="text-yellow-400" />,
      title: 'Earn Rewards',
      description: 'Unlock badges, level up, and celebrate milestones as you grow.',
    },
  ];

  const testimonials = [
    { name: 'Alex J.', quote: 'StreakMates transformed my routine!', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Samantha L.', quote: 'Badges make habit-building fun!', avatar: 'https://i.pravatar.cc/150?img=2' },
    { name: 'Michael C.', quote: 'Circles keep me accountable.', avatar: 'https://i.pravatar.cc/150?img=3' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center relative overflow-hidden">
      <div className="inset-0 bg-black/20"></div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 flex-1 flex items-center z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
            <motion.div
              className="max-w-2xl text-center lg:text-left"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-600 mb-6">
                Build Habits, <span className="text-black">Together</span>
              </h1>
              <p className="text-base sm:text-lg text-black-100 mb-8 max-w-xl mx-auto lg:mx-0 drop-shadow">
                StreakMates empowers you to track habits, build streaks, and grow with accountability circles. Start your transformation today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-pink-500 to-yellow-400 text-white px-6 py-3 rounded-xl font-bold text-base hover:scale-105 transition-transform shadow-xl"
                  aria-label="Get Started Free"
                >
                  Get Started
                </Link>
                <Link
                  to={isAuthenticated ? '/circles' : '/login'}
                  className="border border-white/50 text-gray px-6 py-3 rounded-xl font-bold text-base hover:bg-white/20 transition-colors shadow-xl"
                  aria-label={isAuthenticated ? 'Join a Circle' : 'Login'}
                >
                  {isAuthenticated ? 'Join a Circle' : 'Login'}
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="max-w-md relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ rotateX: 5, rotateY: 5, scale: 1.05 }}
            >
              <div className="bg-black/40 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-white/30 transform-gpu">
                <img
                  src="image.jpg"
                  alt="Habit tracking dashboard"
                  className="w-auto h-auto object-cover rounded-lg shadow-inner"
                  loading="lazy"
                />
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-100">Your habit dashboard</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Flame size={16} className="text-yellow-400" />
                    <span className="text-sm font-bold text-white">10-day streak</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Other sections remain unchanged */}
      <Footer />
    </div>
  );
}

export default LandingPage;
