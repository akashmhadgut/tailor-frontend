import React from 'react';
import Card from './Card';
import { useKanban } from '../context/KanbanContext';

const Column = ({ column, onEditOrder }) => {
  const { filteredOrders, updateOrderStatus } = useKanban();
  // Match by value (slug), not id
  const columnOrders = filteredOrders.filter(order => order.status === column.value);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");
    updateOrderStatus(orderId, column.value);
  };

  return (
    <div 
      className="flex flex-col flex-1 w-full md:w-auto min-w-[220px] md:min-w-[260px] lg:min-w-[300px] bg-gray-50/50 rounded-xl p-3 md:p-4 border border-gray-100 transition-colors hover:bg-gray-50"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-base font-semibold text-gray-800 tracking-tight">{column.title}</h3>
        <span className="bg-white border border-gray-200 text-gray-500 text-xs font-medium px-2.5 py-0.5 rounded-full shadow-sm">
          {columnOrders.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-[160px] pr-1 pb-2 custom-scrollbar">
        {columnOrders.map(order => (
          <Card key={order._id} order={order} onEdit={onEditOrder} />
        ))}
        {columnOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm bg-gray-50/30">
            <span className="mb-1">Empty Column</span>
            <span className="text-xs text-gray-300">Drag items here</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Column;
