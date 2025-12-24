import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';

const Card = ({ order, onEdit }) => {
  const { updateOrderStatus, columns } = useKanban();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", order._id);
  };

  const toggleExpand = (e) => {
    if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
      setIsExpanded(!isExpanded);
    }
  };

  const getCardStyle = (status) => {
    switch (status) {
      case 'new':
        return {
          container: 'bg-blue-50 border-l-4 border-l-blue-500 border-y border-r border-gray-200 hover:shadow-blue-200/50',
          text: 'text-gray-900',
          dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]',
          select: 'bg-blue-100 border-blue-200 text-blue-700 font-semibold',
        };
      case 'stitching_in_progress':
        return {
          container: 'bg-orange-50 border-l-4 border-l-orange-500 border-y border-r border-gray-200 hover:shadow-orange-200/50',
          text: 'text-gray-900',
          dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
          select: 'bg-orange-100 border-orange-200 text-orange-700 font-semibold',
        };
      case 'done':
        return {
          container: 'bg-green-50 border-l-4 border-l-green-500 border-y border-r border-gray-200 hover:shadow-green-200/50',
          text: 'text-gray-900',
          dot: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]',
          select: 'bg-green-100 border-green-200 text-green-700 font-semibold',
        };
      default:
        return {
          container: 'bg-white border-l-4 border-l-gray-400 border-y border-r border-gray-200 hover:shadow-gray-200/50',
          text: 'text-gray-900',
          dot: 'bg-gray-400',
          select: 'bg-gray-100 border-gray-200 text-gray-700',
        };
    }
  };

  const style = getCardStyle(order.status);
  const formattedDate = order.deliveryDate 
    ? new Date(order.deliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
    : 'N/A';

  return (
    <div
      className={`relative rounded-r-xl rounded-l-md shadow-sm transition-all duration-300 overflow-hidden cursor-move mb-3 hover:-translate-y-0.5 hover:shadow-lg mt-1 ${style.container}`}
      draggable="true"
      onDragStart={handleDragStart}
    >
      {/* Header / Summary View */}
      <div 
        className="p-3.5 cursor-pointer group"
        onClick={toggleExpand}
      >
        <div className="flex justify-between items-start gap-2">
            
            {/* Left Column: ID & Name (Syned gap-2.5 with Right Col) */}
            <div className="flex flex-col gap-2.5 overflow-hidden flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-110 ${style.dot}`} />
                    <span className="text-[10px] text-gray-600 font-mono tracking-wide whitespace-nowrap">#{order.orderId}</span>
                </div>
                <h4 className={`font-bold pt-1 text-sm leading-tight truncate tracking-tight ${style.text}`}>
                    {order.customerName}
                </h4>
            </div>
            {/* Right Group: Alignment Container */}
            <div className="flex items-start gap-2">
                {/* Stacked Content: Status & Badges (Right Aligned) */}
                <div className="flex flex-col items-end gap-2 max-w-[100px]">
                    {/* Status Dropdown */}
                    <div className="relative w-full flex justify-end">
                        <select
                            value={order.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border focus:outline-none focus:ring-2 focus:ring-opacity-50 cursor-pointer transition-colors w-full text-center ${style.select}`}
                        >
                            {columns.map(col => (
                            <option key={col._id || col.value} value={col.value}>{col.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Type & Date Badges (Removed truncation) */}
                    <div className="flex flex-wrap justify-end items-center gap-1 w-full">
                        <span className="text-[9px] font-semibold text-gray-600 bg-white/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-gray-200/50 shadow-sm whitespace-nowrap">
                                {order.type} <span className="text-gray-500 font-normal">×{order.quantity}</span>
                        </span>

                        <div className="flex items-center gap-1 text-[9px] bg-white/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-gray-200/50 shadow-sm text-gray-600 font-medium whitespace-nowrap">
                            <span className="text-gray-400">📅</span>
                            <span>{formattedDate}</span>
                        </div>
                    </div>
                </div>

                {/* Expand Chevron (Separate from alignment stack) */}
                <div className={`p-1 mt-0.5 rounded-full text-gray-400 transition-all duration-300 ${isExpanded ? 'bg-gray-100 text-gray-600 rotate-180' : 'group-hover:text-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
            <div className="px-3.5 pb-3.5 pt-0">
                <div className="border-t border-gray-200/60 mb-3 pt-2"></div>
                
                <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/50 p-2 rounded-lg border border-gray-200/50">
                            <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Type</span>
                            <span className="font-semibold text-gray-800">{order.type}</span>
                        </div>
                        <div className="bg-white/50 p-2 rounded-lg border border-gray-200/50">
                            <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Quantity</span>
                            <span className="font-semibold text-gray-800">{order.quantity} Units</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg border border-gray-200/50">
                        <span className="text-gray-500 font-medium">Payment Status</span>
                        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border shadow-sm ${
                            order.paymentStatus === 'Paid' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {order.paymentStatus}
                        </span>
                    </div>

                    {order.tags && order.tags.length > 0 && (
                        <div className="pt-1">
                            <div className="flex flex-wrap gap-1.5">
                                {order.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] font-medium text-gray-500 shadow-sm">
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
                    className="w-full mt-3.5 flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 py-2 rounded-lg text-xs font-bold shadow-sm transition-all duration-200 group/btn"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:scale-110 transition-transform">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Order Details
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
