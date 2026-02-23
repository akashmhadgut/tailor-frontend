import React, { useState } from 'react';
import { useKanban } from '../../context/KanbanContext';

const MobileOrderCard = ({ order, onClick }) => {
  const { updateOrder } = useKanban();
  const [toggleLoading, setToggleLoading] = useState(false);

  // Format date if it exists
  const formatDate = (dateString) => {
    if (!dateString) return '26/02/2026';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
  };

  // Match Mongoose enum: ['Pending', 'Paid']
  const isPaid = order.paymentStatus === 'Paid';

  const handlePaymentToggle = async (e) => {
    e.stopPropagation();
    if (toggleLoading) return;

    // Fixed: Use 'Pending' instead of 'Unpaid' to match backend Mongoose enum
    const nextStatus = isPaid ? 'Pending' : 'Paid';
    setToggleLoading(true);
    try {
      await updateOrder(order._id, { 
        paymentStatus: nextStatus
      });
    } catch (error) {
      console.error('Failed to toggle payment status', error);
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div 
      onClick={onClick}
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", order._id);
        // Optional: Add a class for visual feedback
        e.currentTarget.classList.add('opacity-50');
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('opacity-50');
      }}
      className="bg-white rounded-[12px] p-[16px] mb-[12px] shadow-[0px_2px_8px_rgba(0,0,0,0.04)] border border-transparent active:scale-[0.98] transition-all cursor-pointer touch-none"
    >
      {/* Header: Order ID and Payment Toggle */}
      <div className="flex justify-between items-center mb-[4px]">
        <span className="text-[#AFB7BE] text-[12px] font-inter font-medium uppercase tracking-wider">
          {order.orderId || 'ORD-792053-598'}
        </span>
        
        {/* Interactive Payment Toggle */}
        <button 
          onClick={handlePaymentToggle}
          disabled={toggleLoading}
          className={`flex items-center transition-opacity ${toggleLoading ? 'opacity-50' : 'opacity-100'}`}
        >
          {isPaid ? (
            <svg width="39" height="21" viewBox="0 0 39 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.5 10.5C0.5 4.97715 4.97715 0.5 10.5 0.5H28.5C34.0228 0.5 38.5 4.97715 38.5 10.5C38.5 16.0228 34.0228 20.5 28.5 20.5H10.5C4.97715 20.5 0.5 16.0228 0.5 10.5Z" fill="#5858CB" stroke="#5858CB"/>
              <path d="M20.5 10.5C20.5 6.08172 24.0817 2.5 28.5 2.5C32.9183 2.5 36.5 6.08172 36.5 10.5C36.5 14.9183 32.9183 18.5 28.5 18.5C24.0817 18.5 20.5 14.9183 20.5 10.5Z" fill="white" stroke="#5858CB"/>
            </svg>
          ) : (
            <svg width="39" height="21" viewBox="0 0 39 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.5 10.5C0.5 4.97715 4.97715 0.5 10.5 0.5H28.5C34.0228 0.5 38.5 4.97715 38.5 10.5C38.5 16.0228 34.0228 20.5 28.5 20.5H10.5C4.97715 20.5 0.5 16.0228 0.5 10.5Z" fill="#E9E9E9" stroke="#E9E9E9"/>
              <path d="M2.5 10.5C2.5 6.08172 6.08172 2.5 10.5 2.5C14.9183 2.5 18.5 6.08172 18.5 10.5C18.5 14.9183 14.9183 18.5 10.5 18.5C6.08172 18.5 2.5 14.9183 2.5 10.5Z" fill="white" stroke="#E9E9E9"/>
            </svg>
          )}
        </button>
      </div>

      {/* Name and New Call Icon */}
      <div className="flex justify-between items-center mb-[4px]">
        <h4 className="text-[#424242] text-[18px] font-bold font-inter tracking-tight">
          {order.customerName || 'Diya Menon'}
        </h4>
        <button className="text-[#5858CB] p-1 active:scale-90 transition-transform">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5992 9.2408C7.72312 9.29771 7.86272 9.31071 7.99502 9.27766C8.12731 9.24462 8.2444 9.16749 8.327 9.059L8.54 8.78C8.65178 8.63097 8.79672 8.51 8.96334 8.42669C9.12997 8.34337 9.31371 8.3 9.5 8.3H11.3C11.6183 8.3 11.9235 8.42643 12.1485 8.65147C12.3736 8.87652 12.5 9.18174 12.5 9.5V11.3C12.5 11.6183 12.3736 11.9235 12.1485 12.1485C11.9235 12.3736 11.6183 12.5 11.3 12.5C8.43566 12.5 5.68864 11.3621 3.66325 9.33675C1.63785 7.31136 0.5 4.56434 0.5 1.7C0.5 1.38174 0.626428 1.07652 0.851472 0.851472C1.07652 0.626428 1.38174 0.5 1.7 0.5H3.5C3.81826 0.5 4.12348 0.626428 4.34853 0.851472C4.57357 1.07652 4.7 1.38174 4.7 1.7V3.5C4.7 3.68629 4.65663 3.87003 4.57331 4.03666C4.49 4.20328 4.36904 4.34822 4.22 4.46L3.9392 4.6706C3.82905 4.75471 3.75141 4.87435 3.71947 5.00921C3.68754 5.14407 3.70327 5.28583 3.764 5.4104C4.58401 7.07592 5.93265 8.42288 7.5992 9.2408Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Date */}
      <div className="text-[#AFB7BE] text-[14px] font-inter mb-[16px]">
        {formatDate(order.deliveryDate)}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-[8px] mb-[16px]">
        {order.tags && order.tags.map((tag, idx) => {
          const tagLabel = typeof tag === 'string' ? tag : (tag.name || tag.label);
          
          const colors = {
            'Urgent': { bg: '#FFF0EE', text: '#424242' },
            'Delicate': { bg: '#F2F1FF', text: '#424242' },
            'Extra Attention': { bg: '#FFF6E3', text: '#424242' },
            'Repair': { bg: '#EDF6FF', text: '#424242' },
            'VIP': { bg: '#F2FFDA', text: '#424242' }
          };

          const style = colors[tagLabel] || { bg: '#F5FAFE', text: '#424242' };

          return (
            <span 
              key={idx}
              className="px-[12px] py-[6px] rounded-[50px] text-[12px] font-semibold font-inter shadow-sm"
              style={{ backgroundColor: style.bg, color: style.text }}
            >
              {tagLabel}
            </span>
          );
        })}
      </div>

      {/* Progress Segments */}
      <div className="flex gap-[8px] mt-2">
        {['new', 'in_progress', 'completed', 'fitting', 'ready_for_pickup'].map((statusKey, index) => {
          const STATUS_COLORS = ['#D4CDFF', '#F8E7CB', '#AED8AE', '#CBE5FF', '#FCC6C4'];
          const statuses = ['new', 'in_progress', 'completed', 'fitting', 'ready_for_pickup'];
          const currentStatusIndex = statuses.indexOf(order.status || 'new');
          const isActive = index <= (currentStatusIndex === -1 ? 0 : currentStatusIndex);
          const color = isActive ? (STATUS_COLORS[index] || STATUS_COLORS[STATUS_COLORS.length - 1]) : '#F1F1F1';

          return (
            <div 
              key={statusKey}
              className="h-[12px] flex-1 rounded-[4px] transition-all cursor-pointer active:scale-95 shadow-sm"
              style={{ backgroundColor: color }}
              onClick={(e) => {
                e.stopPropagation();
                updateOrder(order._id, { status: statusKey });
              }}
            ></div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileOrderCard;
