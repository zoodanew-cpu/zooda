import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Building } from 'lucide-react';
import axios from '@/lib/api';

// Components
import Notification from '@/components/ui/Notification';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuthScreen from '@/components/auth/AuthScreen';
import BusinessProfileScreen from '@/components/business/BusinessProfileScreen';
import BusinessPendingScreen from '@/components/business/BusinessPendingScreen';
import DashboardScreen from '@/components/dashboard/DashboardScreen';
import PostsScreen from '@/components/posts/PostsScreen';
import ProductsScreen from '@/components/products/ProductsScreen';
import PromotionsScreen from '@/components/promotions/PromotionsScreen';
import Sidebar from '@/components/layout/Sidebar';

const Index = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || null);
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [business, setBusiness] = useState<any>(JSON.parse(localStorage.getItem('business') || 'null'));
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const notify = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setBusiness(null);
    setCurrentPage('login');
    notify('info', 'Logged out successfully.');
  }, [notify]);

  const checkAuthAndBusiness = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');

    if (!storedToken || !storedUserId) {
      setIsLoading(false);
      setCurrentPage('login');
      return;
    }

    try {
      let fetchedBusiness = null;

      const businessRes = await axios.get('/business', {
        params: { userId: storedUserId },
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      fetchedBusiness = businessRes.data.business;

      if (fetchedBusiness) {
        setBusiness(fetchedBusiness);
        localStorage.setItem('business', JSON.stringify(fetchedBusiness));
        localStorage.setItem('businessId', fetchedBusiness._id);

        if (fetchedBusiness.user) {
          setUser(fetchedBusiness.user);
          localStorage.setItem('user', JSON.stringify(fetchedBusiness.user));
        }

        if (fetchedBusiness.status === 'active' && fetchedBusiness.verified) {
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('business-pending');
        }
      } else {
        setCurrentPage('business-profile');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        handleLogout();
        notify('error', 'Session expired. Please log in again.');
      } else if (error.response?.status !== 404) {
        notify('error', 'Network error. Please try again.');
      } else {
        setCurrentPage('business-profile');
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout, notify]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    checkAuthAndBusiness();
  }, [checkAuthAndBusiness]);

  const handleAuthSuccess = useCallback(
    (type: string, message: string, newToken?: string, newUser?: any) => {
      if (type === 'success' && newToken && newUser) {
        localStorage.setItem('token', newToken);
        localStorage.setItem('userId', newUser._id || newUser.id);
        localStorage.setItem('user', JSON.stringify(newUser));

        setToken(newToken);
        setUser(newUser);

        checkAuthAndBusiness();
      }
      notify(type as 'success' | 'error' | 'info', message);
    },
    [checkAuthAndBusiness, notify]
  );

  const handleBusinessSubmit = async (formData: any, logoFile: File | null) => {
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    if (logoFile) {
      data.append('media', logoFile);
    }

    const isUpdate = business && business._id;
    if (!isUpdate) {
      data.append('userId', user._id);
    }

    try {
      const apiEndpoint = isUpdate ? `/business/${business._id}` : '/business';
      const method = isUpdate ? axios.put : axios.post;

      const response = await method(apiEndpoint, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newBusiness = response.data.business;
      setBusiness(newBusiness);
      localStorage.setItem('business', JSON.stringify(newBusiness));
      localStorage.setItem('businessId', newBusiness._id);

      notify('success', `Business ${isUpdate ? 'updated' : 'registered'} successfully.`);

      if (newBusiness.status === 'active' && newBusiness.verified) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('business-pending');
      }
    } catch (err: any) {
      notify('error', err.response?.data?.message || `Failed to ${business ? 'update' : 'register'} business.`);
    }
  };

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
          isRegister={authMode === 'register'}
          onAuthSuccess={handleAuthSuccess}
          switchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        />
      );
    }

    const isBusinessRegistered = business && business._id;
    const isBusinessActive = business && business.status === 'active' && business.verified;

    if (!isBusinessRegistered || currentPage === 'business-profile-setup') {
      return (
        <BusinessProfileScreen
          existingBusiness={business}
          onSubmit={handleBusinessSubmit}
          onCancel={currentPage !== 'business-profile-setup' ? () => setCurrentPage('dashboard') : undefined}
          loading={false}
        />
      );
    }

    if (!isBusinessActive) {
      return <BusinessPendingScreen business={business} onLogout={handleLogout} />;
    }

    if (isBusinessActive) {
      switch (currentPage) {
        case 'dashboard':
          return <DashboardScreen existingBusiness={business} user={user} notify={notify} />;
        case 'posts':
          return <PostsScreen business={business} currentUser={user} notify={notify} />;
        case 'products':
          return <ProductsScreen business={business} notify={notify} />;
        case 'promotions':
          return <PromotionsScreen business={business} notify={notify} />;
        case 'business-profile':
          return (
            <BusinessProfileScreen
              existingBusiness={business}
              onSubmit={handleBusinessSubmit}
              onCancel={() => setCurrentPage('dashboard')}
              loading={false}
            />
          );
        default:
          return <DashboardScreen existingBusiness={business} user={user} notify={notify} />;
      }
    }

    return (
      <div className="p-6 text-center text-destructive">Authentication/State Error. Please refresh.</div>
    );
  };

  const isMainApp = token && business && business.status === 'active' && business.verified;

  return (
    <div className={`font-sans ${isMainApp ? 'flex min-h-screen bg-background' : 'min-h-screen'}`}>
      {isMainApp && (
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          business={business}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`${isMainApp ? 'flex-1 flex flex-col min-h-screen overflow-hidden' : 'w-full'}`}>
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
              <span className="font-bold text-foreground">{business?.businessName || 'Zooda'}</span>
            </div>
            <div className="w-10" />
          </header>
        )}

        {/* Main Content */}
        <main className={`${isMainApp ? 'flex-1 p-4 lg:p-6 overflow-y-auto' : ''}`}>
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

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <div className="fixed top-4 right-4 z-50">
            <Notification {...notification} onClose={() => setNotification(null)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
