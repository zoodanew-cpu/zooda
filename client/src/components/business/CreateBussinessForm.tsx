import React, { useState } from "react";
import axios from "@/lib/api";
import { motion } from "framer-motion";
import { Building2, Upload, Phone, Globe, MapPin } from "lucide-react";

const CreateBusinessForm = () => {
  const [formData, setFormData] = useState({
    businessName: "",
    businessCategory: "",
    businessDescription: "",
    businessWebsite: "",
    businessAddress: "",
    businessPhone: "",
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      if (logo) {
        data.append("media", logo);
      }

      const res = await axios.post("/business", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        setMessage("Business created successfully!");

        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to create business";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto py-16 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">

        <div className="flex items-center gap-3 mb-6">
          <Building2 className="text-primary" size={26} />
          <h1 className="text-2xl font-bold">Create Your Business</h1>
        </div>

        {message && (
          <div className="mb-4 text-sm text-center text-red-500">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Business Name */}
          <div>
            <label className="text-sm font-medium">Business Name</label>
            <input
              name="businessName"
              required
              className="input w-full"
              placeholder="Enter business name"
              onChange={handleChange}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium">Category</label>
            <input
              name="businessCategory"
              required
              className="input w-full"
              placeholder="Restaurant, Clothing, Tech..."
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="businessDescription"
              required
              className="input w-full"
              rows={4}
              placeholder="Describe your business..."
              onChange={handleChange}
            />
          </div>

          {/* Website */}
          <div className="flex items-center gap-2">
            <Globe size={16} />
            <input
              name="businessWebsite"
              className="input w-full"
              placeholder="https://yourwebsite.com"
              onChange={handleChange}
            />
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <input
              name="businessPhone"
              required
              className="input w-full"
              placeholder="+91 9876543210"
              onChange={handleChange}
            />
          </div>

          {/* Address */}
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <input
              name="businessAddress"
              required
              className="input w-full"
              placeholder="Business Address"
              onChange={handleChange}
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
              onChange={handleFileChange}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? "Creating Business..." : "Create Business"}
          </button>

        </form>
      </div>
    </motion.div>
  );
};

export default CreateBusinessForm;