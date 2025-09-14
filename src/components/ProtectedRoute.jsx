import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// import { useAuth } from '../context/useAuth';
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Checking authentication...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("ProtectedRoute: Error occurred:", error); // Debug
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log("ProtectedRoute: isAuthenticated:", isAuthenticated); // Debug
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;