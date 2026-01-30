import React from 'react';
import Column from './Column';
import { useKanban } from '../context/KanbanContext';
import '../Kanban.css';

const Board = ({ onEditOrder }) => {
  const { columns } = useKanban();

  return (
    <div className="kanban-container mt-6">
      {columns.map(column => (
        <Column key={column._id || column.value} column={column} onEditOrder={onEditOrder} />
      ))}
    </div>
  );
};

export default Board;
