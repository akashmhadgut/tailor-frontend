import React, { useState } from 'react';
import { useKanban } from '../../context/KanbanContext';

const MobileFilterModal = ({ isOpen, onClose }) => {
  const { filters, setFilter, resetFilters, columns, availableTags } = useKanban();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (!isOpen) return null;

  const toggleStatus = (status) => {
    const current = filters.status || [];
    if (status === 'all') {
      setFilter('status', []);
      return;
    }
    if (current.includes(status)) {
      setFilter('status', current.filter(s => s !== status));
    } else {
      setFilter('status', [...current, status]);
    }
  };

  const toggleTag = (tagName) => {
    const current = filters.tag || [];
    if (tagName === 'all') {
      setFilter('tag', []);
      return;
    }
    if (current.includes(tagName)) {
      setFilter('tag', current.filter(t => t !== tagName));
    } else {
      setFilter('tag', [...current, tagName]);
    }
  };

  const handleDateType = (type) => {
    if (type === 'custom') {
      setFilter('dateType', 'custom');
    } else {
      const nextType = filters.dateType === type ? 'all' : type;
      setFilter('dateType', nextType);
      setFilter('date', ''); // Clear custom date when switching to predefined periods
    }

    if (type !== 'custom') {
      setShowDatePicker(false);
    }
  };

  const handleCustomDateClick = () => {
    setFilter('dateType', 'custom');
    setShowDatePicker(!showDatePicker);
  };

  // Helper functions from CustomDatePicker logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonthItems = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonthItems; i++) days.push(i);

    return (
      <div className="bg-white rounded-[12px] shadow-[0px_0px_12px_rgba(0,0,0,0.1) border border-[#F1F1F1] mt-4 overflow-hidden animate-fade-in">
        {/* Calendar Header - Exactly like CustomDatePicker.jsx */}
        <div className="h-[36px] bg-[#F5FAFE] flex items-center justify-between px-3">
          <button type="button" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="text-gray-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="font-inter font-medium text-[14px] text-[#424242]">
            {monthNames[month]} {year}
          </span>
          <button type="button" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="text-gray-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* Calendar Body */}
        <div className="p-[12px]">
          <div className="grid grid-cols-7 gap-x-[10px] mb-[12px]">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[14px] text-[#424242] text-center">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-x-[10px] gap-y-[8px] place-items-center">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="w-[24px]"></div>;
              
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = filters.date === dateStr;
              
              const d = new Date(year, month, day);
              d.setHours(0,0,0,0);
              const isToday = d.getTime() === today.getTime();

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setFilter('date', dateStr); setFilter('dateType', 'custom'); }}
                  className={`
                    w-[24px] h-[24px] rounded-full flex items-center justify-center text-[14px] transition-all
                    ${isSelected 
                      ? 'bg-[rgba(88,88,203,0.1)] border border-[#5858CB] text-[#5858CB] font-semibold' 
                      : isToday
                        ? 'bg-[#5858CB] text-white font-semibold shadow-md'
                        : 'text-[#424242] hover:bg-gray-100'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 font-inter">
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Frame 1000007728 */}
      <div className="relative w-full max-w-[360px] bg-white rounded-t-[24px] shadow-2xl flex flex-col p-[20px] animate-slide-up max-h-[95vh] overflow-y-auto">
        <div className="w-full flex justify-center pb-[10px]">
          <div className="w-[30px] h-[3px] rounded-full bg-[#E9E9E9]"></div>
        </div>

        <button onClick={onClose} className="absolute top-[8px] right-[10px] w-[24px] h-[24px] flex items-center justify-center rounded-full border border-[#DEDEE0]">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="#5858CB" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>

        <div className="flex flex-col gap-[20px] mt-[10px]">
          {/* Status Section */}
          <div className="flex flex-wrap gap-[8px]">
            <button
              onClick={() => toggleStatus('all')}
              className={`h-[33px] px-[12px] flex items-center justify-center rounded-[8px] text-[14px] font-medium transition-all ${(!filters.status || filters.status.length === 0) ? 'bg-[#5858CB] text-white shadow-sm' : 'bg-[#F5FAFE] text-[#424242]'}`}
            >
              All Status
            </button>
            {columns.map(col => (
              <button key={col.value} onClick={() => toggleStatus(col.value)} className={`h-[33px] px-[12px] rounded-[8px] text-[14px] ${filters.status?.includes(col.value) ? 'bg-[#5858CB] text-white' : 'bg-[#F5FAFE] text-[#424242]'}`}>
                {col.title}
              </button>
            ))}
          </div>

          <div className="h-[1px] bg-[#F1F1F1]" />

          {/* Labels Section */}
          <div className="flex flex-wrap gap-[8px]">
            <button onClick={() => toggleTag('all')} className={`h-[33px] px-[12px] rounded-[8px] text-[14px] font-medium transition-all ${(!filters.tag || filters.tag.length === 0) ? 'bg-[#5858CB] text-white shadow-sm' : 'bg-[#F5FAFE] text-[#424242]'}`}>
              All Labels
            </button>
            {availableTags.map(tag => (
              <button key={tag._id} onClick={() => toggleTag(tag.name)} className={`h-[33px] px-[12px] rounded-[8px] text-[14px] ${filters.tag?.includes(tag.name) ? 'bg-[#5858CB] text-white' : 'bg-[#F5FAFE] text-[#424242]'}`}>
                {tag.name}
              </button>
            ))}
          </div>

          <div className="h-[1px] bg-[#F1F1F1]" />

          {/* Dates Section */}
            <div className="flex flex-col gap-[8px]">
              <div className="flex flex-wrap gap-[8px]">
                <button 
                  onClick={() => handleDateType('all')} 
                  className={`h-[33px] px-[12px] rounded-[8px] text-[14px] font-medium transition-all ${filters.dateType === 'all' ? 'bg-[#5858CB] text-white shadow-sm' : 'bg-[#F5FAFE] text-[#424242]'}`}
                >
                  All Dates
                </button>
                {[
                  { id: 'today', label: 'TODAY' },
                  { id: 'week', label: 'WEEK' },
                  { id: 'month', label: 'MONTH' }
                ].map(type => (
                  <button 
                    key={type.id} 
                    onClick={() => handleDateType(type.id)} 
                    className={`h-[33px] px-[12px] rounded-[8px] text-[14px] ${filters.dateType === type.id ? 'bg-[#5858CB] text-white shadow-sm' : 'bg-[#F5FAFE] text-[#424242]'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            
            {/* Custom Date Button - Styled to match image */}
            <div className="flex">
              <button 
                onClick={handleCustomDateClick}
                className={`h-[33px] px-[15px] rounded-[8px] border text-[14px] flex items-center justify-between gap-2 bg-white ${filters.dateType === 'custom' ? 'border-[#5858CB] text-[#5858CB]' : 'border-[#424242] text-[#424242]'}`}
                style={{ minWidth: '130px' }}
              >
                {filters.date ? (() => {
                  const d = new Date(filters.date);
                  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                })() : 'Custom Date'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </button>
            </div>
            
            {showDatePicker && renderCalendar()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 mt-4 pb-2">
            <button onClick={() => { resetFilters(); onClose(); }} className="text-[#AFB7BE] text-[16px] font-medium hover:text-[#5858CB]">
              Reset Filter
            </button>
            <button onClick={onClose} className="w-[124px] h-[38px] bg-[#5858CB] text-white rounded-[8px] text-[16px] font-medium active:scale-95 shadow-md">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterModal;
