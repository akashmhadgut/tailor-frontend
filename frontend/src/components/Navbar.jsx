import React, { useState, useRef, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import { useNavigate } from 'react-router-dom';
import CustomDatePicker from './CustomDatePicker';

const FilterPopup = ({ isVisible, onClose }) => {
  const { filters, setFilter, resetFilters, columns, availableTags } = useKanban();
  const popupRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside popup AND not on the toggle button (to avoid immediate close/reopen loop)
      if (popupRef.current && !popupRef.current.contains(event.target) && !event.target.closest('#filter-toggle-btn')) {
        onClose();
      }
    };
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  // Helper to check if a value matches the filter
  const isStatusActive = (val) => {
      if (val === 'all') return filters.status.length === 0;
      return filters.status.includes(val);
  };
  const isTagActive = (val) => {
      if (val === 'all') return filters.tag.length === 0;
      return filters.tag.includes(val);
  };
  const isDateActive = (type) => filters.dateType === type;

  // Options Handlers
  const handleStatusClick = (val) => {
    if (val === 'all') {
        setFilter('status', []);
    } else {
        if (filters.status.includes(val)) {
            setFilter('status', filters.status.filter(s => s !== val));
        } else {
            setFilter('status', [...filters.status, val]);
        }
    }
  };

  const handleTagClick = (val) => {
    if (val === 'all') {
        setFilter('tag', []);
    } else {
        if (filters.tag.includes(val)) {
            setFilter('tag', filters.tag.filter(t => t !== val));
        } else {
            setFilter('tag', [...filters.tag, val]);
        }
    }
  };

  const handleDateClick = (type) => {
      if (type === 'custom') {
          setFilter('dateType', 'custom');
      } else {
        setFilter('dateType', filters.dateType === type ? 'all' : type);
        setFilter('date', ''); // clear custom date
      }
  };

  return (
    <div 
      ref={popupRef}
      className="absolute top-[60px] right-[20px] bg-white rounded-[8px] shadow-[0px_0px_12px_rgba(0,0,0,0.15)] w-[399px] p-[16px] z-[100] flex flex-col gap-[16px]"
    >
        {/* Status Section */}
        <div className="flex flex-col gap-[8px] w-full">
            <div className="flex flex-wrap gap-[12px]">
                {[
                    { label: 'All Status', value: 'all' }, 
                    { label: 'New', value: 'new' },
                    { label: 'Order In Progress', value: 'stitching_in_progress' },
                    { label: 'Order Complete', value: 'done' },
                    { label: 'Fitting', value: 'fittings' },
                    { label: 'Delivered', value: 'ready' }
                ].map((opt) => (
                    <div 
                        key={opt.value}
                        onClick={() => handleStatusClick(opt.value)}
                        className={`px-[10px] py-[4px] rounded-[8px] cursor-pointer flex items-center justify-center transition-colors ${
                            isStatusActive(opt.value) 
                            ? 'bg-[#E0E7FF] text-[#5858CB] font-medium' 
                            : 'bg-[#F5FAFE] text-[#424242] hover:bg-[#EAF4FF]'
                        }`}
                    >
                        <span className="font-inter text-[14px] leading-[17px]">{opt.label}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-[#F1F1F1] rounded-[2px]"></div>

        {/* Labels/Tags Section */}
        <div className="flex flex-col gap-[8px] w-full">
            <div className="flex flex-wrap gap-[12px]">
                {[
                    { label: 'All Labels', value: 'all' },
                    { label: 'Urgent', value: 'Urgent' }, 
                    { label: 'Delicate', value: 'Delicate' }, 
                    { label: 'Extra Attention', value: 'Extra Attention' }, 
                    { label: 'Repair', value: 'Repair' }, 
                    { label: 'VIP', value: 'VIP' }
                ].map((opt) => (
                    <div 
                        key={opt.value}
                        onClick={() => handleTagClick(opt.value)}
                        className={`px-[10px] py-[4px] rounded-[8px] cursor-pointer flex items-center justify-center transition-colors ${
                            isTagActive(opt.value) 
                            ? 'bg-[#E0E7FF] text-[#5858CB] font-medium' 
                            : 'bg-[#F5FAFE] text-[#424242] hover:bg-[#EAF4FF]'
                        }`}
                    >
                        <span className="font-inter text-[14px] leading-[17px]">{opt.label}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-[#F1F1F1] rounded-[2px]"></div>

        {/* Date Section */}
        <div className="flex flex-col gap-[8px] w-full">
            <div className="flex flex-wrap gap-[6px] items-center">
                 {/* Chips: All Dates, Today, This Week, This Month */}
                {[
                    { label: 'All Dates', value: 'all' },
                    { label: 'Today', value: 'today' },
                    { label: 'This Week', value: 'week' },
                    { label: 'This Month', value: 'month' }
                ].map((opt) => (
                    <div 
                        key={opt.value}
                        onClick={() => handleDateClick(opt.value)}
                        className={`px-[8px] py-[4px] rounded-[8px] cursor-pointer flex items-center justify-center transition-colors border shrink-0 ${
                            isDateActive(opt.value) 
                            ? 'bg-[#E0E7FF] text-[#5858CB] font-medium border-transparent' 
                            : 'bg-[#F5FAFE] text-[#424242] hover:bg-[#EAF4FF] border-transparent'
                        }`}
                    >
                        <span className="font-inter text-[14px] leading-[17px] whitespace-nowrap">{opt.label}</span>
                    </div>
                ))}

                {/* Custom Date Input (Inline) */}
                {/* Custom Date Input */}
                <CustomDatePicker 
                    selectedDate={filters.date} 
                    onChange={(date) => {
                        setFilter('dateType', 'custom');
                        setFilter('date', date);
                    }}
                    className={`px-[8px] py-[4px] rounded-[8px] border shrink-0 ${isDateActive('custom') ? 'border-[#5858CB] ring-1 ring-[#5858CB]' : 'border-[#E5E5E5]'} bg-white flex items-center justify-between gap-2 hover:border-[#B5B5B5] transition-colors h-[27px] w-auto min-w-[120px] font-inter text-[12px] leading-[15px]`}
                />
            </div>
        </div>

        {/* Footer: Reset & Apply */}
        <div className="w-full flex justify-between items-center mt-[16px]">
             <button
                onClick={resetFilters}
                className="text-[#B5B5B5] font-inter text-[14px] hover:text-[#424242] transition-colors"
             >
                Reset Filter
             </button>

             <button 
                onClick={onClose}
                className="bg-[#5858CB] text-white font-inter font-medium text-[16px] leading-[18px] px-[32px] py-[9px] rounded-[6px] hover:bg-[#4848A8] transition-colors"
             >
                Apply
             </button>
        </div>
    </div>
  );
};


const Navbar = ({ onOpenModal }) => {
  const { filters, setFilter, resetFilters, view, setView, columns, addCustomer, refreshBoard, customersEnabled } = useKanban();
  const navigate = useNavigate();
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '' });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const isFilterActive = filters.search !== '' || filters.status.length > 0 || filters.dateType !== 'all' || filters.tag.length > 0;

  return (
    <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-50">
      <div className="w-full max-w-[1600px] mx-auto px-6 py-0 h-[50px] flex items-center justify-between relative">
        
        {/* Left Section: Logo & View Switcher */}
        <div className="flex items-center gap-[30px] h-full">
           {/* Logo - Added as requested */}
            <div className="flex items-center gap-2 mr-4 cursor-pointer" onClick={() => navigate('/')}>
                  <h1 className="text-lg font-bold text-gray-800 tracking-tight">A-Track</h1>
            </div>

            {/* Kanban View */}
            <button 
                onClick={() => setView('board')}
                className={`relative h-full flex items-center gap-2 transition-colors ${view === 'board' ? 'text-[#5858CB]' : 'text-[#424242] hover:text-[#5858CB]'}`}
            >
                {/* Custom Icon for Kanban */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="16" height="16" rx="4" stroke={view === 'board' ? "#5858CB" : "#AFB7BE"} strokeWidth="1"/>
                    <path d="M7 5V13" stroke={view === 'board' ? "#5858CB" : "#AFB7BE"} strokeWidth="1" strokeLinecap="round"/>
                    <path d="M11 5V10" stroke={view === 'board' ? "#5858CB" : "#AFB7BE"} strokeWidth="1" strokeLinecap="round"/>
                    <path d="M15 5V8" stroke={view === 'board' ? "#5858CB" : "#AFB7BE"} strokeWidth="1" strokeLinecap="round"/>
                    <path d="M3 5V10" stroke={view === 'board' ? "#5858CB" : "#AFB7BE"} strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <span className="font-inter text-sm font-normal">Board</span>
                
                {/* Active Indicator Underline */}
                {view === 'board' && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#5858CB] rounded-t-sm"></div>
                )}
            </button>

            {/* Table View */}
            <button 
                onClick={() => setView('list')}
                className={`relative h-full flex items-center gap-2 transition-colors ${view === 'list' ? 'text-[#5858CB]' : 'text-[#424242] hover:text-[#5858CB]'}`}
            >
                {/* Custom Icon for Table */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="16" height="16" rx="4" stroke={view === 'list' ? "#5858CB" : "#AFB7BE"} strokeWidth="1"/>
                    <path d="M9 1V17" stroke={view === 'list' ? "#5858CB" : "#AFB7BE"} strokeWidth="1"/>
                    <path d="M1 6H17" stroke={view === 'list' ? "#5858CB" : "#AFB7BE"} strokeWidth="1"/>
                </svg>
                <span className="font-inter text-sm font-normal">Table</span>

                 {/* Active Indicator Underline (if Table is active) */}
                 {view === 'list' && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#5858CB] rounded-t-sm"></div>
                )}
            </button>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-6">
            
            {/* Add Order */}
            <button 
                onClick={onOpenModal}
                className="flex items-center gap-[8px] text-[#424242] hover:text-[#5858CB] transition-colors"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="16" height="16" rx="4" stroke="#AFB7BE" strokeWidth="1"/>
                    <path d="M12 8V16" stroke="#AFB7BE" strokeWidth="1" strokeLinecap="round"/>
                    <path d="M8 12H16" stroke="#AFB7BE" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <span className="font-inter text-sm font-normal">Add Order</span>
            </button>

            {/* Customer Profile */}
            {/* <button 
                onClick={() => setIsCustomerModalOpen(true)}
                className="flex items-center gap-[8px] text-[#424242] hover:text-[#5858CB] transition-colors"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="16" height="16" rx="4" stroke="#AFB7BE" strokeWidth="1"/>
                    <circle cx="12" cy="10" r="3" stroke="#AFB7BE" strokeWidth="1"/>
                    <path d="M7 17C7 14.5 9 14 12 14C15 14 17 14.5 17 17" stroke="#AFB7BE" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <span className="font-inter text-sm font-normal">Customer Profile</span>
            </button> */}

            {/* Filter Toggle */}
            <button 
                id="filter-toggle-btn"
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className={`flex items-center gap-[8px] transition-colors ${isFiltersVisible || isFilterActive ? 'text-[#5858CB]' : 'text-[#424242] hover:text-[#5858CB]'}`}
            >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 7H20" stroke={isFiltersVisible || isFilterActive ? "#5858CB" : "#AFB7BE"} strokeWidth="1" strokeLinecap="round"/>
                    <path d="M4 12H20" stroke={isFiltersVisible || isFilterActive ? "#5858CB" : "#AFB7BE"} strokeWidth="1" strokeLinecap="round"/>
                    <path d="M4 17H20" stroke={isFiltersVisible || isFilterActive ? "#5858CB" : "#AFB7BE"} strokeWidth="1" strokeLinecap="round"/>
                    <circle cx="8" cy="7" r="2" fill="white" stroke={isFiltersVisible || isFilterActive ? "#5858CB" : "#AFB7BE"} strokeWidth="1"/>
                    <circle cx="16" cy="12" r="2" fill="white" stroke={isFiltersVisible || isFilterActive ? "#5858CB" : "#AFB7BE"} strokeWidth="1"/>
                    <circle cx="8" cy="17" r="2" fill="white" stroke={isFiltersVisible || isFilterActive ? "#5858CB" : "#AFB7BE"} strokeWidth="1"/>
                </svg>
                <span className="font-inter text-sm font-normal">Filter</span>
            </button>

            {/* Search Task */}
            <div className="flex items-center bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg w-[160px] h-[32px] px-2 gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <circle cx="6" cy="6" r="4.5" stroke="#AFB7BE" strokeWidth="1"/>
                    <path d="M9.5 9.5L12.5 12.5" stroke="#AFB7BE" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <input 
                    type="text" 
                    placeholder="Search Task" 
                    className="bg-transparent border-none outline-none text-sm text-[#424242] placeholder-[#B5B5B5] w-full"
                    value={filters.search}
                    onChange={(e) => setFilter('search', e.target.value)}
                />
            </div>
            
             {/* Logout - Added as requested */}
             <button 
              onClick={handleLogout} 
              className="text-[#424242] hover:text-red-600 transition-colors ml-2"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

        </div>
        
        {/* Render Filter Popup */}
        <FilterPopup isVisible={isFiltersVisible} onClose={() => setIsFiltersVisible(false)} />

      </div>

      {/* Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Customer</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            <div className="space-y-3">
              <input type="text" placeholder="Name" className="form-input" value={customerForm.name} onChange={(e) => setCustomerForm(prev => ({...prev, name: e.target.value}))} />
              <input type="text" placeholder="Phone" className="form-input" value={customerForm.phone} onChange={(e) => setCustomerForm(prev => ({...prev, phone: e.target.value}))} />
              <input type="text" placeholder="Address" className="form-input" value={customerForm.address} onChange={(e) => setCustomerForm(prev => ({...prev, address: e.target.value}))} />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsCustomerModalOpen(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button
                onClick={async () => {
                  if (!customerForm.name || !customerForm.phone) {
                    alert('Name and phone are required');
                    return;
                  }
                  if (!customersEnabled) {
                    alert('Customer API is not available on the current server. Please run the updated backend or test locally.');
                    return;
                  }
                  try {
                    await addCustomer(customerForm);
                    try { await refreshBoard(); } catch (e) {}
                    setCustomerForm({ name: '', phone: '', address: '' });
                    setIsCustomerModalOpen(false);
                    alert('Customer added');
                  } catch (err) {
                    alert(err.response?.data?.message || err.message || 'Failed to add customer');
                  }
                }}
                className="px-4 py-2 bg-[#5858CB] text-white rounded hover:bg-[#4848A8]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
