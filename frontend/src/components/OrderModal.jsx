import React, { useState, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import api, { BASE_URL } from '../api';
import CustomDatePicker from './CustomDatePicker';
import useIsMobile from '../hooks/useIsMobile';

const OrderModal = ({ onClose, orderToEdit = null, initialReadOnly = false }) => {
  const isMobile = useIsMobile();
  const { addOrder, columns, refreshBoard, availableTags, customers, addCustomer, updateCustomer } = useKanban();
  
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    orderId: `ORD-${Date.now().toString().slice(-6)}`,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customer: '',
    type: '',
    quantity: 1,
    deliveryDate: '',
    status: 'new',
    paymentStatus: 'Pending',
    notes: '',
    tags: [],
    attachments: [] 
  });
  const [uploading, setUploading] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnly);

  const isEditMode = !!orderToEdit;

  // Sync state if orderToEdit changes
  useEffect(() => {
    if (orderToEdit) {
      const linkedCustomer = customers.find(c => (typeof orderToEdit.customer === 'object' ? c._id === orderToEdit.customer._id : c._id === orderToEdit.customer));
      const customerName = orderToEdit.customerName || (typeof orderToEdit.customer === 'object' ? orderToEdit.customer.name : linkedCustomer?.name) || '';
      
      setFormData({
        ...orderToEdit,
        customerName: customerName,
        tags: orderToEdit.tags || [],
        attachments: orderToEdit.attachments || [],
        customerPhone: orderToEdit.customerPhone || (linkedCustomer ? linkedCustomer.phone : ''),
        customerAddress: orderToEdit.customerAddress || (linkedCustomer ? linkedCustomer.address : '')
      });
      if (orderToEdit.customer) {
        setSelectedCustomer(typeof orderToEdit.customer === 'object' ? orderToEdit.customer._id : orderToEdit.customer);
        setCustomerSearch(customerName);
      }
    }
  }, [orderToEdit, customers]);

  // Handle errors fade out
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName?.trim()) errors.customerName = "Customer Name is required";
    if (!formData.customerPhone?.trim()) {
        errors.customerPhone = "Phone Number is required";
    } else if (!/^\d{10}$/.test(formData.customerPhone.replace(/\D/g, ''))) {
        errors.customerPhone = "Enter a valid 10-digit number";
    }
    if (!formData.type?.trim()) errors.type = "Dress Type is required";
    if (!formData.deliveryDate) errors.deliveryDate = "Delivery Date is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'customerPhone') {
        const rawValue = value.replace(/\D/g, '');
        if (rawValue.length > 10) {
            setFormErrors(prev => ({ ...prev, customerPhone: "Maximum 10 digits allowed" }));
            value = rawValue.slice(0, 10);
        } else {
            value = rawValue;
            if (formErrors.customerPhone) setFormErrors(prev => ({ ...prev, customerPhone: null }));
        }
    } else {
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Today';
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const handleToggleTag = (tagName) => {
    if (isReadOnly) return;
    setFormData(prev => {
      const tags = prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName];
      return { ...prev, tags };
    });
  };

  const handleFileChange = async (e) => {
    if (isReadOnly) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validation
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        setError(`File "${file.name}" is too large. Max limit is 5MB.`);
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`File "${file.name}" has an invalid type. Only PDF, JPG, and PNG are allowed.`);
        return;
      }
    }

    const formDataUpload = new FormData();
    files.forEach(file => formDataUpload.append('files', file));
    
    setUploading(true);
    setError(null);
    try {
      const { data } = await api.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...data] }));
    } catch (error) {
      setError('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!validateForm()) {
        setError("Please check the highlighted fields.");
        return;
    }

    setIsFormSubmitting(true);
    setError(null);
    try {
      const payload = { ...formData };
      
      // Handle Customer Selection
      if (selectedCustomer && selectedCustomer !== '__new') {
        const originalCust = customers.find(c => c._id === selectedCustomer);
        if (originalCust) {
          const nameChanged = formData.customerName !== originalCust.name;
          const phoneChanged = formData.customerPhone !== originalCust.phone;
          const addressChanged = formData.customerAddress !== (originalCust.address || '');
          if (nameChanged || phoneChanged || addressChanged) {
             await updateCustomer(selectedCustomer, {
               name: formData.customerName,
               phone: formData.customerPhone,
               address: formData.customerAddress
             });
          }
        }
        payload.customer = selectedCustomer;
      } else if (selectedCustomer === '__new') {
        const created = await addCustomer({ 
          name: formData.customerName, 
          phone: formData.customerPhone, 
          address: formData.customerAddress 
        });
        payload.customer = created._id;
        payload.customerName = created.name;
        payload.customerPhone = created.phone;
        payload.customerAddress = created.address;
      }

      if (isEditMode) {
        await api.patch(`/orders/${orderToEdit._id}`, payload);
      } else {
        await addOrder(payload);
      }
      
      await refreshBoard();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Failed to save order";
      setError(msg);
      if (msg.toLowerCase().includes('phone number already exists')) {
        setError("This phone number is already registered to another customer.");
      }
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await api.delete(`/orders/${orderToEdit._id}`);
        await refreshBoard();
        onClose();
      } catch (error) {
        alert("Failed to delete order");
      }
    }
  };

  // --- MOBILE LAYOUT ---
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[3000] bg-white flex flex-col font-inter animate-slide-up-full">
        {/* Mobile Header */}
        <div className="h-16 bg-white shrink-0 border-b flex flex-col justify-center px-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 -ml-2 transition-colors text-gray-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 8L7.41421 10.5858C6.63316 11.3668 6.63317 12.6332 7.41421 13.4142L10 16" stroke="#AFB7BE" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 12L17 12" stroke="#AFB7BE" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.3122 6.11111H6.87533C5.87322 6.11111 5.02581 6.85273 4.89298 7.84599L3.60588 17.4698C3.28511 19.8682 5.15078 22 7.57058 22H11.5M8.3122 6.11111V5C8.3122 3.89543 9.20763 3 10.3122 3H12.6872C13.7918 3 14.6872 3.89543 14.6872 5V6.11111M8.3122 6.11111V7.22222M8.3122 6.11111H14.6872M14.6872 6.11111H16.1777C17.1567 6.11111 17.9918 6.8198 18.1511 7.78576L18.4062 9.33333M14.6872 6.11111V7.22222" stroke="#5858CB" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M13.0625 16.5L19.9375 16.5" stroke="#5858CB" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16.5 13.0625L16.5 19.9375" stroke="#5858CB" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="11" y="11" width="11" height="11" rx="5.5" stroke="#5858CB" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                    {isEditMode ? 'Edit Order' : 'New Order'}
                  </h1>
                </div>
                {isEditMode && (
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 w-fit mt-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span>Booked on: {formatDate(formData.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
            <button className="p-2 transition-colors text-gray-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 4L8 4C6.89543 4 6 4.89543 6 6V18C6 19.1046 6.89543 20 8 20H17C18.1046 20 19 19.1046 19 18V6C19 4.89543 18.1046 4 17 4H16" stroke="#AFB7BE" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10.5 6H14.5C15.3284 6 16 5.32843 16 4.5C16 3.67157 15.3284 3 14.5 3H10.5C9.67157 3 9 3.67157 9 4.5C9 5.32843 9.67157 6 10.5 6Z" stroke="#AFB7BE" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 11H15" stroke="#AFB7BE" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 15H15" stroke="#AFB7BE" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">
          {/* Row 1: Order ID & Status */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Order ID</label>
              <div className="h-11 bg-gray-50 border border-gray-100 rounded-xl px-3 flex items-center text-sm text-gray-500 font-medium font-mono tracking-tight">
                {formData.orderId}
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <div className="relative">
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full h-11 bg-white border rounded-xl px-3 text-sm text-gray-700 font-medium appearance-none outline-none transition-all ${isReadOnly ? 'bg-gray-50 border-gray-100 text-gray-400' : 'border-gray-200 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5'}`}
                >
                  {columns.map(col => <option key={col.value} value={col.value}>{col.title}</option>)}
                </select>
                {!isReadOnly && <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>}
              </div>
            </div>
          </div>

          {/* Customer Section */}
          <div className="flex flex-col gap-6">
            <h2 className="text-[16px] font-bold text-gray-800 tracking-tight flex items-center gap-1.5">Customer Details <span className="text-red-500">*</span></h2>
            
            {/* Quick Search Bar (Selection Interface) */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Search Customer</label>
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Name or phone..."
                  disabled={isReadOnly}
                  className={`w-full h-11 pl-10 pr-10 bg-white border rounded-lg text-sm transition-all focus:border-[#5858CB] outline-none ${formErrors.customerName ? 'border-red-400 bg-red-50/10' : 'border-gray-200'} ${selectedCustomer && selectedCustomer !== '__new' ? 'bg-gray-50 font-bold text-gray-800' : ''}`}
                  value={selectedCustomer && selectedCustomer !== '__new' ? formData.customerName : customerSearch}
                  onChange={(e) => {
                    if (selectedCustomer && selectedCustomer !== '__new') return;
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => {
                    if (selectedCustomer && selectedCustomer !== '__new') return;
                    setShowCustomerDropdown(true);
                  }}
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5858CB] transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                
                {selectedCustomer && selectedCustomer !== '__new' && !isReadOnly && (
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedCustomer('');
                      setCustomerSearch('');
                      setFormData(p => ({ ...p, customerName: '', customerPhone: '', customerAddress: '', customer: '' }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-all text-xl font-light"
                  >
                    &times;
                  </button>
                )}
              </div>
              
              {showCustomerDropdown && !isReadOnly && !selectedCustomer && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowCustomerDropdown(false)}></div>
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto p-1 animate-scale-in">
                    <button
                      type="button"
                      onClick={() => { setSelectedCustomer('__new'); setShowCustomerDropdown(false); setFormData(p => ({ ...p, customerName: '', customerPhone: '', customerAddress: '' })); }}
                      className="w-full text-left px-3 py-3 text-sm font-bold text-[#5858CB] bg-indigo-50/50 rounded-lg mb-1"
                    >
                      + Create New Profile
                    </button>
                    {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)).map(c => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c._id);
                          setFormData(prev => ({ ...prev, customerName: c.name, customerPhone: c.phone, customerAddress: c.address || '' }));
                          setCustomerSearch(c.name);
                          setShowCustomerDropdown(false);
                          setFormErrors(prev => ({ ...prev, customerName: null, customerPhone: null }));
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors border-b last:border-none"
                      >
                        <div className="font-bold text-sm text-gray-800">{c.name}</div>
                        <div className="text-xs text-gray-400 font-medium">{c.phone}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {(selectedCustomer || isEditMode) && (
              <div className="grid grid-cols-1 gap-5 animate-slide-down">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Customer Name <span className="text-red-500">*</span></label>
                  </div>
                  <input 
                    type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} disabled={isReadOnly || (selectedCustomer !== '__new')}
                    className={`w-full h-11 px-4 bg-white border rounded-xl text-sm text-gray-900 outline-none transition-all ${isReadOnly || (selectedCustomer !== '__new') ? 'bg-gray-50 text-gray-400 border-gray-100' : 'border-gray-200 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5'} ${formErrors.customerName ? 'border-red-400 bg-red-50/10' : ''}`}
                  />
                  {formErrors.customerName && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.customerName}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} disabled={isReadOnly || (selectedCustomer !== '__new')}
                    className={`w-full h-11 px-4 bg-white border rounded-xl text-sm text-gray-900 outline-none transition-all ${isReadOnly || (selectedCustomer !== '__new') ? 'bg-gray-50 text-gray-400 border-gray-100' : 'border-gray-200 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5'} ${formErrors.customerPhone ? 'border-red-400 bg-red-50/10' : ''}`}
                  />
                  {formErrors.customerPhone && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.customerPhone}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <textarea 
                    name="customerAddress" value={formData.customerAddress} onChange={handleInputChange} disabled={isReadOnly || (selectedCustomer !== '__new')}
                    className={`w-full h-20 p-4 bg-white border rounded-xl text-sm text-gray-900 outline-none resize-none transition-all ${isReadOnly || (selectedCustomer !== '__new') ? 'bg-gray-50 text-gray-400 border-gray-100' : 'border-gray-200 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5'}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Dress Type <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="type" value={formData.type} onChange={handleInputChange} disabled={isReadOnly} placeholder="e.g. Suit"
                  className={`w-full h-11 px-4 border rounded-xl text-sm text-gray-900 outline-none transition-all ${isReadOnly ? 'bg-gray-50' : 'border-gray-200 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5'} ${formErrors.type ? 'border-red-400 bg-red-50/10' : ''}`}
                />
                {formErrors.type && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.type}</p>}
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <input 
                  type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} disabled={isReadOnly} min="1"
                  className={`w-full h-11 px-4 border rounded-xl text-sm text-gray-900 outline-none transition-all ${isReadOnly ? 'bg-gray-50' : 'border-gray-200 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5'}`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-sm font-medium text-gray-700">Delivery Date <span className="text-red-500">*</span></label>
              <CustomDatePicker
                selectedDate={formData.deliveryDate} onChange={(date) => { setFormData(p => ({ ...p, deliveryDate: date })); if (formErrors.deliveryDate) setFormErrors(p => ({ ...p, deliveryDate: null })); }}
                isReadOnly={isReadOnly} disablePast={true}
                className={`w-full h-11 px-4 border rounded-xl text-sm text-gray-900 font-medium flex items-center justify-between transition-all ${isReadOnly ? 'bg-gray-50 border-gray-100' : `border-gray-200 focus-within:border-[#5858CB] focus-within:ring-4 focus-within:ring-[#5858CB]/5 ${formErrors.deliveryDate ? 'border-red-400 bg-red-50/10' : ''}`}`}
              />
              {formErrors.deliveryDate && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.deliveryDate}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Payment Status</label>
              <div className="relative">
                <select 
                  name="paymentStatus" 
                  value={formData.paymentStatus} 
                  onChange={(e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))} 
                  disabled={isReadOnly} 
                  className={`w-full h-11 px-4 border rounded-xl text-sm transition-all appearance-none outline-none bg-white ${isReadOnly ? 'bg-gray-50 border-gray-100 cursor-not-allowed text-gray-400' : 'border-gray-200 focus:border-[#5858CB] focus:ring-4 focus:ring-[#5858CB]/5 text-gray-900 font-medium'}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
                {!isReadOnly && <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            <div className="flex flex-wrap gap-2.5">
              {formData.tags.map(tag => (
                <div 
                  key={tag} className="h-9 truncate px-3 rounded-lg flex items-center gap-2 text-sm font-bold text-gray-700 animate-scale-in"
                  style={{ backgroundColor: availableTags?.find(t => t.name === tag)?.color + '20' || '#F5FAFE' }}
                >
                  <span>{tag}</span>
                  {!isReadOnly && <button type="button" onClick={() => handleToggleTag(tag)} className="text-gray-400 p-1">&times;</button>}
                </div>
              ))}
              {/* {!isReadOnly && (
                <button type="button" className="h-9 px-3 flex items-center gap-1.5 text-[#5858CB] text-sm font-bold bg-indigo-50/50 rounded-lg">
                  <span className="text-lg">+</span> Add Tag
                </button>
              )} */}
            </div>
            {!isReadOnly && (
              <div className="flex flex-wrap gap-2 mt-1">
                {availableTags?.filter(t => !formData.tags.includes(t.name)).slice(0, 5).map(tag => (
                  <button key={tag.name} type="button" onClick={() => handleToggleTag(tag.name)} className="text-[11px] font-bold px-2.5 py-1.5 rounded-md border border-gray-100 bg-gray-50/50 text-gray-400">
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-3 pb-8">
            <label className="text-sm font-medium text-gray-700">Attachment (Photos / Files) <span className="text-red-500">*</span></label>
            {!isReadOnly && (
              <label className="w-full h-24 bg-indigo-50/10 border-2 border-dashed border-[#5858CB]/20 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all">
                <input type="file" multiple onChange={handleFileChange} className="hidden" />
                <span className="text-sm font-bold text-gray-700">Upload Files</span>
                <span className="text-[10px] text-gray-400 font-medium">(PDF, JPG, PNG • Max 5MB)</span>
              </label>
            )}
            <div className="flex flex-col gap-2">
              {formData.attachments.map((file, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-600 truncate flex-1 pr-4">{file.split('/').pop()}</span>
                  {!isReadOnly && <button type="button" onClick={() => removeAttachment(idx)} className="text-red-400 text-lg">&times;</button>}
                </div>
              ))}
            </div>
          </div>
          {error && <div className="text-red-500 text-sm font-bold text-center p-3 bg-red-50 rounded-xl border border-red-100 animate-shake">{error}</div>}
        </form>

        {/* Mobile Footer */}
        <div className="h-24 bg-white border-t px-6 flex items-center justify-between gap-4 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          {isReadOnly ? (
             <button onClick={() => setIsReadOnly(false)} className="flex-1 h-11 bg-indigo-600 rounded-xl text-white text-base font-bold transition-all">
                Edit Order Details
             </button>
          ) : (
            <>
              <button 
                onClick={onClose}
                className="flex-1 h-11 border-2 border-gray-200 rounded-xl text-gray-500 text-base font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit} disabled={uploading || isFormSubmitting}
                className="flex-1 h-11 bg-[#5858CB] rounded-xl text-white text-base font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-70"
              >
                {uploading ? 'Uploading...' : (isFormSubmitting ? 'Saving...' : (isEditMode ? 'Save' : 'Create Order'))}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- DESKTOP LAYOUT (Default) ---
  return (
    <div className="modal-overlay">
      <div className="modal-content overflow-y-auto max-h-[90vh] w-full max-w-lg md:max-w-2xl bg-white rounded-3xl p-8 scrollbar-hide">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.3122 6.11111H6.87533C5.87322 6.11111 5.02581 6.85273 4.89298 7.84599L3.60588 17.4698C3.28511 19.8682 5.15078 22 7.57058 22H11.5M8.3122 6.11111V5C8.3122 3.89543 9.20763 3 10.3122 3H12.6872C13.7918 3 14.6872 3.89543 14.6872 5V6.11111M8.3122 6.11111V7.22222M8.3122 6.11111H14.6872M14.6872 6.11111H16.1777C17.1567 6.11111 17.9918 6.8198 18.1511 7.78576L18.4062 9.33333M14.6872 6.11111V7.22222" stroke="#5858CB" strokeLinecap="round"/>
                <path d="M13.0625 16.5L19.9375 16.5" stroke="#5858CB" strokeLinecap="round"/>
                <path d="M16.5 13.0625L16.5 19.9375" stroke="#5858CB" strokeLinecap="round"/>
                <rect x="11" y="11" width="11" height="11" rx="5.5" stroke="#5858CB" strokeLinecap="round"/>
              </svg>
              <h3 className="text-xl font-bold text-gray-800 tracking-tight">
                {isEditMode ? 'Edit Order' : 'New Order'}
              </h3>
            </div>
            {isEditMode && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 w-fit">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span>Booked on: {formatDate(formData.createdAt)}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake flex items-start gap-3">
             <svg className="text-red-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
             <div className="flex-1">
               <p className="text-sm font-bold text-red-800">Attention Needed</p>
               <p className="text-xs text-red-700 mt-1">{error}</p>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
             <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">Order ID</label>
                <div className="form-input bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200 flex items-center h-[42px] px-3 rounded-lg text-sm">{formData.orderId}</div>
             </div>
             <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} disabled={isReadOnly} className={`form-select w-full border-gray-300 focus:ring-primary-500 rounded-lg text-sm h-[42px] px-3 ${isReadOnly ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed' : ''}`}>
                  {columns.map(col => <option key={col.value} value={col.value}>{col.title}</option>)}
                </select>
             </div>
          </div>

          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
             {/* Desktop Search Section */}
             <div className="space-y-1 relative bg-white/40 p-4 rounded-xl border border-gray-100 mb-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Quick Search Customer</label>
                </div>

                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Search by name or phone..." 
                    disabled={isReadOnly}
                    className={`form-input w-full pl-10 pr-10 border rounded-xl h-[46px] text-sm transition-all duration-300 shadow-sm ${selectedCustomer && selectedCustomer !== '__new' ? 'bg-gray-50/80 font-bold text-gray-800 border-gray-200' : 'border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 bg-white'}`} 
                    value={selectedCustomer && selectedCustomer !== '__new' ? formData.customerName : customerSearch} 
                    onChange={(e) => {
                      if (selectedCustomer && selectedCustomer !== '__new') return;
                      setCustomerSearch(e.target.value); 
                      setShowCustomerDropdown(true); 
                    }} 
                    onFocus={() => {
                      if (selectedCustomer && selectedCustomer !== '__new') return;
                      setShowCustomerDropdown(true);
                    }}
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                  
                  {selectedCustomer && selectedCustomer !== '__new' && !isReadOnly && (
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedCustomer('');
                        setCustomerSearch('');
                        setFormData(p => ({ ...p, customerName: '', customerPhone: '', customerAddress: '', customer: '' }));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-all text-2xl font-light"
                    >
                      &times;
                    </button>
                  )}

                  {showCustomerDropdown && !isReadOnly && !selectedCustomer && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 max-h-56 overflow-y-auto p-1.5 animate-scale-in">
                      <button type="button" onClick={() => { setSelectedCustomer('__new'); setShowCustomerDropdown(false); setFormData(p => ({ ...p, customerName: '', customerPhone: '', customerAddress: '' })); }} className="w-full text-left px-4 py-3 text-xs font-extrabold text-primary-600 hover:bg-primary-50 rounded-xl mb-1.5 flex items-center gap-2">
                        <span className="text-lg">+</span> CREATE NEW PROFILE
                      </button>
                      <div className="border-t border-gray-50 my-1"></div>
                      {customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)).map(c => (
                        <button 
                          key={c._id} 
                          type="button" 
                          onClick={() => { 
                            setSelectedCustomer(c._id); 
                            setFormData(p => ({ ...p, customerName: c.name, customerPhone: c.phone, customerAddress: c.address || '' })); 
                            setCustomerSearch(c.name); 
                            setShowCustomerDropdown(false); 
                            setFormErrors(prev => ({ ...prev, customerName: null, customerPhone: null }));
                          }} 
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50 last:border-none flex flex-col"
                        >
                          <span className="font-bold text-sm text-gray-800">{c.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium tracking-wide">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
             </div>

             {(selectedCustomer || isEditMode) && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-scale-in">
                 <div className="space-y-1">
                   <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-500 uppercase">Name</label></div>
                   <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} disabled={isReadOnly || (selectedCustomer !== '__new')} className={`form-input w-full px-3 h-[42px] border rounded-lg text-sm ${isReadOnly || (selectedCustomer !== '__new') ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-300'} ${formErrors.customerName ? 'border-red-400' : ''}`} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                   <input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} disabled={isReadOnly || (selectedCustomer !== '__new')} className={`form-input w-full px-3 h-[42px] border rounded-lg text-sm ${isReadOnly || (selectedCustomer !== '__new') ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-300'} ${formErrors.customerPhone ? 'border-red-400' : ''}`} />
                 </div>
                 <div className="md:col-span-2 space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                   <textarea name="customerAddress" value={formData.customerAddress} onChange={handleInputChange} disabled={isReadOnly || (selectedCustomer !== '__new')} rows="2" className={`form-input w-full p-3 border rounded-lg text-sm resize-none ${isReadOnly || (selectedCustomer !== '__new') ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`} />
                 </div>
               </div>
             )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Dress Type <span className="text-red-500">*</span></label>
              <input type="text" name="type" value={formData.type} onChange={handleInputChange} disabled={isReadOnly} placeholder="e.g. Suit" className={`form-input w-full h-[46px] px-4 border rounded-xl text-sm transition-all ${isReadOnly ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5'} ${formErrors.type ? 'border-red-400 bg-red-50/10' : ''}`} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} disabled={isReadOnly} min="1" className={`form-input w-full h-[46px] px-4 border rounded-xl text-sm transition-all ${isReadOnly ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5'}`} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
             <div className="flex-1 space-y-1">
               <label className="text-sm font-medium text-gray-700">Delivery Date <span className="text-red-500">*</span></label>
               <CustomDatePicker selectedDate={formData.deliveryDate} onChange={(date) => { setFormData(p => ({ ...p, deliveryDate: date })); if (formErrors.deliveryDate) setFormErrors(p => ({ ...p, deliveryDate: null })); }} isReadOnly={isReadOnly} disablePast={true} className={`h-[46px] px-4 border rounded-xl flex items-center justify-between text-sm transition-all ${isReadOnly ? 'bg-gray-50 border-gray-100 text-gray-500' : `border-gray-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 ${formErrors.deliveryDate ? 'border-red-400 bg-red-50/10' : ''}`}`} />
               {formErrors.deliveryDate && <p className="text-[10px] text-red-500 mt-1">{formErrors.deliveryDate}</p>}
             </div>
             <div className="flex-1 space-y-1">
               <label className="text-sm font-medium text-gray-700">Payment Status</label>
               <select name="paymentStatus" value={formData.paymentStatus} onChange={(e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))} disabled={isReadOnly} className={`form-select w-full h-[46px] px-4 border rounded-xl text-sm transition-all ${isReadOnly ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5'}`}><option value="Pending">Pending</option><option value="Paid">Paid</option></select>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" value={formData.notes || ''} onChange={(e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))} disabled={isReadOnly} rows="3" placeholder="Enter measurements or special notes..." className={`form-input w-full p-4 border rounded-xl text-sm resize-none transition-all ${isReadOnly ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5'}`} />
          </div>

          {/* Desktop Tags Section */}
          <div className="flex flex-col gap-3">
             <label className="text-sm font-medium text-gray-700">Tags</label>
             <div className="flex flex-wrap gap-2.5">
               {formData.tags.map(tag => (
                 <div 
                   key={tag} className="h-9 truncate px-3 rounded-lg flex items-center gap-2 text-sm font-bold text-gray-700 animate-scale-in"
                   style={{ backgroundColor: availableTags?.find(t => t.name === tag)?.color + '20' || '#F5FAFE' }}
                 >
                   <span>{tag}</span>
                   {!isReadOnly && <button type="button" onClick={() => handleToggleTag(tag)} className="text-gray-400 p-1 hover:text-red-500 transition-colors">&times;</button>}
                 </div>
               ))}
             </div>
             {!isReadOnly && (
               <div className="flex flex-wrap gap-3 mt-1">
                 {availableTags?.filter(t => !formData.tags.includes(t.name)).slice(0, 5).map(tag => (
                   <button 
                     key={tag.name} 
                     type="button" 
                     onClick={() => handleToggleTag(tag.name)} 
                     className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                   >
                     + {tag.name}
                   </button>
                 ))}
               </div>
             )}
          </div>

          {/* Desktop Attachments Section */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700">Attachment (Photos / Files)*</label>
            {!isReadOnly && (
              <label className="w-full h-32 bg-indigo-50/10 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                <input type="file" multiple onChange={handleFileChange} className="hidden" />
                <span className="text-sm font-bold text-gray-700">Upload file</span>
                <span className="text-[11px] text-gray-400 font-medium">(PDF/JPG/PNG • default 5MB)</span>
              </label>
            )}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {formData.attachments.map((file, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 group">
                  <span className="text-xs text-gray-600 truncate flex-1 pr-4 font-medium">{file.split('/').pop()}</span>
                  {!isReadOnly && <button type="button" onClick={() => removeAttachment(idx)} className="text-gray-300 hover:text-red-500 transition-colors">&times;</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-between items-center gap-4">
             {isEditMode && (
               <button 
                 type="button" 
                 onClick={handleDelete} 
                 className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors"
               >
                 Delete Order
               </button>
             )}
             <div className="flex gap-3 ml-auto">
                <button type="button" onClick={onClose} className="px-6 py-2 border-2 border-gray-100 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-colors">{isReadOnly ? 'Close' : 'Cancel'}</button>
                {isReadOnly ? (
                  <button type="button" onClick={() => setIsReadOnly(false)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Edit Order</button>
                ) : (
                  <button type="submit" disabled={uploading || isFormSubmitting} className="px-8 py-2 bg-[#5858CB] text-white rounded-xl font-bold hover:bg-[#4848B0] transition-all shadow-lg shadow-indigo-100 disabled:opacity-70">
                    {uploading ? 'Uploading...' : (isFormSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save' : 'Create Order'))}
                  </button>
                )}
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
