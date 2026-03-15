import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Building } from "lucide-react";
import axios from "@/lib/api";

// Components
import Notification from "@/components/ui/Notification";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AuthScreen from "@/components/auth/AuthScreen";
import DashboardScreen from "@/components/dashboard/DashboardScreen";
import PostsScreen from "@/components/posts/PostsScreen";
import ProductsScreen from "@/components/products/ProductsScreen";
import PromotionsScreen from "@/components/promotions/PromotionsScreen";
import Sidebar from "@/components/layout/Sidebar";
import BusinessProfileScreen from "@/components/business/BusinessProfileScreen";
import { ChatbotWizard } from "@/components/Chat/Chatbot"; // adjust path if needed

// Types
interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
}

interface Business {
  _id: string;
  businessName: string;
  businessCategory: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  logoUrl?: string;
  user: User | string; // populated user or user ID
}

/* ---------------- SAFE LOCAL STORAGE PARSER ---------------- */
const safeParse = (data: string | null) => {
  try {
    return JSON.parse(data || "null");
  } catch {
    return null;
  }
};

const Index = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(
    safeParse(localStorage.getItem("user"))
  );
  const [business, setBusiness] = useState<Business | null | undefined>(
    safeParse(localStorage.getItem("business"))
  );
  const [businessError, setBusinessError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  /* ---------------- NOTIFICATION ---------------- */
  const notify = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 5000);
    },
    []
  );

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = useCallback(() => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setBusiness(null);
    setBusinessError(null);
    setCurrentPage("login");
    notify("info", "Logged out successfully.");
  }, [notify]);

  /* ---------------- CHECK AUTH & FETCH BUSINESS ---------------- */
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setIsLoading(false);
      setCurrentPage("login");
      return;
    }

    try {
      // Fetch business associated with the logged-in user
      const res = await axios.get("/business/me");
      if (res.data?.business) {
        const businessData = res.data.business;
        // The business object includes a populated user field
        const fetchedUser = businessData.user;
        if (fetchedUser && typeof fetchedUser === "object") {
          setUser(fetchedUser);
          localStorage.setItem("user", JSON.stringify(fetchedUser));
        }
        setBusiness(businessData);
        localStorage.setItem("business", JSON.stringify(businessData));
        setBusinessError(null);
        setCurrentPage("dashboard");
      } else {
        // No business found (should be 404, but handle gracefully)
        setBusiness(null);
        setBusinessError(null);
        // Keep existing user (from localStorage) – it might be from login
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        handleLogout();
        notify("error", "Session expired. Please log in again.");
      } else if (error.response?.status === 404) {
        // No business registered – this is not an error
        setBusiness(null);
        setBusinessError(null);
        // Keep user if available
      } else {
        setBusinessError("Failed to load business. Please try again.");
        notify("error", "Network error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout, notify]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /* ---------------- AUTH SUCCESS (from login/register) ---------------- */
  const handleAuthSuccess = useCallback(
    (type: string, message: string, newToken?: string, newUser?: any) => {
      if (type === "success" && newToken && newUser) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        // Business will be fetched separately by checkAuth (which runs after state update)
        setCurrentPage("dashboard");
      }
      notify(type as "success" | "error" | "info", message);
    },
    [notify]
  );

  /* ---------------- HANDLE AI SETUP COMPLETION ---------------- */
  const handleAiSetupComplete = useCallback((botId: string) => {
    notify("success", "AI Chatbot is ready!");
    // Optionally update business data or navigate
    setCurrentPage("dashboard");
  }, [notify]);

  /* ---------------- PAGE RENDER ---------------- */
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <LoadingSpinner text="Initializing..." size="lg" />
        </div>
      );
    }

    if (!token || !user) {
      return (
        <AuthScreen
          isRegister={authMode === "register"}
          onAuthSuccess={handleAuthSuccess}
          switchMode={() =>
            setAuthMode(authMode === "login" ? "register" : "login")
          }
        />
      );
    }

    // Business is required for business-specific pages; handle missing business
    if (!business && currentPage !== "business-profile" && currentPage !== "ai-setup") {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold mb-4">No Business Found</h2>
          <p className="text-muted-foreground mb-4">
            You need to create a business profile first.
          </p>
          <button
            onClick={() => setCurrentPage("business-profile")}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Create Business Profile
          </button>
        </div>
      );
    }

    switch (currentPage) {
      case "dashboard":
        return <DashboardScreen user={user} notify={notify} />;

      case "business-profile":
        return <BusinessProfileScreen user={user} notify={notify} />;

      case "posts":
        return (
          <PostsScreen
            business={business}
            currentUser={user}
            notify={notify}
            businessError={businessError}
            onRetryBusiness={checkAuth}
          />
        );

      case "products":
        return (
          <ProductsScreen
            business={business}
            currentUser={user}
            notify={notify}
            businessError={businessError}
            onRetryBusiness={checkAuth}
          />
        );

      case "promotions":
        return (
          <PromotionsScreen
            business={business}
            currentUser={user}
            notify={notify}
            businessError={businessError}
            onRetryBusiness={checkAuth}
          />
        );

      case "ai-setup":
        // Ensure business exists before showing the wizard
        if (!business) {
          return (
            <div className="p-6 text-center">
              <h2 className="text-xl font-bold mb-4">Business Required</h2>
              <p className="text-muted-foreground mb-4">
                Please create a business profile first to set up the AI chatbot.
              </p>
              <button
                onClick={() => setCurrentPage("business-profile")}
                className="px-4 py-2 bg-primary text-white rounded-lg"
              >
                Go to Business Profile
              </button>
            </div>
          );
        }
        return (
          <ChatbotWizard
            businessId={business._id}
            onComplete={handleAiSetupComplete}
          />
        );

      default:
        return <DashboardScreen user={user} notify={notify} />;
    }
  };

  const isMainApp = token && user;

  return (
    <div
      className={`font-sans ${
        isMainApp
          ? "flex min-h-screen bg-background"
          : "min-h-screen"
      }`}
    >
      {isMainApp && (
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          business={business} // Pass business for displaying business name/logo
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`${
          isMainApp
            ? "flex-1 flex flex-col min-h-screen overflow-hidden"
            : "w-full"
        }`}
      >
        {/* Mobile Header */}
        {isMainApp && (
          <header className="lg:hidden flex items-center justify-between bg-card border-b border-border p-4 sticky top-0 z-30">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-foreground hover:bg-secondary rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center">
                <Building className="text-white" size={16} />
              </div>
              <span className="font-bold text-foreground">Zooda</span>
            </div>

            <div className="w-10" />
          </header>
        )}

        {/* Main Content */}
        <main
          className={`${
            isMainApp ? "flex-1 p-4 lg:p-6 overflow-y-auto" : ""
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <div className="fixed top-4 right-4 z-50">
            <Notification
              {...notification}
              onClose={() => setNotification(null)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;