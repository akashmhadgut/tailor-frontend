import React from 'react';
import { useKanban } from '../context/KanbanContext';

const Card = ({ order, onEdit }) => {
  const { updateOrderStatus, columns } = useKanban();

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", order._id);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'stitching_in_progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'done': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div 
      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
      draggable="true"
      onDragStart={handleDragStart}
      onClick={() => onEdit(order)}
    >
      {/* Decorative side bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'done' ? 'bg-green-500' : (order.status === 'stitching_in_progress' ? 'bg-yellow-500' : 'bg-primary-500')}`} />

      <div className="pl-2">
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col">
             <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Order Id</span>
             <span className="text-sm font-bold text-gray-800 font-mono tracking-wide">
                {order.orderId}
             </span>
          </div>
          <select 
            value={order.status}
            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className={`text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full border-2 border-transparent hover:border-black/5 cursor-pointer outline-none transition-all ${getStatusColor(order.status)}`}
          >
            {columns.map(col => (
              <option key={col._id || col.value} value={col.value}>{col.title}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
           <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-0.5">Customer Name</span>
           <h4 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-primary-600 transition-colors font-sans">
             {order.customerName}
           </h4>
           {order.tags && order.tags.length > 0 && (
             <div className="flex flex-wrap gap-1 mt-2">
               {order.tags.map(tag => (
                 <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                   {tag}
                 </span>
               ))}
             </div>
           )}
        </div>
        
        <div className="space-y-2 pt-3 border-t border-gray-100 mt-2">
          <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                📅 Delivery
              </span>
              <span className="text-gray-700 font-bold bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{order.deliveryDate || 'N/A'}</span>
          </div>
           <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">💰 Payment</span>
              <span className={`font-bold px-2 py-0.5 rounded-full border ${order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {order.paymentStatus}
              </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
