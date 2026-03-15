import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Globe,
  Phone,
  MapPin,
  Building,
  FileText,
  Plus,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Define the Business type for type safety
interface Business {
  businessName: string;
  businessCategory: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  logoUrl?: string;
  // Add any other fields returned by your API
}

const BusinessProfileScreen: React.FC = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/business/me");
      // Adjust based on your API response structure
      if (res.data?.business) {
        setBusiness(res.data.business);
      } else {
        // No business data – treat as empty (could also be a 404 handled below)
        setBusiness(null);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No business registered
        setBusiness(null);
      } else {
        // Network error or server error
        setError("Failed to load business profile. Please try again.");
        console.error("Error fetching business:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusiness();
  }, []);

  // Loading state with skeleton for better UX
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
          <div className="bg-gradient-to-r from-primary/50 to-info/50 p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/30" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-white/30 rounded" />
                <div className="h-4 w-24 bg-white/30 rounded" />
              </div>
            </div>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-5 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto"
      >
        <AlertCircle size={60} className="text-destructive mb-6" />
        <h2 className="text-2xl font-bold mb-3">Oops! Something went wrong</h2>
        <p className="text-muted-foreground mb-8">{error}</p>
        <button
          onClick={fetchBusiness}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </motion.div>
    );
  }

  // No business registered
  if (!business) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <Briefcase size={60} className="text-muted-foreground mb-6" aria-hidden="true" />
        <h2 className="text-2xl font-bold mb-3">No Business Registered</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Register your business to show your profile, products and promotions.
        </p>
        <Link
          to="/create-business"
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <Plus size={18} aria-hidden="true" />
          Add Business
        </Link>
      </motion.div>
    );
  }

  // Business profile view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-info p-6">
          <div className="flex items-center gap-4">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={`${business.businessName} logo`}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                <Building size={32} className="text-white" aria-hidden="true" />
              </div>
            )}
            <div className="text-white">
              <h1 className="text-2xl font-bold">{business.businessName}</h1>
              <p className="text-white/80 capitalize">{business.businessCategory}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid md:grid-cols-2 gap-6">
          <InfoItem
            icon={<FileText size={14} aria-hidden="true" />}
            label="Description"
            value={business.businessDescription || "No description"}
          />
          <InfoItem
            icon={<MapPin size={14} aria-hidden="true" />}
            label="Address"
            value={business.businessAddress || "No address"}
          />
          <InfoItem
            icon={<Phone size={14} aria-hidden="true" />}
            label="Phone"
            value={business.businessPhone || "No phone"}
          />
          {business.businessWebsite && (
            <InfoItem
              icon={<Globe size={14} aria-hidden="true" />}
              label="Website"
              value={
                <a
                  href={business.businessWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {business.businessWebsite}
                </a>
              }
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Helper component for consistent info display
const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div>
    <label className="text-sm text-muted-foreground flex items-center gap-2">
      {icon}
      {label}
    </label>
    <div className="mt-1 text-foreground">{value}</div>
  </div>
);

export default BusinessProfileScreen;