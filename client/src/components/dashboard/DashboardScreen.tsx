import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Heart, ShoppingBag, Tag, Users, Calendar, RefreshCw } from 'lucide-react';
import axios from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatCard from '@/components/ui/StatCard';
import EngagementChart from '@/components/charts/EngagementChart';
import ProductsChart from '@/components/charts/ProductsChart';
import OverviewChart from '@/components/charts/OverviewChart';

interface DashboardScreenProps {
  existingBusiness: any;
  user: any;
  notify: (type: string, message: string) => void;
}

const DashboardScreen = ({ existingBusiness, user, notify }: DashboardScreenProps) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const businessId = existingBusiness?._id;

  const fetchDashboardData = useCallback(async () => {
    if (!businessId) {
      setError('Business ID is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/dashboard/${businessId}`);

      if (response.data && response.data.success && response.data.dashboard) {
        setDashboardData(response.data.dashboard);
        notify('success', 'Dashboard data loaded!');
      } else {
        setError('Failed to load dashboard data.');
        notify('error', 'Dashboard load failed.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error loading dashboard data.';
      setError(errorMessage);
      notify('error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [businessId, notify]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Loading Dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 text-center bg-destructive/5 rounded-2xl border border-destructive/20"
      >
        <h2 className="text-2xl font-bold text-destructive mb-3">Dashboard Load Failed</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary">
          <RefreshCw size={18} className="mr-2" />
          Try Again
        </button>
      </motion.div>
    );
  }

  if (!dashboardData) return null;

  const {
    stats = {},
    recentActivity = [],
    business = {},
    platformPerformance = [],
  } = dashboardData;

  const { totalEngagement = 0, totalProducts = 0, totalPromotions = 0, followers = 0, totalPosts = 0 } = stats;
  const displayEngagement = totalEngagement > 0 ? totalEngagement : totalPosts;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <BarChart3 className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {business.name || existingBusiness?.businessName || 'Business'} Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">Overview of your business performance</p>
          </div>
        </div>
        <button onClick={fetchDashboardData} className="btn-ghost">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Engagement"
          value={displayEngagement}
          icon={<Heart size={24} />}
          gradient="success"
          delay={0}
        />
        <StatCard
          title="Products Listed"
          value={totalProducts}
          icon={<ShoppingBag size={24} />}
          gradient="warning"
          delay={0.1}
        />
        <StatCard
          title="Active Promotions"
          value={totalPromotions}
          icon={<Tag size={24} />}
          gradient="purple"
          delay={0.2}
        />
        <StatCard
          title="Followers"
          value={followers}
          icon={<Users size={24} />}
          gradient="pink"
          delay={0.3}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EngagementChart />
        <ProductsChart />
      </div>

      {/* Monthly Overview */}
      <OverviewChart />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border">
            Recent Activity
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="p-4 bg-secondary/50 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.time).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity.</p>
            )}
          </div>
        </motion.div>

        {/* Business Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border">
            Business Details
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium text-foreground capitalize">
                {business.category || existingBusiness?.businessCategory || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar size={14} />
                Joined
              </p>
              <p className="font-medium text-foreground">
                {new Date(business.joinedDate || existingBusiness?.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {platformPerformance.length > 0 && (
            <>
              <h3 className="text-md font-semibold text-foreground mt-6 pt-4 border-t border-border mb-3">
                Platform Performance
              </h3>
              <div className="space-y-2">
                {platformPerformance.map((platform: any) => (
                  <div key={platform._id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                    <span className="text-sm font-medium capitalize text-foreground">{platform._id}</span>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">{platform.count} Posts</span>
                      <span className="text-xs text-primary ml-2">({platform.totalEngagement} Engagements)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardScreen;
