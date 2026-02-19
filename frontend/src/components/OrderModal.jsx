import React, { useState, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import api, { BASE_URL } from '../api';
import CustomDatePicker from './CustomDatePicker';

const OrderModal = ({ onClose, orderToEdit = null, initialReadOnly = true }) => {
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
  const [error, setError] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);

  const isEditMode = !!orderToEdit;
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnly);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (orderToEdit) {
      // Find the linked customer's latest address as a fallback
      const linkedCustomer = customers.find(c => c._id === orderToEdit.customer);
      
      setFormData({
        ...orderToEdit,
        tags: orderToEdit.tags || [],
        attachments: orderToEdit.attachments || [],
        customerPhone: orderToEdit.customerPhone || (linkedCustomer ? linkedCustomer.phone : ''),
        customerAddress: orderToEdit.customerAddress || (linkedCustomer ? linkedCustomer.address : '')
      });
      
      if (orderToEdit.customer) {
        setSelectedCustomer(orderToEdit.customer);
        setCustomerSearch(orderToEdit.customerName || (linkedCustomer ? linkedCustomer.name : ''));
      }
    }
  }, [orderToEdit, customers]);

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    if (isReadOnly) return;
    const files = e.target.files;
    const formDataUpload = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formDataUpload.append('files', files[i]);
    }

    setUploading(true);
    try {
      const { data } = await api.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...data]
      }));
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
      setError('File upload failed. Please try again.');
    }
  };

  const removeAttachment = (index) => {
    if (isReadOnly) return;
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData({ ...formData, attachments: newAttachments });
  };

  const [formErrors, setFormErrors] = useState({});

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

  // Clear specific error when user types
  const handleInputChange = (e) => {
      let { name, value } = e.target;

      if (name === 'customerPhone') {
          const rawValue = value.replace(/\D/g, '');
          if (rawValue.length > 10) {
              setFormErrors(prev => ({ ...prev, customerPhone: "Maximum 10 digits allwoed" }));
              value = rawValue.slice(0, 10);
          } else {
              value = rawValue;
              if (formErrors.customerPhone) {
                  setFormErrors(prev => ({ ...prev, customerPhone: null }));
              }
          }
      } else {
          if (formErrors[name]) {
              setFormErrors(prev => ({ ...prev, [name]: null }));
          }
      }

      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
      setFormData(prev => ({ ...prev, deliveryDate: date }));
      if (formErrors.deliveryDate) {
          setFormErrors({ ...formErrors, deliveryDate: null });
      }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    if (!validateForm()) {
        setError("Please check the highlighted fields.");
        return;
    }

    setError(null);
    try {
      setUploading(true);
      // ... rest of logic
      const payload = { ...formData };
      
      // 1. Sync Customer Profile if existing customer and details changed
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
      } 
      // 2. Create new profile if requested
      else if (selectedCustomer === '__new') {
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

      // 3. Save Order
      if (isEditMode) {
        await api.patch(`/orders/${orderToEdit._id}`, payload);
      } else {
        await addOrder(payload);
      }
      
      await refreshBoard();
      onClose();
    } catch (error) {
    // ... catch logic
      console.error(error);
      const msg = error.response?.data?.message || error.message || "Failed to save order";
      setError(msg);
      if (msg.toLowerCase().includes('phone number already exists')) {
        setError("This phone number is already registered to another customer. Please use an existing profile or a different number.");
      }
    } finally {
      setUploading(false);
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

  return (
    <div className="modal-overlay">
       {/* ... wrapper divs ... */}
      <div className="modal-content overflow-y-auto max-h-[90vh] w-full max-w-lg md:max-w-2xl">
         {/* ... Header ... */}
        <div className="flex justify-between items-start mb-6">
           {/* ... header content ... */}
           <div className="space-y-1">
            <div className="flex items-center gap-2">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.3122 6.11111H6.87533C5.87322 6.11111 5.02581 6.85273 4.89298 7.84599L3.60588 17.4698C3.28511 19.8682 5.15078 22 7.57058 22H11.5M8.3122 6.11111V5C8.3122 3.89543 9.20763 3 10.3122 3H12.6872C13.7918 3 14.6872 3.89543 14.6872 5V6.11111M8.3122 6.11111V7.22222M8.3122 6.11111H14.6872M14.6872 6.11111H16.1777C17.1567 6.11111 17.9918 6.8198 18.1511 7.78576L18.4062 9.33333M14.6872 6.11111V7.22222" stroke="#5858CB" strokeLinecap="round"/>
                      <path d="M13.0625 16.5L19.9375 16.5" stroke="#5858CB" strokeLinecap="round"/>
                      <path d="M16.5 13.0625L16.5 19.9375" stroke="#5858CB" strokeLinecap="round"/>
                      <rect x="11" y="11" width="11" height="11" rx="5.5" stroke="#5858CB" strokeLinecap="round"/>
                   </svg>
               <h3 className="text-xl font-bold text-gray-800">
                 {!isEditMode ? 'New Order' : (isReadOnly ? 'View Order' : 'Edit Order')}
               </h3>
            </div>
            {/* ... Date badge ... */}
             {isEditMode && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 w-fit">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>Booked on: {(() => {
                  if (!formData.createdAt) return 'Today';
                  const d = new Date(formData.createdAt);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}-${month}-${year}`;
                })()}</span>
              </div>
            )}
           </div>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake flex items-start gap-3">
            <div className="text-red-500 mt-0.5">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Attention Needed</p>
              <p className="text-xs text-red-700 leading-relaxed mt-1">{error}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
           {/* Order ID & Status */}
          <div className="flex flex-col md:flex-row gap-4">
             <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">Order ID</label>
                <input 
                  type="text" 
                  className="form-input bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" 
                  value={formData.orderId} 
                  readOnly 
                  disabled
                />
             </div>
             <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                {isReadOnly ? (
                  <div className="form-input bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed">
                    {columns.find(c => c.value === formData.status)?.title || formData.status}
                  </div>
                ) : (
                  <select 
                    name="status" 
                    className="form-select border-gray-300 focus:ring-primary-500"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {columns.map(col => (
                      <option key={col._id || col.value} value={col.value}>{col.title}</option>
                    ))}
                  </select>
                )}
             </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
             {/* ... Search Customer ... */}
             {!isEditMode && (
              <div className="space-y-1 relative border-b border-gray-200 pb-4 mb-2">
                 {/* ... search input ... */}
                 <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center bg-primary-100 text-primary-600 rounded-full text-[10px]">🔍</span>
                  Quick Search Customer
                </label>
                <div className="relative group">
                   <input
                    type="text"
                    placeholder="Search by name or phone..."
                    className="form-input pl-10 pr-10 bg-white border-gray-300 focus:border-primary-500 transition-all"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                  />
                  {/* ... icons ... */}
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                   </div>
                   {customerSearch && (
                    <button 
                      type="button"
                      onClick={() => {
                        setCustomerSearch('');
                        setShowCustomerDropdown(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
                    >
                      &times;
                    </button>
                  )}
                  {showCustomerDropdown && (
                    // ... dropdown content ...
                      <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCustomerDropdown(false)}></div>
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 max-h-64 overflow-y-auto overflow-x-hidden animate-scale-in">
                          {/* ... create new button ... */}
                          <div className="p-2 border-b border-gray-50 sticky top-0 bg-white/90 backdrop-blur-md z-10">
                            <button
                                type="button"
                                onClick={() => {
                                setSelectedCustomer('__new');
                                setFormData(prev => ({ ...prev, customer: '', customerName: '', customerPhone: '', customerAddress: '' }));
                                setCustomerSearch('');
                                setShowCustomerDropdown(false);
                                setFormErrors({});
                                }}
                                className="w-full text-left px-3 py-2.5 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-lg flex items-center justify-between group transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                <span className="text-lg">+</span> Create New Profile
                                </span>
                                <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Quick Add</span>
                            </button>
                           </div>
                           <div className="p-1">
                             {/* ... list customers ... */}
                            {(() => {
                                const filtered = customers.filter(c => 
                                !customerSearch || 
                                customerSearch.toLowerCase() === (formData.customerName || '').toLowerCase() ||
                                c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                                c.phone.includes(customerSearch)
                                );
                                
                                return filtered.length === 0 ? (
                                <div className="p-6 text-center text-gray-400">
                                    <p className="text-sm font-medium">No customers found</p>
                                    <p className="text-[10px] mt-1">Try a different name or number</p>
                                </div>
                                ) : (
                                filtered.map(c => (
                                    <button
                                    key={c._id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCustomer(c._id);
                                        setFormData(prev => ({ 
                                        ...prev, 
                                        customer: c._id, 
                                        customerName: c.name,
                                        customerPhone: c.phone,
                                        customerAddress: c.address || ''
                                        }));
                                        setCustomerSearch(c.name);
                                        setShowCustomerDropdown(false);
                                        setFormErrors({});
                                    }}
                                    className={`w-full text-left px-3 py-3 rounded-lg group transition-all mb-0.5 ${selectedCustomer === c._id ? 'bg-primary-50 border-l-4 border-primary-500 pl-2' : 'hover:bg-gray-50'}`}
                                    >
                                      {/* ... customer item ... */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={`font-bold text-sm ${selectedCustomer === c._id ? 'text-primary-800' : 'text-gray-800 group-hover:text-primary-700'}`}>{c.name}</p>
                                                <p className="text-[11px] font-medium text-gray-500 mt-0.5 flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                                {c.phone}
                                                </p>
                                            </div>
                                            {selectedCustomer === c._id && (
                                                <span className="text-primary-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                </span>
                                            )}
                                        </div>
                                        {c.address && <p className="text-[10px] text-gray-400 truncate mt-1 pl-4 border-l border-gray-200">📍 {c.address}</p>}
                                    </button>
                                ))
                                );
                            })()}
                           </div>
                       </div>
                       </>
                  )}
                </div>
              </div>
            )}

            {isEditMode ? (
               // ... Edit Mode Customer View (Unchanged logically, just using standard inputs) ...
              <>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Customer Name</label>
                    <input 
                      type="text" 
                      className="form-input focus:ring-primary-500 bg-gray-50 cursor-not-allowed border-transparent"
                      placeholder="Enter Name"
                      value={formData.customerName}
                      disabled={true}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input focus:ring-primary-500 bg-gray-50 cursor-not-allowed border-transparent"
                      placeholder="Enter Phone"
                      value={formData.customerPhone}
                      disabled={true}
                    />
                  </div>
                </div>
                {/* ... address ... */}
                <div className="space-y-1 mt-2">
                  <label className="text-sm font-medium text-gray-700">Customer Address</label>
                  <div className="p-3 bg-gray-50/50 rounded-lg text-gray-800 text-sm whitespace-pre-wrap min-h-[46px] border border-gray-100 flex items-center">
                    {formData.customerAddress ? formData.customerAddress : (
                      <span className="text-gray-400 italic">No address provided</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
                !!selectedCustomer && <>
                 <div className="flex flex-col md:flex-row gap-4 animate-scale-in">
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Customer Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="customerName"
                      className={`form-input focus:ring-primary-500 ${isReadOnly || selectedCustomer !== '__new' ? 'bg-gray-50 cursor-not-allowed border-transparent' : 'border-gray-300'} ${formErrors.customerName ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      placeholder="Enter Name"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required={!isReadOnly}
                      disabled={isReadOnly || selectedCustomer !== '__new'}
                    />
                    {formErrors.customerName && <p className="text-xs text-red-500 mt-0.5">{formErrors.customerName}</p>}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="customerPhone"
                      className={`form-input focus:ring-primary-500 ${isReadOnly || selectedCustomer !== '__new' ? 'bg-gray-50 cursor-not-allowed border-transparent' : 'border-gray-300'} ${formErrors.customerPhone ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                      placeholder="Enter Phone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      required={!isReadOnly}
                      disabled={isReadOnly || selectedCustomer !== '__new'}
                    />
                    {formErrors.customerPhone && <p className="text-xs text-red-500 mt-0.5">{formErrors.customerPhone}</p>}
                  </div>
                </div>

                <div className="space-y-1 mt-2 animate-scale-in">
                   {/* ... Address ... */}
                  <label className="text-sm font-medium text-gray-700">Customer Address</label>
                  {isReadOnly || selectedCustomer !== '__new' ? (
                    <div className="p-3 bg-gray-50/50 rounded-lg text-gray-800 text-sm whitespace-pre-wrap min-h-[46px] border border-gray-100 flex items-center">
                      {formData.customerAddress ? formData.customerAddress : (
                        <span className="text-gray-400 italic">No address provided</span>
                      )}
                    </div>
                  ) : (
                    <textarea 
                      name="customerAddress"
                      className="form-input min-h-[60px] focus:ring-primary-500 border-gray-300"
                      placeholder="Enter Full Address"
                      value={formData.customerAddress}
                      onChange={handleInputChange}
                      rows="2"
                    />
                  )}
                </div>
                
                 {/* ... New profile banner ... */}
                {selectedCustomer === '__new' && !isReadOnly && (
                  <div className="mt-2 p-4 bg-primary-50/30 rounded-xl border border-primary-100 animate-scale-in">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                      <p className="text-xs font-bold text-primary-700 uppercase tracking-widest">New Customer Profile</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] text-gray-500 italic">Fill the fields above to complete the profile.</p>
                    </div>
                  </div>
                )}
                </>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Dress Type <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="type"
                className={`form-input ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''} ${formErrors.type ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="e.g. Suit"
                value={formData.type}
                onChange={handleInputChange}
                required={!isReadOnly}
                disabled={isReadOnly}
              />
              {formErrors.type && <p className="text-xs text-red-500 mt-0.5">{formErrors.type}</p>}
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <input 
                type="number" 
                name="quantity"
                className={`form-input ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Delivery Date <span className="text-red-500">*</span></label>
              <div className={`${formErrors.deliveryDate ? 'border border-red-500 rounded-lg' : ''}`}>
                  <CustomDatePicker 
                      selectedDate={formData.deliveryDate} 
                      onChange={handleDateChange}
                      isReadOnly={isReadOnly}
                      disablePast={true}
                  />
              </div>
              {formErrors.deliveryDate && <p className="text-xs text-red-500 mt-0.5">{formErrors.deliveryDate}</p>}
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Payment Status</label>
              {isReadOnly ? (
                <div className="form-input bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed">
                  {formData.paymentStatus}
                </div>
              ) : (
                <select 
                  name="paymentStatus" 
                  className="form-select border-gray-300 focus:ring-primary-500"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea 
              name="notes"
              className={`form-input min-h-[80px] ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              rows="3"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder={isReadOnly ? 'No additional notes' : 'Measurement details, special instructions...'}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Selected Tags */}
              {formData.tags && formData.tags.map(tagName => {
                 const tagDef = availableTags?.find(t => t.name === tagName);
                 const bg = tagDef ? tagDef.color + '20' : '#F3F4F6';
                 const text = tagDef ? tagDef.color : '#4B5563';

                 return (
                    <div 
                        key={tagName} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        style={{ backgroundColor: bg, color: text }}
                    >
                      <span className="font-inter">{tagName}</span>
                      {!isReadOnly && (
                        <button 
                            type="button" 
                            onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagName) })}
                            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                        >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                            </svg>
                        </button>
                      )}
                    </div>
                 );
              })}
            </div>

            {/* Quick Add Suggestions */}
            {!isReadOnly && availableTags && availableTags.length > 0 && (
                 <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                    {availableTags.filter(t => !formData.tags.includes(t.name)).map(tag => (
                        <button
                            key={tag._id || tag.name}
                            type="button"
                            onClick={() => setFormData({ ...formData, tags: [...formData.tags, tag.name] })}
                            className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors flex items-center gap-1"
                        >
                            + {tag.name}
                        </button>
                    ))}
                 </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Attachment (Photos / Files)*</label>
            {!isReadOnly && (
              <div 
                className="relative w-full h-[93px] bg-[rgba(212,205,255,0.2)] rounded-[12px] flex flex-col items-center justify-center gap-[6px] cursor-pointer hover:bg-[rgba(212,205,255,0.3)] transition-colors group"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%235858CB' stroke-width='1' stroke-dasharray='6%2c 4' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
              >
                  <input 
                    type="file" 
                    multiple
                    id="file-upload"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="font-inter font-medium text-[14px] leading-[17px] text-[#363020]">Upload file</span>
                  <div className="flex items-center gap-1 font-inter font-normal text-[12px] leading-[15px] text-[#9D9D9D]">
                     <span>(PDF/JPG/PNG</span>
                     <div className="w-[3px] h-[3px] rounded-full bg-[#9D9D9D]"></div>
                     <span>default 5MB)</span>
                  </div>
              </div>
            )}
            {uploading && <div className="text-sm text-[#5858CB] font-medium mt-1 animate-pulse">Uploading...</div>}
            
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 group hover:border-[#5858CB] transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-lg">📄</span>
                        <a 
                          href={file.startsWith('http') ? file : `${BASE_URL}${file}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-sm text-gray-700 hover:text-[#5858CB] font-medium truncate max-w-[200px]"
                        >
                            {file.split('/').pop()}
                        </a>
                    </div>
                    {!isReadOnly && (
                      <button type="button" onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-100 mt-6">
            <div className="flex gap-2">
              {isEditMode && (
                  <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors">
                      Delete Order
                  </button>
              )}
            </div>
            
            <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="btn-secondary"
                >
                  {isReadOnly ? 'Close' : 'Cancel'}
                </button>
                {isReadOnly ? (
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsReadOnly(false);
                    }} 
                    className="btn-primary bg-indigo-600 hover:bg-indigo-700"
                  >
                    Edit Order Details
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={uploading}
                  >
                    {uploading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Order')}
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
