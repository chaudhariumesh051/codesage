import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./components/Toast";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { CodeAnalyzer } from "./components/CodeAnalyzer";
import { ProblemSolver } from "./components/ProblemSolver";
import { AIAssistant } from "./components/AIAssistant";
import { SettingsPanel } from "./components/SettingsPanel";
import { AdminPanel } from "./components/AdminPanel";

// Define view types for dashboard navigation
export type ViewType =
  | "dashboard"
  | "analyzer"
  | "solver"
  | "assistant"
  | "settings"
  | "admin";

// Redirect component to handle auth state
const AuthRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // If user is already logged in and tries to access auth page, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <AuthPage />;
};

// Admin route component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "analyzer":
        return <CodeAnalyzer />;
      case "solver":
        return <ProblemSolver />;
      case "assistant":
        return <AIAssistant />;
      case "settings":
        return <SettingsPanel />;
      case "admin":
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 transition-all duration-500">
            <ToastProvider />

            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthRedirect />} />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <div className="flex flex-col h-screen overflow-hidden">
                      <Navbar 
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                      />
                      <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-20">
                        {renderContent()}
                      </main>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <div className="flex flex-col h-screen overflow-hidden">
                      <Navbar 
                        currentView="admin"
                        setCurrentView={setCurrentView}
                      />
                      <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-20">
                        <AdminPanel />
                      </main>
                    </div>
                  </AdminRoute>
                }
              />
              {/* Catch all route - redirect to landing page */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;