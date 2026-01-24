import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Heart,
  ShoppingBag,
  Tag,
  Users,
  Calendar,
  RefreshCw,
} from "lucide-react";
import axios from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatCard from "@/components/ui/StatCard";
import "./DASstyles.css";

interface DashboardScreenProps {
  existingBusiness: any;
  user: any;
  notify: (type: string, message: string) => void;
}

type RangeKey = "1d" | "7d" | "15d" | "30d";

const RANGE_DAYS: Record<RangeKey, number> = {
  "1d": 1,
  "7d": 7,
  "15d": 15,
  "30d": 30,
};

type AnalyticsState = {
  impressions: number;
  clicks: number;
  ctr: number; // always number now
};

const DashboardScreen = ({ existingBusiness, user, notify }: DashboardScreenProps) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ range state
  const [range, setRange] = useState<RangeKey>("7d");

  // ✅ analytics state (separate endpoint)
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    impressions: 0,
    clicks: 0,
    ctr: 0,
  });

  // Optional: separate loading state for analytics so dashboard doesn't flicker
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const businessId = existingBusiness?._id;
  const companyId = existingBusiness?._id; // if companyId is same as businessId in your system

  const dateRange = useMemo(() => {
    const days = RANGE_DAYS[range];
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    return { from, to, days };
  }, [range]);

  /**
   * ✅ Fetch dashboard data with days filter
   */
  const fetchDashboardData = useCallback(async () => {
    if (!businessId) {
      setError("Business ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`/dashboard/${businessId}`, {
        params: { days: dateRange.days },
      });

      if (response.data?.success && response.data.dashboard) {
        setDashboardData(response.data.dashboard);
      } else {
        setDashboardData(null);
        setError("Failed to load dashboard data.");
        notify("error", "Dashboard load failed.");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Error loading dashboard data.";
      setDashboardData(null);
      setError(errorMessage);
      notify("error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [businessId, dateRange.days, notify]);

  /**
   * ✅ Fetch company analytics (NOW supports days filter)
   */
  const fetchCompanyAnalytics = useCallback(async () => {
    if (!companyId) return;

    try {
      setAnalyticsLoading(true);

      const res = await axios.get(`/analytics/company/${companyId}`, {
        params: { days: dateRange.days },
      });

      if (res.data?.success) {
        const impressions = Number(res.data.impressions || 0);
        const clicks = Number(res.data.clicks || 0);
        const ctr = Number(res.data.ctr || 0);

        setAnalytics({ impressions, clicks, ctr });
      } else {
        setAnalytics({ impressions: 0, clicks: 0, ctr: 0 });
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      notify("error", "Failed to load analytics");
      setAnalytics({ impressions: 0, clicks: 0, ctr: 0 });
    } finally {
      setAnalyticsLoading(false);
    }
  }, [companyId, dateRange.days, notify]);

  // ✅ refetch when range changes
  useEffect(() => {
    fetchDashboardData();
    fetchCompanyAnalytics();
  }, [fetchDashboardData, fetchCompanyAnalytics]);

  const handleRefresh = () => {
    fetchDashboardData();
    fetchCompanyAnalytics();
  };

  // UI states
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
        <h2 className="text-2xl font-bold text-destructive mb-3">
          Dashboard Load Failed
        </h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <button onClick={handleRefresh} className="btn-primary" type="button">
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

  const {
    totalEngagement = 0,
    totalProducts = 0,
    totalPromotions = 0,
    followers = 0,
    totalPosts = 0,
  } = stats;

  // ✅ if engagement 0 fallback to posts
  const displayEngagement = totalEngagement > 0 ? totalEngagement : totalPosts;

  // ✅ from analytics endpoint
  const impressions = analytics.impressions;
  const clicks = analytics.clicks;
  const ctr = analytics.ctr;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <BarChart3 className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {business.name || existingBusiness?.businessName || "Business"} Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Overview of your business performance
            </p>
          </div>
        </div>

        {/* ✅ Range Filter + Refresh */}
        <div className="flex items-center gap-2">
          <div className="dashboard-range">
            <button
              className={`range-btn ${range === "1d" ? "active" : ""}`}
              onClick={() => setRange("1d")}
              type="button"
            >
              1 Day
            </button>
            <button
              className={`range-btn ${range === "7d" ? "active" : ""}`}
              onClick={() => setRange("7d")}
              type="button"
            >
              7 Days
            </button>
            <button
              className={`range-btn ${range === "15d" ? "active" : ""}`}
              onClick={() => setRange("15d")}
              type="button"
            >
              15 Days
            </button>
            <button
              className={`range-btn ${range === "30d" ? "active" : ""}`}
              onClick={() => setRange("30d")}
              type="button"
            >
              1 Month
            </button>
          </div>

          <button onClick={handleRefresh} className="btn-ghost" type="button">
            <RefreshCw size={18} />
          </button>
        </div>
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

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Impressions"
          value={analyticsLoading ? "…" : impressions}
          icon={<BarChart3 size={24} />}
          gradient="purple"
          delay={0}
        />
        <StatCard
          title="Website Clicks"
          value={analyticsLoading ? "…" : clicks}
          icon={<BarChart3 size={24} />}
          gradient="success"
          delay={0.1}
        />
        <StatCard
          title="CTR"
          value={analyticsLoading ? "…" : `${Number(ctr).toFixed(2)}%`}
          icon={<BarChart3 size={24} />}
          gradient="warning"
          delay={0.2}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            <span className="text-xs text-muted-foreground">
              Last {dateRange.days} days
            </span>
          </div>

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
                    <p className="font-medium text-sm text-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.time).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent activity for last {dateRange.days} days.
              </p>
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
                {business.category || existingBusiness?.businessCategory || "N/A"}
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
                <Calendar size={14} /> Joined
              </p>
              <p className="font-medium text-foreground">
                {new Date(
                  business.joinedDate || existingBusiness?.createdAt || Date.now()
                ).toLocaleDateString()}
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
                  <div
                    key={platform._id}
                    className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg"
                  >
                    <span className="text-sm font-medium capitalize text-foreground">
                      {platform._id}
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {platform.count} Posts
                      </span>
                      <span className="text-xs text-primary ml-2">
                        ({platform.totalEngagement} Engagements)
                      </span>
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
