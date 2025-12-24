import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';

const AddOrderModal = ({ onClose }) => {
  const { addOrder } = useKanban();
  const [formData, setFormData] = useState({
    orderId: `ORD-${Date.now().toString().slice(-6)}`,
    customerName: '',
    type: '',
    quantity: 1,
    deliveryDate: '',
    status: 'new', // Default status slug
    paymentStatus: 'Pending'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.customerName && formData.type) {
      try {
        await addOrder(formData);
        onClose();
      } catch (error) {
        alert("Failed to add order");
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-md md:max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Add New Order</h3>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group">
             <label>Order ID (Auto-generated)</label>
             <input type="text" className="form-input bg-gray-100" value={formData.orderId} readOnly />
          </div>

          <div className="input-group">
            <label>Customer Name</label>
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

          <div className="flex gap-4">
            <div className="input-group" style={{ flex: 1 }}>
              <label>Dress Type</label>
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
            <div className="input-group" style={{ flex: 1 }}>
              <label>Quantity</label>
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

          <div className="flex gap-4">
            <div className="input-group" style={{ flex: 1 }}>
              <label>Delivery Date</label>
              <input 
                type="date" 
                name="deliveryDate"
                className="form-input"
                value={formData.deliveryDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Payment Status</label>
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

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Order</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrderModal;
