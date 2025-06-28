import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./components/Toast";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { CodeAnalyzer } from "./components/CodeAnalyzer";
import { ProblemSolver } from "./components/ProblemSolver";
import { ChallengeSection } from "./components/ChallengeSection";
import { LearningPath } from "./components/LearningPath";
import { AIAssistant } from "./components/AIAssistant";
import { SettingsPanel } from "./components/SettingsPanel";
import { SubscriptionModal } from "./components/SubscriptionModal";

// Define view types for dashboard navigation
export type ViewType =
  | "dashboard"
  | "analyzer"
  | "solver"
  | "challenges"
  | "learning"
  | "assistant"
  | "settings";

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleUpgrade = () => {
    setShowSubscriptionModal(true);
  };

  const renderDashboardContent = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "analyzer":
        return <CodeAnalyzer />;
      case "solver":
        return <ProblemSolver />;
      case "challenges":
        return <ChallengeSection />;
      case "learning":
        return <LearningPath />;
      case "assistant":
        return <AIAssistant onClose={() => setCurrentView("dashboard")} />;
      case "settings":
        return <SettingsPanel />;
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
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen overflow-hidden">
                      <Sidebar
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        collapsed={sidebarCollapsed}
                        setCollapsed={setSidebarCollapsed}
                        onUpgrade={handleUpgrade}
                      />
                      <div className="flex-1 flex flex-col overflow-hidden ml-[64px] md:ml-[256px]">
                        <Header onUpgrade={handleUpgrade} />
                        <main className="flex-1 overflow-y-auto p-6">
                          {renderDashboardContent()}
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <SubscriptionModal
              isOpen={showSubscriptionModal}
              onClose={() => setShowSubscriptionModal(false)}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
