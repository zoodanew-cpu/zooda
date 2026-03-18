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
  RefreshCw,
  Pencil,
  X,
  Save,
  Upload,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "@/lib/api";

interface Business {
  _id: string;
  businessName: string;
  businessCategory: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  logoUrl?: string;
}

const BusinessProfileScreen: React.FC = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Business>>({});
  const [editLogo, setEditLogo] = useState<File | null>(null);
  const [removeCurrentLogo, setRemoveCurrentLogo] = useState(false); // new state
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editErrors, setEditErrors] = useState<string[]>([]); // for validation array

  const fetchBusiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/business/me");
      if (res.data?.business) {
        setBusiness(res.data.business);
      } else {
        setBusiness(null);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setBusiness(null);
      } else {
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

  // Initialize edit form when business data is available
  useEffect(() => {
    if (business) {
      setEditFormData({
        businessName: business.businessName,
        businessCategory: business.businessCategory,
        businessDescription: business.businessDescription || "",
        businessAddress: business.businessAddress || "",
        businessPhone: business.businessPhone || "",
        businessWebsite: business.businessWebsite || "",
      });
      // Reset logo removal state when business changes
      setRemoveCurrentLogo(false);
      setEditLogo(null);
    }
  }, [business]);

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditLogo(e.target.files[0]);
      // When a new file is selected, uncheck the remove checkbox
      setRemoveCurrentLogo(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    setEditLoading(true);
    setEditError(null);
    setEditErrors([]);

    try {
      const data = new FormData();
      Object.entries(editFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          data.append(key, value);
        }
      });

      // Handle logo: if new file selected, append it
      if (editLogo) {
        data.append("media", editLogo);
      } 
      // If no new file but remove checkbox is checked, send removeLogo flag
      else if (removeCurrentLogo) {
        data.append("removeLogo", "true");
      }
      // Otherwise, no logo field is sent – keep existing

      const res = await axios.put(`/business/${business._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        await fetchBusiness();
        setIsEditing(false);
        setEditLogo(null);
        setRemoveCurrentLogo(false);
      } else {
        // Handle error messages (could be string or array)
        if (res.data.errors && Array.isArray(res.data.errors)) {
          setEditErrors(res.data.errors);
        } else {
          setEditError(res.data.message || "Failed to update business");
        }
      }
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        setEditErrors(responseData.errors);
      } else {
        setEditError(responseData?.message || "Failed to update business");
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
    setEditErrors([]);
    setEditLogo(null);
    setRemoveCurrentLogo(false);
    // Reset form to original business data
    if (business) {
      setEditFormData({
        businessName: business.businessName,
        businessCategory: business.businessCategory,
        businessDescription: business.businessDescription || "",
        businessAddress: business.businessAddress || "",
        businessPhone: business.businessPhone || "",
        businessWebsite: business.businessWebsite || "",
      });
    }
  };

  // Loading state with skeleton
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

  // Edit mode
  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto p-6"
      >
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Edit Business</h2>
            <button
              onClick={handleCancelEdit}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Display validation errors */}
          {editErrors.length > 0 && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <ul className="list-disc pl-5">
                {editErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {editError && !editErrors.length && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {editError}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-5">
            {/* Business Name */}
            <div>
              <label className="text-sm font-medium">Business Name</label>
              <input
                name="businessName"
                required
                value={editFormData.businessName || ""}
                onChange={handleEditChange}
                className="input w-full"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium">Category</label>
              <input
                name="businessCategory"
                required
                value={editFormData.businessCategory || ""}
                onChange={handleEditChange}
                className="input w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="businessDescription"
                rows={4}
                value={editFormData.businessDescription || ""}
                onChange={handleEditChange}
                className="input w-full"
              />
            </div>

            {/* Website */}
            <div className="flex items-center gap-2">
              <Globe size={16} />
              <input
                name="businessWebsite"
                value={editFormData.businessWebsite || ""}
                onChange={handleEditChange}
                className="input w-full"
                placeholder="https://example.com"
              />
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <input
                name="businessPhone"
                required
                value={editFormData.businessPhone || ""}
                onChange={handleEditChange}
                className="input w-full"
              />
            </div>

            {/* Address */}
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <input
                name="businessAddress"
                required
                value={editFormData.businessAddress || ""}
                onChange={handleEditChange}
                className="input w-full"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Upload size={16} />
                Business Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleEditFileChange}
              />
              {business.logoUrl && !editLogo && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current logo will be kept if no new file is selected.
                </p>
              )}
              {/* Logo removal checkbox – only if no new file is selected */}
              {business.logoUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="removeLogo"
                    checked={removeCurrentLogo}
                    onChange={(e) => setRemoveCurrentLogo(e.target.checked)}
                    disabled={!!editLogo} // disabled when new file chosen
                  />
                  <label htmlFor="removeLogo" className="text-sm text-muted-foreground">
                    Remove current logo (no new logo will be uploaded)
                  </label>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={editLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              >
                {editLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={editLoading}
                className="btn-secondary flex-1 py-3"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    );
  }

  // View mode (profile)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="bg-card rounded-2xl border border-border overflow-hidden relative">
        {/* Header with edit button */}
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

          {/* Edit button – positioned top‑right */}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            aria-label="Edit business"
          >
            <Pencil size={18} className="text-white" />
          </button>
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