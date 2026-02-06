import React from 'react';
import Card from './Card';
import { useKanban } from '../context/KanbanContext';

const Column = ({ column, onEditOrder }) => {
  const { filteredOrders, updateOrderStatus } = useKanban();
  const columnOrders = filteredOrders.filter(order => order.status === column.value);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");
    updateOrderStatus(orderId, column.value);
  };

  const key = (column.value || column.id || (column.title || '').toLowerCase().replace(/\s+/g, '_')).toLowerCase();
  const colorClassMap = {
    new: 'col-new',
    orders: 'col-new',
    stitching_in_progress: 'col-process',
    fittings: 'col-task-blue',
    done: 'col-completed',
    deliveries: 'col-completed',
    new_task_blue: 'col-task-blue',
    ready: 'col-task-red',
    new_task_red: 'col-task-red',
    default: 'col-new'
  };

  const colorClass = colorClassMap[key] || colorClassMap.default;

  return (
    <div
      className={`kanban-column ${colorClass}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="kanban-column-header">
        <h3 className="kanban-column-title">{column.title}</h3>
        <div className="kanban-column-count-badge">
          {columnOrders.length}
        </div>
      </div>

      <div className="kanban-column-body">
        {columnOrders.map(order => (
          <Card key={order._id || order.id || order.orderId} order={order} onEdit={onEditOrder} columnKey={key} />
        ))}
        {columnOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full p-4 border border-dashed border-gray-400/30 rounded-lg text-gray-500 text-xs">
            Empty
          </div>
        )}
      </div>
    </div>
  );
};

export default Column;
