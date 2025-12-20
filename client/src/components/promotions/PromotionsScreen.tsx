import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X, Edit, Pause, Play, Trash2, Filter } from 'lucide-react';
import axios from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PromotionsScreenProps {
  business: any;
  notify: (type: string, message: string) => void;
}

// Promotion Create Form Modal
const PromotionCreateForm = ({ businessId, onClose, onSuccess, notify, existingPromotion }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general',
    couponCode: '',
    link: '',
  
    status: 'draft',
    displayType: 'banner',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    if (existingPromotion) {
      setFormData({
        name: existingPromotion.name || '',
        description: existingPromotion.description || '',
        type: existingPromotion.type || 'general',
        couponCode: existingPromotion.couponCode || '',
        link: existingPromotion.link || '',
        status: existingPromotion.status || 'draft',
        displayType: existingPromotion.displayType || 'banner',
      });
    }
  }, [existingPromotion]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setPromoLoading(true);

  try {
    const isUpdate = !!existingPromotion;
    
    // Prepare request data
    let requestData: any = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      link: formData.link,
      discountType: 'none', // Default to none since we removed the fields
      discountValue: 0, // Default to 0
      status: formData.status,
      displayType: formData.displayType,
      business: businessId,
    };

    // Handle coupon code only for coupon type
    if (formData.type === 'coupon') {
      requestData.couponCode = formData.couponCode;
    }

    console.log('Submitting promotion data:', {
      isUpdate,
      promotionId: existingPromotion?._id,
      requestData
    });

    let response;
    if (isUpdate) {
      // For updates
      response = await axios.put(`/promotions/${existingPromotion._id}`, requestData);
      console.log('Update response:', response.data);
    } else {
      // For new promotions
      response = await axios.post('/promotions', requestData);
      console.log('Create response:', response.data);
      
      // If there's an image file, upload it separately
      if (imageFile && response.data.data?._id) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        await axios.put(`/promotions/${response.data.data._id}/image`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    }

    if (response.data.success) {
      notify('success', `Promotion ${isUpdate ? 'updated' : 'created'} successfully.`);
      onSuccess();
    } else {
      notify('error', response.data.message || `Failed to ${existingPromotion ? 'update' : 'create'} promotion.`);
    }
  } catch (err: any) {
    console.error('Promotion save error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.error || 
                        `Failed to ${existingPromotion ? 'update' : 'create'} promotion.`;
    
    notify('error', errorMessage);
  } finally {
    setPromoLoading(false);
  }
};

  const platformOptions = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'google', label: 'Google' },
    { value: 'email', label: 'Email' },
    { value: 'website', label: 'Website' },
  ];


  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
      >
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-xl font-semibold text-foreground">
            {existingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
          </h3>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Promotion Name</label>
            <input
              type="text"
              placeholder="Enter promotion name"
              value={formData.name}
              required
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              placeholder="Describe your promotion"
              value={formData.description}
              required
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Display Type</label>
              <select
                value={formData.displayType}
                onChange={(e) => setFormData({ ...formData, displayType: e.target.value })}
                className="input-field"
              >
                <option value="banner">Banner</option>
                <option value="popup">Popup</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Promotion Link</label>
            <input
              type="url"
              placeholder="https://example.com/promotion"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Promotion Image</label>
            <p className="text-xs text-muted-foreground mb-2">Recommended: 300×300px</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
            />
            {existingPromotion?.image && !imageFile && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-2">Current Image:</p>
                <img
                  src={existingPromotion.image}
                  alt="Current promotion"
                  className="w-24 h-24 object-cover rounded-xl border border-border"
                />
              </div>
            )}
          </div>

          <button type="submit" disabled={promoLoading} className="btn-primary w-full">
            {promoLoading ? 'Saving...' : existingPromotion ? 'Update Promotion' : 'Create Promotion'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// Promotion Card Component
const PromotionCard = ({ promotion, onEdit, notify, onStatusChange, onDelete }: any) => {
  const [isActive, setIsActive] = useState(promotion.status === 'active');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'scheduled':
        return 'badge-info';
      case 'paused':
        return 'badge-warning';
      case 'expired':
        return 'badge-danger';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getDiscountText = () => {
    if (promotion.discountType === 'none') {
      return 'PROMOTION';
    }
    return promotion.discountType === 'percentage'
      ? `${promotion.discountValue}% OFF`
      : `₹${promotion.discountValue} OFF`;
  };

 const togglePromotionStatus = async () => {
  setLoading(true);
  try {
    const newStatus = isActive ? 'paused' : 'active';
    
    console.log('Toggling status for promotion:', {
      promotionId: promotion._id,
      currentStatus: promotion.status,
      newStatus,
      isActive
    });
    
    // Prepare update data
    const updateData = {
      status: newStatus,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      platforms: promotion.platforms,
      displayType: promotion.displayType,
      link: promotion.link,
      business: promotion.business
    };
    
    const res = await axios.put(`/promotions/${promotion._id}`, updateData);
    
    console.log('Status toggle response:', res.data);
    
    if (res.data.success) {
      setIsActive(newStatus === 'active');
      notify('success', `Promotion ${newStatus} successfully.`);
      onStatusChange();
    } else {
      notify('error', res.data.message || 'Failed to update promotion status.');
    }
  } catch (err: any) {
    console.error('Status toggle error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    
    const errorMessage = err.response?.data?.message || 
                        'Failed to update promotion status.';
    
    notify('error', errorMessage);
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    setDeleting(true);
    try {
      await axios.delete(`/promotions/${promotion._id}`);
      notify('success', 'Promotion deleted successfully.');
      onDelete(promotion._id);
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Failed to delete promotion.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6 card-hover"
    >
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-foreground">{promotion.name}</h3>
            <span className={`badge ${getStatusColor(promotion.status)}`}>
              {promotion.status.toUpperCase()}
            </span>
          </div>

          <p className="text-muted-foreground mb-4">{promotion.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {promotion.platforms?.map((platform: string) => (
              <span key={platform} className="badge badge-primary capitalize">
                {platform}
              </span>
            ))}
          </div>

          {promotion.couponCode && (
            <div className="mb-4">
              <span className="text-sm font-medium text-muted-foreground">Coupon: </span>
              <code className="px-3 py-1 bg-secondary rounded-lg text-sm font-mono text-foreground">
                {promotion.couponCode}
              </code>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-2xl font-bold text-primary">{getDiscountText()}</span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(promotion)}
                className="p-2 text-muted-foreground hover:text-info hover:bg-info/10 rounded-lg transition-colors"
                title="Edit promotion"
              >
                <Edit size={18} />
              </button>

              <button
                onClick={togglePromotionStatus}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-warning/10 text-warning hover:bg-warning/20'
                    : 'bg-success/10 text-success hover:bg-success/20'
                } disabled:opacity-50`}
                title={isActive ? 'Pause promotion' : 'Activate promotion'}
              >
                {loading ? '...' : isActive ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Activate</>}
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-medium transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {deleting ? '...' : <><Trash2 size={14} /> Delete</>}
              </button>
            </div>
          </div>
        </div>

        {promotion.image && (
          <div className="flex-shrink-0">
            <img
              src={promotion.image}
              alt={promotion.name}
              className="w-24 h-24 object-cover rounded-xl border border-border"
              onError={(e: any) => {
                e.target.src = 'https://placehold.co/100x100/1a1a2e/ffffff?text=Promo';
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main Promotions Screen
const PromotionsScreen = ({ business, notify }: PromotionsScreenProps) => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isPromotionFormOpen, setIsPromotionFormOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);

  const businessId = business?._id;

  const fetchPromotions = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/promotions/${businessId}`);
      setPromotions(res.data.promotions || []);
    } catch (error: any) {
      notify('error', error.response?.data?.message || 'Failed to fetch promotions.');
    } finally {
      setLoading(false);
    }
  }, [businessId, notify]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handlePromotionCreated = () => {
    setIsPromotionFormOpen(false);
    setEditingPromotion(null);
    fetchPromotions();
  };

  const handleDeletePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((promo) => promo._id !== id));
  };

  const filteredPromotions = promotions.filter((promo) => {
    if (filter === 'all') return true;
    return promo.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Loading Promotions..." />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 rounded-xl">
            <Tag className="text-violet-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Promotions Manager</h1>
            <p className="text-muted-foreground text-sm">Create and manage your promotions</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingPromotion(null);
            setIsPromotionFormOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          New Promotion
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-muted-foreground" />
        {['all', 'active', 'scheduled', 'paused', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Promotions List */}
      <div className="space-y-4">
        {filteredPromotions.length > 0 ? (
          filteredPromotions.map((promotion) => (
            <PromotionCard
              key={promotion._id}
              promotion={promotion}
              onEdit={(promo: any) => {
                setEditingPromotion(promo);
                setIsPromotionFormOpen(true);
              }}
              notify={notify}
              onStatusChange={fetchPromotions}
              onDelete={handleDeletePromotion}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Tag size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No promotions found</h3>
            <p className="text-muted-foreground mb-6">
              {filter === 'all' ? "You haven't created any promotions yet." : `No ${filter} promotions found.`}
            </p>
            {filter === 'all' && (
              <button onClick={() => setIsPromotionFormOpen(true)} className="btn-primary">
                Create Your First Promotion
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPromotionFormOpen && (
          <PromotionCreateForm
            businessId={businessId}
            onClose={() => {
              setIsPromotionFormOpen(false);
              setEditingPromotion(null);
            }}
            onSuccess={handlePromotionCreated}
            notify={notify}
            existingPromotion={editingPromotion}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PromotionsScreen;