import React from 'react';
import { useKanban } from '../context/KanbanContext';

const ListView = ({ onEditOrder }) => {
  const { filteredOrders, updateOrderStatus, columns } = useKanban();

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'stitching_in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentColor = (status) => {
    return status === 'Paid' 
      ? 'bg-green-50 text-green-700 border border-green-200' 
      : 'bg-red-50 text-red-700 border border-red-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4 hidden sm:table-cell">Type</th>
              <th className="p-4 text-center">Qty</th>
              <th className="p-4 hidden sm:table-cell">Delivery</th>
              <th className="p-4 hidden sm:table-cell">Payment</th>
              <th className="p-4">Status</th>
              <th className="p-4 hidden md:table-cell">Tags</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map(order => (
              <tr 
                key={order._id} 
                className="hover:bg-gray-50 transition-colors duration-150 group"
              >
                <td className="p-4 font-medium text-gray-900">{order.orderId}</td>
                <td className="p-4 text-gray-700 font-medium">{order.customerName}</td>
                <td className="p-4 text-gray-600 hidden sm:table-cell">{order.type}</td>
                <td className="p-4 text-center text-gray-600">{order.quantity}</td>
                <td className="p-4 text-gray-600 hidden sm:table-cell">
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="p-4">
                  <select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getStatusColor(order.status)}`}
                  >
                    {columns.map(col => (
                      <option key={col._id || col.value} value={col.value}>{col.title}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {order.tags && order.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => onEditOrder(order)}
                    className="text-gray-400 hover:text-blue-600 font-medium text-sm px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xl mb-2">🔍</span>
                    <p>No orders found matching your filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListView;
