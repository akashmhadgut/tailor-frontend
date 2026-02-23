import React, { useState, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import useIsMobile from '../hooks/useIsMobile';

const CustomerModal = ({ onClose }) => {
  const isMobile = useIsMobile();
  const { addCustomer, refreshBoard, customersEnabled } = useKanban();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Customer Name is required";
    if (!formData.phone?.trim()) {
        errors.phone = "Phone Number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        errors.phone = "Enter a valid 10-digit number";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone') {
        const rawValue = value.replace(/\D/g, '');
        if (rawValue.length > 10) {
            setFormErrors(prev => ({ ...prev, phone: "Maximum 10 digits allowed" }));
            value = rawValue.slice(0, 10);
        } else {
            value = rawValue;
            if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: null }));
        }
    } else {
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
        setError("Please check the highlighted fields.");
        return;
    }

    if (!customersEnabled) {
      setError("Customer API is not available on the current server.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addCustomer(formData);
      try { await refreshBoard(); } catch (e) {}
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Failed to add customer";
      setError(msg);
      if (msg.toLowerCase().includes('phone number already exists')) {
        setError("This phone number is already registered.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[3000] bg-white flex flex-col font-inter animate-slide-up-full">
        {/* Mobile Header */}
        <div className="h-16 bg-white shrink-0 border-b flex items-center px-4">
          <button onClick={onClose} className="p-2 -ml-2 transition-colors text-gray-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 8L7.41421 10.5858C6.63316 11.3668 6.63317 12.6332 7.41421 13.4142L10 16" stroke="#AFB7BE" strokeWidth="2" strokeLinecap="round"/>
              <path d="M7 12L17 12" stroke="#AFB7BE" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="7" r="4" stroke="#5858CB" strokeWidth="1.5"/>
              <path d="M10 13H7C4.79086 13 3 14.7909 3 17V18C3 20.2091 4.79086 22 7 22H10" stroke="#5858CB" strokeWidth="1.5"/>
              <path d="M13.0625 16.5L19.9375 16.5" stroke="#5858CB" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M16.5 13.0625L16.5 19.9375" stroke="#5858CB" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="11" y="11" width="11" height="11" rx="5.5" stroke="#5858CB" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">New Customer</h1>
          </div>
        </div>

        {/* Mobile Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Customer Name <span className="text-red-500">*</span></label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleInputChange}
              placeholder="Full Name"
              className={`w-full h-11 px-4 bg-white border rounded-xl text-sm text-gray-900 outline-none transition-all ${formErrors.name ? 'border-red-400 bg-red-50/10' : 'border-gray-200 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5'}`}
            />
            {formErrors.name && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Phone Number <span className="text-red-500">*</span></label>
            <input 
              type="text" name="phone" value={formData.phone} onChange={handleInputChange}
              placeholder="10-digit number"
              className={`w-full h-11 px-4 bg-white border rounded-xl text-sm text-gray-900 outline-none transition-all ${formErrors.phone ? 'border-red-400 bg-red-50/10' : 'border-gray-200 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5'}`}
            />
            {formErrors.phone && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.phone}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Address</label>
            <textarea 
              name="address" value={formData.address} onChange={handleInputChange}
              placeholder="Customer's full address..."
              className="w-full h-24 p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 outline-none resize-none transition-all focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5"
            />
          </div>

          {error && <div className="text-red-500 text-sm font-bold text-center p-3 bg-red-50 rounded-xl border border-red-100 animate-shake">{error}</div>}
        </form>

        {/* Mobile Footer */}
        <div className="h-24 bg-white border-t px-6 flex items-center justify-between gap-4 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 h-11 border-2 border-gray-200 rounded-xl text-gray-500 text-base font-bold transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit} disabled={isSubmitting}
            className="flex-1 h-11 bg-[#5858CB] rounded-xl text-white text-base font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </div>
    );
  }

  // --- DESKTOP LAYOUT ---
  return (
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-lg bg-white rounded-3xl p-8 animate-scale-in">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10  rounded-xl flex items-center justify-center text-[#5858CB]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="7" r="4" stroke="#5858CB" strokeWidth="2"/>
                  <path d="M10 13H7C4.79086 13 3 14.7909 3 17V18C3 20.2091 4.79086 22 7 22H10" stroke="#5858CB" strokeWidth="2"/>
                  <path d="M13.0625 16.5L19.9375 16.5" stroke="#5858CB" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16.5 13.0625L16.5 19.9375" stroke="#5858CB" strokeWidth="2" strokeLinecap="round"/>
                  <rect x="11" y="11" width="11" height="11" rx="5.5" stroke="#5858CB" strokeWidth="2" strokeLinecap="round"/>
                </svg>
             </div>
             <h3 className="text-xl font-bold text-gray-800 tracking-tight">New Customer</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-2xl">&times;</button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
            <p className="text-sm font-bold text-red-800">Error</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Customer Name <span className="text-red-500">*</span></label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleInputChange}
              className={`w-full h-11 px-4 border rounded-xl text-sm outline-none transition-all ${formErrors.name ? 'border-red-400 bg-red-50/10' : 'border-gray-300 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5'}`}
            />
            {formErrors.name && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Phone Number <span className="text-red-500">*</span></label>
            <input 
              type="text" name="phone" value={formData.phone} onChange={handleInputChange}
              className={`w-full h-11 px-4 border rounded-xl text-sm outline-none transition-all ${formErrors.phone ? 'border-red-400 bg-red-50/10' : 'border-gray-300 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5'}`}
            />
            {formErrors.phone && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.phone}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Address</label>
            <textarea 
              name="address" value={formData.address} onChange={handleInputChange}
              rows="3"
              className="w-full p-4 border border-gray-300 rounded-xl text-sm outline-none resize-none transition-all focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-6 py-2.5 border-2 border-gray-100 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-all">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-[#5858CB] text-white rounded-xl font-bold hover:bg-[#4848A8] transition-all shadow-lg shadow-indigo-100 disabled:opacity-70">
                {isSubmitting ? 'Saving...' : 'Save Customer'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
