import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, Edit3, Globe, Phone, MapPin, X, Upload, 
  Building, FileText, Link as LinkIcon 
} from 'lucide-react';
import axios, { API_BASE_URL } from '@/lib/api';

interface BusinessProfileScreenProps {
  existingBusiness: any;
  onSubmit: (formData: any, logoFile: File | null) => void;
  onCancel?: () => void;
  loading: boolean;
}

const BusinessProfileScreen = ({ existingBusiness, onSubmit, onCancel, loading }: BusinessProfileScreenProps) => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessCategory: '',
    businessDescription: '',
    businessWebsite: '',
    businessAddress: '',
    businessPhone: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/categories`);
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (existingBusiness) {
      setFormData({
        businessName: existingBusiness.businessName || '',
        businessCategory: existingBusiness.businessCategory || '',
        businessDescription: existingBusiness.businessDescription || '',
        businessWebsite: existingBusiness.businessWebsite || '',
        businessAddress: existingBusiness.businessAddress || '',
        businessPhone: existingBusiness.businessPhone || '',
      });
      if (existingBusiness.logoUrl) {
        setPreviewLogo(existingBusiness.logoUrl);
      }
    }
  }, [existingBusiness]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreviewLogo(previewUrl);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setPreviewLogo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdating) return;

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key as keyof typeof formData] !== undefined && formData[key as keyof typeof formData] !== null) {
          submitData.append(key, formData[key as keyof typeof formData]);
        }
      });

      if (logoFile) {
        submitData.append('logo', logoFile);
      }

      let response;

      if (existingBusiness && existingBusiness._id) {
        response = await axios.put(`${API_BASE_URL}/business/${existingBusiness._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.success) {
          setUpdateSuccess(true);
          setLogoFile(null);
          if (onSubmit) {
            onSubmit(response.data.business, logoFile);
          }
          setTimeout(() => {
            setIsEditing(false);
            setUpdateSuccess(false);
          }, 2000);
        }
      } else {
        if (onSubmit) {
          onSubmit(formData, logoFile);
        }
      }
    } catch (error: any) {
      console.error('Update failed:', error);
      let errorMessage = 'Failed to update business profile. Please try again.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }
      setUpdateError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    if (existingBusiness) {
      setFormData({
        businessName: existingBusiness.businessName || '',
        businessCategory: existingBusiness.businessCategory || '',
        businessDescription: existingBusiness.businessDescription || '',
        businessWebsite: existingBusiness.businessWebsite || '',
        businessAddress: existingBusiness.businessAddress || '',
        businessPhone: existingBusiness.businessPhone || '',
      });
      setPreviewLogo(existingBusiness.logoUrl || null);
    }
    setLogoFile(null);
    setUpdateError(null);
    setUpdateSuccess(false);
    setIsEditing(false);
    if (onCancel) onCancel();
  };

  // View Mode
  if (existingBusiness && !isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-6"
      >
        <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-info p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {existingBusiness.logoUrl ? (
                  <img
                    src={existingBusiness.logoUrl}
                    alt="Business Logo"
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Building className="text-white" size={32} />
                  </div>
                )}
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{existingBusiness.businessName}</h1>
                  <p className="text-white/80 capitalize">{existingBusiness.businessCategory}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors flex items-center gap-2"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText size={14} />
                    Description
                  </label>
                  <p className="text-foreground mt-1">{existingBusiness.businessDescription || 'No description'}</p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin size={14} />
                    Address
                  </label>
                  <p className="text-foreground mt-1">{existingBusiness.businessAddress || 'No address'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone size={14} />
                    Phone
                  </label>
                  <p className="text-foreground mt-1">{existingBusiness.businessPhone || 'No phone'}</p>
                </div>

                {existingBusiness.businessWebsite && (
                  <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Globe size={14} />
                      Website
                    </label>
                    <a
                      href={existingBusiness.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mt-1 block"
                    >
                      {existingBusiness.businessWebsite}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Edit/Create Mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Briefcase className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {existingBusiness ? 'Edit Business Profile' : 'Register Your Business'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {existingBusiness ? 'Update your business information' : 'Fill in your business details to get started'}
              </p>
            </div>
          </div>
          {existingBusiness && (
            <button onClick={handleCancelEdit} className="btn-ghost">
              Cancel
            </button>
          )}
        </div>

        {updateSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-success/10 text-success rounded-xl border border-success/20"
          >
            Business profile updated successfully!
          </motion.div>
        )}

        {updateError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20"
          >
            {updateError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Business Name
              </label>
              <input
                type="text"
                placeholder="Enter business name"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <select
                value={formData.businessCategory}
                onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat: any) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              placeholder="Describe your business (max 500 characters)"
              value={formData.businessDescription}
              onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              className="input-field min-h-[120px] resize-none"
              maxLength={500}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.businessDescription.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Physical Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Enter your business address"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                className="input-field pl-12"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Website (Optional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.businessWebsite}
                  onChange={(e) => setFormData({ ...formData, businessWebsite: e.target.value })}
                  className="input-field pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Business Logo
            </label>
            
            {previewLogo ? (
              <div className="relative inline-block">
                <img
                  src={previewLogo}
                  alt="Logo preview"
                  className="w-32 h-32 object-cover rounded-2xl border-2 border-border"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 p-1.5 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="text-muted-foreground mb-2" size={24} />
                <span className="text-sm text-muted-foreground">Click to upload logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Recommended: Square image, max 5MB
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isUpdating || loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isUpdating || loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{existingBusiness ? 'Update Profile' : 'Register Business'}</>
              )}
            </button>
            {existingBusiness && (
              <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default BusinessProfileScreen;
