import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';

const Card = ({ order, onEdit }) => {
  const { updateOrderStatus, columns } = useKanban();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", order._id);
  };

  const toggleExpand = (e) => {
    // Prevent toggle if clicking on select or buttons
    if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
      setIsExpanded(!isExpanded);
    }
  };

  const getCardStyle = (status) => {
    switch (status) {
      case 'new':
        return {
          container: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
          text: 'text-blue-900',
          select: 'bg-blue-100 border-blue-300 text-blue-900',
        };
      case 'stitching_in_progress':
        return {
          container: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
          text: 'text-yellow-900',
          select: 'bg-yellow-100 border-yellow-300 text-yellow-900',
        };
      case 'done':
        return {
          container: 'bg-green-50 border-green-200 hover:bg-green-100',
          text: 'text-green-900',
          select: 'bg-green-100 border-green-300 text-green-900',
        };
      default:
        return {
          container: 'bg-white border-gray-200 hover:bg-gray-50',
          text: 'text-gray-900',
          select: 'bg-gray-100 border-gray-300 text-gray-900',
        };
    }
  };

  const style = getCardStyle(order.status);

  return (
    <div
      className={`rounded-lg border shadow-sm transition-all duration-200 overflow-hidden cursor-move mb-3 ${style.container}`}
      draggable="true"
      onDragStart={handleDragStart}
    >
      {/* Header / Summary View */}
      <div 
        className="p-3 cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2 overflow-hidden">
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                    order.status === 'new' ? 'bg-blue-500' : 
                    order.status === 'done' ? 'bg-green-500' : 
                    order.status === 'stitching_in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
              <span className="text-xs text-gray-500 font-mono">#{order.orderId}</span>
           </div>
           
           <div className="flex items-center gap-2">
             <select
                value={order.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border focus:outline-none focus:ring-1 focus:ring-opacity-50 cursor-pointer ${style.select}`}
              >
                {columns.map(col => (
                  <option key={col._id || col.value} value={col.value}>{col.title}</option>
                ))}
              </select>
             <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
           </div>
        </div>

        <div className="flex justify-between items-start">
           <h4 className={`font-semibold text-sm leading-tight truncate pr-2 ${style.text}`}>
             {order.customerName}
           </h4>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="border-t border-black/5 mb-3"></div>
          
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
               <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-wide">Type</span>
                  <span className="font-medium text-gray-800">{order.type}</span>
               </div>
               <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-wide">Qty</span>
                  <span className="font-medium text-gray-800">{order.quantity}</span>
               </div>
            </div>

            <div className="flex justify-between items-center">
               <span className="text-gray-500">Delivery</span>
               <span className="font-medium text-gray-800 bg-white/50 px-1.5 py-0.5 rounded border border-gray-100">
                 {order.deliveryDate || 'N/A'}
               </span>
            </div>

            <div className="flex justify-between items-center">
               <span className="text-gray-500">Payment</span>
               <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                  order.paymentStatus === 'Paid' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
               }`}>
                 {order.paymentStatus}
               </span>
            </div>

            {order.tags && order.tags.length > 0 && (
                <div className="pt-1">
                   <div className="flex flex-wrap gap-1">
                      {order.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-600">
                          {tag}
                        </span>
                      ))}
                   </div>
                </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(order);
            }}
            className="w-full mt-3 flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 py-1.5 rounded text-xs font-semibold shadow-sm transition-all"
          >
            Edit Order
          </button>
        </div>
      )}
    </div>
  );
};

export default Card;
