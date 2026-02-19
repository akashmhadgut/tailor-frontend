import React, { useState, useEffect, useRef } from 'react';

const CustomDatePicker = ({ selectedDate, onChange, isReadOnly, className, disablePast }) => {
    // If no date selected, default to today for the view
    const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Sync internal state if prop changes
    useEffect(() => {
        if (selectedDate) {
            setCurrentDate(new Date(selectedDate));
        }
    }, [selectedDate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper functions
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Check if a day is disabled
    const isDisabled = (day) => {
        if (!disablePast) return false;
        if (!day) return false;
        
        const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        return dateToCheck < today;
    };

    const handleDateClick = (day) => {
        if (isReadOnly || isDisabled(day)) return;
        // Construct date in local time, then format as YYYY-MM-DD
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // We want YYYY-MM-DD string.
        // Ensure strictly local date string construction without timezone shift issues
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateString = `${year}-${month}-${d}`;
        
        onChange(dateString);
        setIsOpen(false);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const startDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

    const days = [];
    // Padding
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    // Check if a day is selected
    const isSelected = (day) => {
        if (!selectedDate) return false;
        const sel = new Date(selectedDate);
        return day === sel.getDate() && 
               currentDate.getMonth() === sel.getMonth() && 
               currentDate.getFullYear() === sel.getFullYear();
    };

    // Check if a day is today
    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && 
               currentDate.getMonth() === today.getMonth() && 
               currentDate.getFullYear() === today.getFullYear();
    };

    if (isReadOnly) {
        return (
            <div className="form-input bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed">
               {selectedDate ? (() => {
                    const d = new Date(selectedDate);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day}-${month}-${year}`;
                })() : 'N/A'}
            </div>
        );
    }

    return (
        <div className="relative" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={className || "form-input border-gray-300 focus:ring-primary-500 cursor-pointer flex items-center justify-between h-[42px] bg-white hover:border-gray-400 transition-colors text-sm"}
            >
                <span className={`${selectedDate ? "text-gray-900" : "text-gray-400"}`}>
                    {selectedDate ? (() => {
                        const d = new Date(selectedDate);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}-${month}-${year}`;
                    })() : "Select Date"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </div>

            {isOpen && (
                <div 
                    className="absolute z-50 top-full left-0 mt-2 bg-white rounded-lg shadow-[0px_0px_12px_rgba(0,0,0,0.15)] border border-[#F1F1F1]"
                    style={{ width: '252px' }}
                >
                    {/* Header */}
                    <div className="h-[36px] bg-[#F5FAFE] rounded-t-lg flex items-center justify-between px-3 py-[6px]">
                        <button type="button" onClick={handlePrevMonth} className="px-1 hover:text-gray-700 text-gray-400 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <span className="font-inter font-medium text-[14px] leading-[17px] text-[#424242]">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <button type="button" onClick={handleNextMonth} className="px-1 hover:text-gray-700 text-gray-400 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-[12px] bg-white rounded-b-lg">
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-x-[10px] mb-[16px]">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="font-inter font-normal text-[14px] leading-[17px] text-[#424242] text-center w-[24px]">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-x-[10px] gap-y-[8px] place-items-center">
                            {days.map((day, idx) => (
                                <div key={idx} className="flex justify-center items-center w-[24px] h-[24px]">
                                    {day ? (
                                        <button
                                            type="button"
                                            disabled={isDisabled(day)}
                                            onClick={() => handleDateClick(day)}
                                            className={`
                                                font-inter text-[14px] leading-[17px] flex items-center justify-center transition-all rounded-full
                                                ${isDisabled(day) 
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : isSelected(day) 
                                                        ? 'w-[24px] h-[24px] bg-[rgba(88,88,203,0.1)] border border-[#5858CB] text-[#5858CB] font-semibold' 
                                                        : isToday(day)
                                                            ? 'w-[24px] h-[24px] bg-[#5858CB] text-white font-semibold shadow-md'
                                                            : 'text-[#424242] hover:bg-gray-100 font-normal px-1'
                                                }
                                            `}
                                        >
                                            {day}
                                        </button>
                                    ) : (
                                        <div className="w-[24px]"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
