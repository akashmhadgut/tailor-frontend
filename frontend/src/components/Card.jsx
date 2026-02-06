import React, { useState, useRef, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';

const Card = ({ order, onEdit }) => {
  const { updateOrderStatus, columns } = useKanban();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleStatusChange = (e, newStatus) => {
    e.stopPropagation();
    updateOrderStatus(order._id, newStatus);
    setShowDropdown(false);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", order._id);
  };

  
  
  const formatStatus = (status) => {
    if (!status) return 'NEW';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const getNameSize = (text) => {
    if (!text) return 'text-[15px]';
    const len = text.length;
    if (len > 25) return 'text-[12px]';
    if (len > 18) return 'text-[13px]';
    return 'text-[15px]';
  };

  const getItemSize = (text) => {
    if (!text) return 'text-xs';
    if (text.length > 20) return 'text-[10px]';
    return 'text-xs';
  };

  const nameText = order.customerName || order.title;
  const itemText = order.type || order.dressType;
  const statusText = formatStatus(order.status);

  return (
    <div
      className="kanban-card"
      draggable="true"
      onDragStart={handleDragStart}
      onClick={() => onEdit(order)}
    >
      <div className="flex flex-col w-full gap-3">
        {/* Header: ID and Status */}
        <div className="flex flex-wrap justify-between items-center w-full gap-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              {order.orderId || '#ORD-XXXX'}
            </span>
          </div>
          
          <div className="relative group" ref={dropdownRef}>
            <div 
              onClick={toggleDropdown}
              className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded font-bold text-blue-600 uppercase tracking-wide border border-blue-100 whitespace-nowrap max-w-full overflow-hidden text-ellipsis cursor-pointer hover:bg-blue-100 transition-colors"
            >
               <span className="text-[10px]">
                {statusText}
               </span>
               <svg className={`w-3 h-3 text-blue-500 shrink-0 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
               </svg>
            </div>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1 max-h-60 overflow-y-auto">
                {columns.map((col) => (
                  <div
                    key={col.id || col.value}
                    onClick={(e) => handleStatusChange(e, col.value)}
                    className={`px-4 py-2 text-xs font-medium cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                      order.status === col.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span>{col.title}</span>
                    {order.status === col.value && (
                       <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                       </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body: Name */}
        <h4 className={`font-medium text-gray-900 leading-tight w-full breaking-words ${getNameSize(nameText)}`}>
          {nameText}
        </h4>

        {/* Footer: Item and Date */}
        <div className="flex items-center justify-between w-full mt-auto gap-2">
          {/* Tag replaces Dress Type position - Minimalist style */}
          <div className="flex items-center max-w-[60%]">
             <div className="w-1.5 h-1.5 rounded-full bg-[#E35039] shrink-0 mr-1.5"></div>
             <span className="text-[11px] font-medium text-[#E35039] tracking-tight truncate">
               {order.tags && order.tags.length > 0 ? order.tags[0] : 'High Priority'}
             </span>
          </div>

          {/* Date Pill */}
          <div className="flex items-center gap-1.5 bg-white/80 border border-gray-200 rounded px-2 py-1 ml-auto shrink-0">
             <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
             </svg>
              <span className="text-xs font-medium text-gray-600">
                {(() => {
                  const dateToUse = order.deliveryDate || order.createdAt;
                  if (!dateToUse) return 'N/A';
                  const d = new Date(dateToUse);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}-${month}-${year}`;
                })()}
              </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
