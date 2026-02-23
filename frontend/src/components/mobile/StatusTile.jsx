import React from 'react';

const StatusTile = ({ title, count, color, pattern, onClick, onDrop }) => {
  const [isOver, setIsOver] = React.useState(false);

  const bgColorMap = {
    purple: 'bg-[#D4CDFF]',
    orange: 'bg-[#F8E7CB]',
    green: 'bg-[#AED8AE]',
    blue: 'bg-[#CBE5FF]',
    red: 'bg-[#FCC6C4]'
  };

  const accentColorMap = {
    purple: '#B0A6EF',
    orange: '#F8C777',
    green: '#7AC87A',
    blue: '#8BC5FF',
    red: '#F58C88'
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const orderId = e.dataTransfer.getData("text/plain");
    if (orderId && onDrop) {
      onDrop(orderId);
    }
  };

  return (
    <div 
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${bgColorMap[color]} relative w-full h-[90px] rounded-[6px] overflow-hidden cursor-pointer shadow-sm active:scale-95 transition-all p-3 flex flex-col justify-between ${isOver ? 'ring-4 ring-[#5858CB]/30 scale-105' : ''}`}
    >
      {/* Background Pattern */}
      <div className="absolute top-[-8px] left-[100px] w-[69px] h-[69px] pointer-events-none">
        {React.cloneElement(pattern, { width: "100%", height: "100%" })}
      </div>

      <div className="flex justify-between items-start z-10 w-full gap-1">
        {/* Title - Allowed to wrap to 2 lines */}
        <span className="font-inter font-medium text-[14px] leading-[1.1] text-[#424242] break-words line-clamp-2 pr-1">
          {title}
        </span>

        {/* Count Circle */}
        <div className="w-[24px] h-[24px] bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="font-inter text-[13px] font-bold text-[#424242]">
            {count}
          </span>
        </div>
      </div>

      {/* Arrow Button */}
      <div className="flex justify-end z-10 mt-5">
         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" fill={accentColorMap[color]}/>
          <path d="M10 16L12.5858 13.4142C13.3668 12.6332 13.3668 11.3668 12.5858 10.5858L10 8" stroke="#F7F7F7" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
};

export default StatusTile;
