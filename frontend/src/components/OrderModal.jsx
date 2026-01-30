import React, { useState, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import api, { BASE_URL } from '../api';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    setError(null);
    try {
      setUploading(true);
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
      <div className="modal-content overflow-y-auto max-h-[90vh] w-full max-w-lg md:max-w-2xl">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-800">
              {!isEditMode ? 'New Order' : (isReadOnly ? 'View Order' : 'Edit Order')}
            </h3>
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
              <p className="text-sm font-bold text-red-800">Please check your input</p>
              <p className="text-xs text-red-700 leading-relaxed mt-1">{error}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                    onChange={handleChange}
                  >
                    {columns.map(col => (
                      <option key={col._id || col.value} value={col.value}>{col.title}</option>
                    ))}
                  </select>
                )}
             </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
            {!isReadOnly && (
              <div className="space-y-1 relative border-b border-gray-200 pb-4 mb-2">
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
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                  
                  {customerSearch && !isReadOnly && (
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
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCustomerDropdown(false)}></div>
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 max-h-64 overflow-y-auto overflow-x-hidden animate-scale-in">
                        <div className="p-2 border-b border-gray-50 sticky top-0 bg-white/90 backdrop-blur-md z-10">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer('__new');
                              setFormData(prev => ({ ...prev, customer: '', customerName: '', customerPhone: '', customerAddress: '' }));
                              setCustomerSearch('');
                              setShowCustomerDropdown(false);
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
                                  }}
                                  className={`w-full text-left px-3 py-3 rounded-lg group transition-all mb-0.5 ${selectedCustomer === c._id ? 'bg-primary-50 border-l-4 border-primary-500 pl-2' : 'hover:bg-gray-50'}`}
                                >
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

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">Customer Name</label>
                <input 
                  type="text" 
                  name="customerName"
                  className={`form-input focus:ring-primary-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed border-transparent' : 'border-gray-300'}`}
                  placeholder="Enter Name"
                  value={formData.customerName}
                  onChange={handleChange}
                  required={!isReadOnly}
                  disabled={isReadOnly}
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input 
                  type="text" 
                  name="customerPhone"
                  className={`form-input focus:ring-primary-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed border-transparent' : 'border-gray-300'}`}
                  placeholder="Enter Phone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required={!isReadOnly}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div className="space-y-1 mt-2">
              <label className="text-sm font-medium text-gray-700">Customer Address</label>
              {isReadOnly ? (
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
                  onChange={handleChange}
                  rows="2"
                />
              )}
            </div>

            {selectedCustomer === '__new' && !isReadOnly && (
              <div className="mt-2 p-4 bg-primary-50/30 rounded-xl border border-primary-100 animate-scale-in">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                  <p className="text-xs font-bold text-primary-700 uppercase tracking-widest">New Customer Profile</p>
                </div>
                <div className="space-y-3">
                  {/* These are synced with the main fields above, but we show the address again for clarity in new profile creation */}
                  <p className="text-[10px] text-gray-500 italic">Fill the fields above to complete the profile.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Dress Type</label>
              <input 
                type="text" 
                name="type"
                className={`form-input ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="e.g. Suit"
                value={formData.type}
                onChange={handleChange}
                required={!isReadOnly}
                disabled={isReadOnly}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <input 
                type="number" 
                name="quantity"
                className={`form-input ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Delivery Date</label>
              {isReadOnly ? (
                <div className="form-input bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed">
                  {(() => {
                    if (!formData.deliveryDate) return 'N/A';
                    const d = new Date(formData.deliveryDate);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day}-${month}-${year}`;
                  })()}
                </div>
              ) : (
                <input 
                  type="date" 
                  name="deliveryDate"
                  className="form-input border-gray-300 focus:ring-primary-500"
                  value={formData.deliveryDate ? formData.deliveryDate.split('T')[0] : ''}
                  onChange={handleChange}
                  required
                />
              )}
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
            
            {/* Input for new tags */}
            {!isReadOnly && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="form-input text-sm py-1"
                  placeholder="Type new tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (tagInput.trim()) {
                        const newTag = tagInput.trim();
                        if (!formData.tags.includes(newTag)) {
                          setFormData({ ...formData, tags: [...formData.tags, newTag] });
                        }
                        setTagInput('');
                      }
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                  onClick={() => {
                    if (tagInput.trim()) {
                      const newTag = tagInput.trim();
                      if (!formData.tags.includes(newTag)) {
                        setFormData({ ...formData, tags: [...formData.tags, newTag] });
                      }
                      setTagInput('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
            )}

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags && formData.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 border border-primary-200 flex items-center gap-1 animate-scale-in">
                  {tag}
                  {!isReadOnly && (
                    <button type="button" onClick={() => {
                       setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
                    }} className="hover:text-primary-900">&times;</button>
                  )}
                </span>
              ))}
            </div>

            {/* Suggestions/Available Tags */}
            {!isReadOnly && availableTags && availableTags.length > 0 && (
              <div className="text-xs text-gray-500">
                <span className="mr-2">Quick Add:</span>
                <div className="inline-flex flex-wrap gap-1 mt-1">
                  {availableTags.filter(t => !formData.tags.includes(t)).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFormData({ ...formData, tags: [...formData.tags, tag] })}
                      className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-600 hover:bg-white hover:border-gray-300 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                  {/* Default fallback tags if availableTags is mostly empty initially */}
                  {['Urgent', 'Delicate', 'Repair'].filter(t => !formData.tags.includes(t) && !availableTags.includes(t)).map(tag => (
                     <button
                      key={tag}
                      type="button"
                      onClick={() => setFormData({ ...formData, tags: [...formData.tags, tag] })}
                      className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-600 hover:bg-white hover:border-gray-300 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Attachments (Photos/Files)</label>
            {!isReadOnly && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                  <input 
                  type="file" 
                  multiple
                  id="file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium">
                      Upload a file
                  </label>
                  <span className="text-gray-500 text-sm ml-2">or drag and drop</span>
              </div>
            )}
            {uploading && <div className="text-sm text-primary-600 font-medium mt-1 animate-pulse">Uploading...</div>}
            
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 group hover:border-primary-200 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-lg">📄</span>
                        <a 
                          href={file.startsWith('http') ? file : `${BASE_URL}${file}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-sm text-gray-700 hover:text-primary-600 font-medium truncate max-w-[200px]"
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
