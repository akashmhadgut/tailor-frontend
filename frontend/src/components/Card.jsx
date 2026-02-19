import React, { useState, useRef, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';

const Card = ({ order, onEdit }) => {
  const { updateOrderStatus, updateOrder, columns, availableTags } = useKanban();

  // Colors for each status step in order (matching Figma design)
  const STATUS_COLORS = [
    '#D4CDFF', // New - Purple
    '#F8E7CB', // In Process - Yellowish
    '#AED8AE', // Completed - Green
    '#CBE5FF', // Fitting - Blue
    '#FCC6C4', // Delivered - Pink/Red
  ];

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  // Helper for tag styles
  const getTagStyle = (tagName) => {
    if (!tagName) return { bg: '#F3F4F6', text: '#4B5563' };
    
    // Find the tag definition from context
    const tagDef = availableTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    
    if (tagDef && tagDef.color) {
        return { 
            bg: tagDef.color + '20', // ~12% opacity hex
            text: tagDef.color 
        };
    }

    // Fallbacks for legacy/unmatched tags
    const lower = tagName.toLowerCase();
    if (lower === 'urgent') return { bg: 'rgba(227, 80, 57, 0.05)', text: '#E35039' };
    if (lower === 'delicate') return { bg: 'rgba(100, 92, 218, 0.05)', text: '#645CDA' };
    if (lower === 'repair') return { bg: 'rgba(30, 136, 229, 0.05)', text: '#1E88E5' };
    return { bg: 'rgba(88, 88, 203, 0.05)', text: '#5858CB' }; // Default
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", order._id);
  };

  // Find current status index
  const currentStatusIndex = columns.findIndex(c => c.value === order.status);

  return (
    <div
      className="bg-white rounded-lg shadow-[0px_0px_4px_rgba(80,69,230,0.1)] p-[12px] w-full max-w-[204px] flex flex-col gap-[10px] cursor-pointer hover:shadow-md transition-shadow border border-transparent hover:border-gray-100"
      draggable="true"
      onDragStart={handleDragStart}
      onClick={() => onEdit(order)}
    >
      {/* Header: Order ID and Green Dot */}
      <div className="flex justify-between items-center w-full">
        <span className="text-[#B5B5B5] text-[12px] font-inter leading-[15px]">
            {order.orderId || '#ORD-XXXX'}
        </span>
        <div 
            className={`relative w-[32px] h-[18px] rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                order.paymentStatus === 'Pending' 
                ? 'bg-[#E5E7EB]' // Gray for Pending/Off
                : 'bg-[#3C965D]' // Green for Paid/On
            }`}
            onClick={(e) => {
                e.stopPropagation();
                const newStatus = order.paymentStatus === 'Pending' ? 'Paid' : 'Pending';
                updateOrder(order._id, { paymentStatus: newStatus });
            }}
            title={`Toggle Payment: ${order.paymentStatus || 'Paid'}`}
        >
            <div 
                className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out transform ${
                    order.paymentStatus === 'Pending' 
                    ? 'translate-x-[0px]' 
                    : 'translate-x-[14px]'
                }`}
            ></div>
        </div>
      </div>

      {/* Customer Name and Phone Icon */}
      <div className="flex justify-between items-center w-full">
        <h4 className="font-inter font-medium text-[14px] leading-[17px] text-[#424242] truncate max-w-[130px]" title={order.customerName}>
            {order.customerName || 'Unknown'}
        </h4>
        <div className="w-[24px] h-[24px] flex items-center justify-center">
            {/* Phone Icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#5858CB]">
                 <path d="M10.4 8.7C9.75 8.7 9.15 8.6 8.55 8.4C8.35 8.35 8.1 8.4 7.95 8.55L7 9.75C5.45 8.95 4.05 7.55 3.25 6L4.45 5.05C4.6 4.9 4.65 4.65 4.6 4.45C4.4 3.85 4.3 3.25 4.3 2.6C4.3 2.25 4.05 2 3.7 2H2.6C2.25 2 2 2.25 2 2.6C2 7.75 6.25 12 11.4 12C11.75 12 12 11.75 12 11.4V10.3C12 9.95 11.75 9.7 11.4 9.7H10.4V8.7Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
      </div>

      {/* Date */}
      <div className="text-[#B5B5B5] text-[14px] font-inter leading-[17px]">
        {formatDate(order.deliveryDate || order.createdAt)}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-[6px] w-full min-h-[19px]">
        {(order.tags && order.tags.length > 0) ? (
            order.tags.map((tag, idx) => {
                const style = getTagStyle(tag);
                return (
                    <div 
                        key={idx}
                        className="px-[8px] py-[2px] rounded-[8px] flex items-center justify-center h-[19px]"
                        style={{ backgroundColor: style.bg }}
                    >
                        <span className="text-[10px] font-inter font-normal leading-[15px]" style={{ color: style.text }}>
                            {tag}
                        </span>
                    </div>
                );
            })
        ) : (
            <div className="h-[19px]"></div>
        )}
      </div>

      {/* Status Progress Bar (Clickable Locks) */}
      <div className="flex items-center gap-[6px] w-full mt-[2px] pt-[2px]">
        {columns.map((col, index) => {
          
            const idx = currentStatusIndex === -1 ? 0 : currentStatusIndex;
            const isActive = index <= idx;
           
            
            const color = isActive ? (STATUS_COLORS[index] || STATUS_COLORS[STATUS_COLORS.length - 1]) : '#F1F1F1';

            return (
                <div
                    key={col.value || col.id}
                    className="h-[12px] flex-1 rounded-[4px] cursor-pointer transition-all hover:scale-y-125"
                    style={{ backgroundColor: color }}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Optimistic update handled by context
                        updateOrderStatus(order._id, col.value);
                    }}
                    title={`Move to ${col.title}`}
                ></div>
            );
        })}
      </div>

    </div>
  );
};

export default Card;
