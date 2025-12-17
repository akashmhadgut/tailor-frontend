import React from 'react';
import Column from './Column';
import { useKanban } from '../context/KanbanContext';

const Board = ({ onEditOrder }) => {
  const { columns } = useKanban();

  return (
    <div 
      className="board-container flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 md:h-[calc(100vh-140px)]"
    >
      {columns.map(column => (
        <Column key={column._id || column.value} column={column} onEditOrder={onEditOrder} />
      ))}
    </div>
  );
};

export default Board;
