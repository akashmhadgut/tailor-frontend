import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';

const ListView = ({ onEditOrder }) => {
  const { filteredOrders, updateOrderStatus, columns } = useKanban();
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
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
        // Default / Fallback
        return {
          container: 'bg-white border-gray-200 hover:bg-gray-50',
          text: 'text-gray-900',
          select: 'bg-gray-100 border-gray-300 text-gray-900',
        };
    }
  };

  const getPaymentBadge = (status) => {
    return status === 'Paid'
      ? 'bg-green-200 text-green-800'
      : 'bg-red-200 text-red-800';
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
    <div className="space-y-2">
      {filteredOrders.map((order) => {
        const style = getCardStyle(order.status);
        const isExpanded = expandedId === order._id;

        return (
          <div
            key={order._id}
            className={`border rounded-lg transition-all duration-200 overflow-hidden ${style.container}`}
          >
            {/* Header: Always Visible - Compact */}
            <div
              className="p-3 flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpand(order._id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                 {/* Status Indicator Dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                    order.status === 'new' ? 'bg-blue-500' : 
                    order.status === 'done' ? 'bg-green-500' : 
                    order.status === 'stitching_in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                
                <div className="flex flex-col truncate">
                  <span className={`font-semibold text-sm truncate ${style.text}`}>
                    {order.customerName}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    #{order.orderId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Status Dropdown */}
                <select
                  value={order.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                  className={`text-xs font-medium px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-opacity-50 cursor-pointer ${style.select}`}
                >
                  {columns.map((col) => (
                    <option key={col._id || col.value} value={col.value}>
                      {col.title}
                    </option>
                  ))}
                </select>

                {/* Expand/Collapse Chevron */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-gray-500 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="border-t border-black/5 mb-3"></div>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mb-4">
                  <div>
                    <span className="block text-xs text-gray-500 uppercase tracking-wide">Type</span>
                    <span className="font-medium text-gray-800">{order.type}</span>
                  </div>
                  <div>
                     <span className="block text-xs text-gray-500 uppercase tracking-wide">Quantity</span>
                     <span className="font-medium text-gray-800">{order.quantity}</span>
                  </div>
                  <div>
                     <span className="block text-xs text-gray-500 uppercase tracking-wide">Delivery</span>
                     <span className="font-medium text-gray-800">
                       {new Date(order.deliveryDate).toLocaleDateString()}
                     </span>
                  </div>
                  <div>
                     <span className="block text-xs text-gray-500 uppercase tracking-wide">Payment</span>
                     <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${getPaymentBadge(order.paymentStatus)}`}>
                       {order.paymentStatus}
                     </span>
                  </div>
                  {order.tags && order.tags.length > 0 && (
                     <div className="col-span-2">
                        <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Tags</span>
                        <div className="flex flex-wrap gap-1">
                           {order.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                 {tag}
                              </span>
                           ))}
                        </div>
                     </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => onEditOrder(order)}
                    className="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-3 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                       <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Order
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ListView;
