import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, form);
      localStorage.setItem("token", res.data.token);
      console.log(res);
      setTimeout(() => {
        
        navigate("/dashboard");
      }, 500);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-bg px-4">
      <div className="bg-white/20 backdrop-blur-lg p-10 rounded-3xl shadow-2xl w-full max-w-md space-y-8 border border-white/30 relative z-10">
        <h2 className="text-4xl font-extrabold text-center bg-gradient-to-r from-purple-500 via-pink-400 to-yellow-400 text-transparent bg-clip-text drop-shadow-lg mb-2">Welcome Back!</h2>
        <p className="text-center text-gray-200 mb-4">Login to your account</p>
        {error && <p className="text-red-400 text-sm text-center font-semibold">{error}</p>}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-none rounded-xl bg-white/70 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-none rounded-xl bg-white/70 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-transform text-lg tracking-wide"
          >
            Login
          </button>
        </form>
        <p className="text-sm text-center text-gray-100">
          Don't have an account?{' '}
          <a href="/signup" className="text-purple-600 hover:underline font-semibold">
            Sign Up
          </a>
        </p>
      </div>
      {/* Decorative overlay */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>
    </div>
  );
};

export default Login;