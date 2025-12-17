import React, { useState, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import api, { BASE_URL } from '../api';

const OrderModal = ({ onClose, orderToEdit = null }) => {
  const { addOrder, columns, refreshBoard, availableTags } = useKanban();
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    orderId: `ORD-${Date.now().toString().slice(-6)}`,
    customerName: '',
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

  const isEditMode = !!orderToEdit;

  useEffect(() => {
    if (orderToEdit) {
      setFormData({
        ...orderToEdit,
        tags: orderToEdit.tags || [],
        attachments: orderToEdit.attachments || []
      });
    }
  }, [orderToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
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
      alert('Upload failed');
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData({ ...formData, attachments: newAttachments });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.patch(`/orders/${orderToEdit._id}`, formData);
      } else {
        await addOrder(formData);
      }
      await refreshBoard();
      onClose();
    } catch (error) {
alert("Failed to save order");
      console.error(error);
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
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Order' : 'New Order'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none">&times;</button>
        </div>
        
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
                <select 
                  name="status" 
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {columns.map(col => (
                    <option key={col._id || col.value} value={col.value}>{col.title}</option>
                  ))}
                </select>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Customer Name</label>
            <input 
              type="text" 
              name="customerName"
              className="form-input" 
              placeholder="e.g. John Doe"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Dress Type</label>
              <input 
                type="text" 
                name="type"
                className="form-input" 
                placeholder="e.g. Suit"
                value={formData.type}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <input 
                type="number" 
                name="quantity"
                className="form-input" 
                value={formData.quantity}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Delivery Date</label>
              <input 
                type="date" 
                name="deliveryDate"
                className="form-input"
                value={formData.deliveryDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">Payment Status</label>
              <select 
                name="paymentStatus" 
                className="form-select"
                value={formData.paymentStatus}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea 
              name="notes"
              className="form-input min-h-[80px]"
              rows="3"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Measurement details, special instructions..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            
            {/* Input for new tags */}
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

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags && formData.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 border border-primary-200 flex items-center gap-1 animate-scale-in">
                  {tag}
                  <button type="button" onClick={() => {
                     setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
                  }} className="hover:text-primary-900">&times;</button>
                </span>
              ))}
            </div>

            {/* Suggestions/Available Tags */}
            {availableTags && availableTags.length > 0 && (
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
                    <button type="button" onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-100 mt-6">
            {isEditMode ? (
                <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors">
                    Delete Order
                </button>
            ) : (
                <div></div>
            )}
            <div className="flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? 'Wait...' : (isEditMode ? 'Update Order' : 'Create Order')}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
