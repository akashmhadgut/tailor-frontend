import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';

// Internal Mobile Card Component (Exact replica of Card.jsx styles for consistency)
const MobileCard = ({ order, onEdit, onDelete, expandState }) => {
  const { updateOrderStatus, columns } = useKanban();
  const [isExpanded, setIsExpanded] = expandState;

  const toggleExpand = (e) => {
    if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
      setIsExpanded(isExpanded === order._id ? null : order._id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this order?')) {
      onDelete(order._id);
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
  
  const expanded = isExpanded === order._id;

  return (
    <div className={`relative rounded-r-xl rounded-l-md shadow-sm transition-all duration-300 overflow-hidden mb-3 ${style.container}`}>
      {/* Header / Summary View */}
      <div className="p-3.5 cursor-pointer" onClick={toggleExpand}>
        <div className="flex justify-between items-start gap-2">
            
            {/* Left Column: ID & Name */}
            <div className="flex flex-col gap-2.5 overflow-hidden flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 transition-transform duration-300 ${style.dot}`} />
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

                    {/* Type & Date Badges */}
                    {/* Using flex-wrap to ensure NO horizontal scroll, badges will stack if space is tight */}
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

                {/* Expand Chevron */}
                <div className={`p-1 mt-0.5 rounded-full text-gray-400 transition-all duration-300 ${expanded ? 'bg-gray-100 text-gray-600 rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
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
                            order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
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
                
                <div className="flex gap-2.5 mt-3.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(order); }}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 py-2 rounded-lg text-xs font-bold shadow-sm transition-all duration-200"
                    >
                        Edit Order Details
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center justify-center px-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 py-2 rounded-lg text-xs font-bold shadow-sm transition-all duration-200"
                        title="Delete Order"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ListView = ({ onEditOrder }) => {
  const { filteredOrders, updateOrderStatus, columns, deleteOrder } = useKanban();
  const [expandedId, setExpandedId] = useState(null); 

  // Desktop Table Row Styles
  const getRowStyle = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-100 border-blue-200 text-blue-900 hover:bg-blue-200/50';
      case 'stitching_in_progress': return 'bg-orange-100 border-orange-200 text-orange-900 hover:bg-orange-200/50'; 
      case 'done': return 'bg-green-100 border-green-200 text-green-900 hover:bg-green-200/50';
      default: return 'hover:bg-gray-50';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
       case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
       case 'stitching_in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
       case 'done': return 'bg-green-100 text-green-700 border-green-200';
       default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPaymentColor = (status) => {
    return status === 'Paid' 
      ? 'bg-green-50 text-green-700 border border-green-200' 
      : 'bg-red-50 text-red-700 border border-red-200';
  };

  const handleDelete = (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
        deleteOrder(orderId);
    }
  };

  if (filteredOrders.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
        <div className="flex flex-col items-center justify-center">
          <span className="text-2xl mb-2">🔍</span>
          <p>No orders found matching your filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* MOBILE & TABLET VIEW (< lg) - Collapsible Cards */}
      <div className="lg:hidden space-y-3">
        {filteredOrders.map(order => (
          <MobileCard 
            key={order._id} 
            order={order} 
            onEdit={onEditOrder}
            onDelete={deleteOrder} 
            expandState={[expandedId, setExpandedId]} 
          />
        ))}
      </div>

      {/* DESKTOP VIEW (>= lg) - Styled Table */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold backdrop-blur-sm">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4">Delivery</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Tags</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => (
                <tr 
                  key={order._id} 
                  className={`transition-colors duration-200 border-l-4 ${
                      order.status === 'new' ? 'border-l-blue-400' :
                      order.status === 'stitching_in_progress' ? 'border-l-orange-400' :
                      order.status === 'done' ? 'border-l-green-400' : 'border-l-gray-200'
                  } ${getRowStyle(order.status)}`}
                >
                  <td className="p-4 font-mono text-sm text-gray-500 font-medium">{order.orderId}</td>
                  <td className="p-4 text-gray-900 font-semibold">{order.customerName}</td>
                  <td className="p-4 text-gray-700 font-medium">{order.type}</td>
                  <td className="p-4 text-center text-gray-600 font-medium">{order.quantity}</td>
                  <td className="p-4 text-gray-600 font-medium text-sm">
                    {new Date(order.deliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPaymentColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getStatusBadge(order.status)}`}
                    >
                      {columns.map(col => (
                        <option key={col._id || col.value} value={col.value}>{col.title}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {order.tags && order.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-gray-200 text-gray-500 shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                   <div className="flex items-center justify-center gap-2">
                        <button 
                        onClick={() => onEditOrder(order, true)}
                        className="text-gray-400 hover:text-blue-600 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 font-medium text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm"
                        >
                        Edit
                        </button>
                        <button 
                        onClick={() => handleDelete(order._id)}
                        className="text-gray-400 hover:text-red-600 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 p-1.5 rounded-lg transition-all shadow-sm"
                        title="Delete Order"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                   </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ListView;
