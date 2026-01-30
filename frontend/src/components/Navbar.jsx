import React, { useState, useRef, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import { useNavigate } from 'react-router-dom';

const DateFilterDropdown = ({ filters, setFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (type) => {
    setFilter('dateType', type);
    if (type !== 'custom') {
      setFilter('date', '');
      setIsOpen(false);
    }
  };

  const getLabel = () => {
    switch(filters.dateType) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': return filters.date ? new Date(filters.date).toLocaleDateString() : 'Pick Date';
      default: return 'All Dates';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 hover:bg-white hover:border-gray-300 transition-all"
      >
        <span className="truncate">{getLabel()}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 animate-fade-in origin-top-right">
          <div className="space-y-1">
            {['all', 'today', 'week', 'month'].map(type => (
              <button
                key={type}
                onClick={() => handleOptionClick(type)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  filters.dateType === type 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {type === 'all' ? 'All Dates' : type === 'week' ? 'This Week' : type === 'month' ? 'This Month' : 'Today'}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 my-2"></div>

          <div className="px-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Custom Date</span>
            <input 
              type="date" 
              className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={filters.date}
              onChange={(e) => {
                setFilter('dateType', 'custom');
                setFilter('date', e.target.value);
              }}
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
      
    </div>
  );
};

const CustomDropdown = ({ label, options, value, onChange, prefix }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? `${prefix}${selectedOption.label}` : `${prefix}All`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between min-w-[140px] py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 hover:bg-white hover:border-gray-300 transition-all"
      >
        <span className="truncate">{displayLabel}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-1 animate-fade-in origin-top-left">
          <div className="max-h-60 overflow-y-auto no-scrollbar">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  value === opt.value 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = ({ onOpenModal }) => {
  const { filters, setFilter, resetFilters, view, setView, columns, availableTags, addCustomer, refreshBoard, customersEnabled, customers } = useKanban();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '' });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  // Check if any filter is active to conditionally show/highlight reset
  const isFilterActive = filters.search !== '' || filters.status !== 'all' || filters.dateType !== 'all' || filters.tag !== 'all';

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative gap-4">
          
          {/* Mobile Search Overlay */}
          {isSearchOpen ? (
            <div className="absolute inset-0 bg-white z-20 flex items-center px-4 animate-fade-in">
                <div className="relative w-full flex items-center">
                    <span className="absolute left-3 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="Search orders..." 
                        className="w-full pl-10 pr-10 py-2 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-primary-100 text-gray-800 placeholder-gray-400"
                        value={filters.search}
                        onChange={(e) => setFilter('search', e.target.value)}
                    />
                    <button 
                        onClick={() => { setIsSearchOpen(false); setFilter('search', ''); }}
                        className="absolute right-2 p-1 text-gray-400 hover:text-gray-600"
                    >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
          ) : null}

          {/* Left Section: Logo & View Toggle & Search & Filters */}
          <div className="flex items-center flex-1 gap-3 lg:gap-4 overflow-x-auto no-scrollbar">
            {/* 1. Logo */}
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
              A-Track
            </h1>
            
            <div className="h-6 w-px bg-gray-200 mx-1 hidden lg:block"></div>

            {/* 2. View Toggle */}
            <div className="hidden md:flex bg-gray-100/80 p-1 rounded-lg border border-gray-200 shadow-sm shrink-0">
              <button 
                onClick={() => setView('board')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'board' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Board
              </button>
              <button 
                onClick={() => setView('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'list' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                List
              </button>
            </div>

            {/* 3. Search Bar */}
            <div className="hidden md:flex relative group shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-32 lg:w-44 transition-all"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
              />
            </div>

            {/* 4. Filters Toggle Button */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  isFiltersVisible 
                  ? 'bg-primary-50 text-primary-700 border-primary-200' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {isFilterActive && !isFiltersVisible && (
                  <span className="flex h-2 w-2 rounded-full bg-primary-600"></span>
                )}
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isFiltersVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Section: New Order & Add Customer & Logout */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            <div className="h-8 w-px bg-gray-200 mx-1"></div>

            <button onClick={onOpenModal} className="btn-primary py-2 px-4 shadow-primary-500/20 whitespace-nowrap text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Order
            </button>
            
            <button onClick={() => setIsCustomerModalOpen(true)} className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Customer
            </button>

            <button 
              onClick={handleLogout} 
              className="ml-1 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Mobile Actions: Search + New Order + Menu Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Search Icon */}
            <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-500 hover:text-primary-600 transition-colors rounded-full hover:bg-gray-50"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            <button 
                onClick={onOpenModal} 
                className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1 shadow-md shadow-primary-500/20"
            >
                <span className="text-lg leading-none font-bold">+</span> 
                <span className="font-semibold">New</span>
            </button>

            <button onClick={() => setIsCustomerModalOpen(true)} className="ml-2 bg-white border border-gray-200 px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              + Cust
            </button>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 hover:text-gray-900 p-1">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Filter Bar */}
      {isFiltersVisible && (
        <div className="bg-gray-50/50 border-b border-gray-200 animate-[slideDown_0.2s_ease-out]">
          <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-4 overflow-visible">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0">Active Filters:</span>
            
            <div className="flex items-center gap-3 shrink-0">
              <CustomDropdown 
                prefix="Status: "
                value={filters.status}
                onChange={(val) => setFilter('status', val)}
                options={[
                  { value: 'all', label: 'All Status' },
                  ...columns.map(col => ({ value: col.value, label: col.title }))
                ]}
              />

              <CustomDropdown 
                prefix="Tag: "
                value={filters.tag}
                onChange={(val) => setFilter('tag', val)}
                options={[
                  { value: 'all', label: 'All Tags' },
                  ...(availableTags || []).map(tag => ({ value: tag, label: tag }))
                ]}
              />



              <div className="w-40">
                <DateFilterDropdown filters={filters} setFilter={setFilter} />
              </div>

              <div className="h-6 w-px bg-gray-200 mx-1"></div>

              <button 
                  onClick={resetFilters}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                      isFilterActive 
                      ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100 shadow-sm' 
                      : 'text-gray-400 border-gray-200 bg-white hover:text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Reset All Filters"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                  </svg>
                  Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 animate-[slideDown_0.2s_ease-out] shadow-lg">
           <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
              <button 
                onClick={() => setView('board')}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'board' ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}
              >
                Board
              </button>
              <button 
                onClick={() => setView('list')}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-white shadow text-primary-700' : 'text-gray-500'}`}
              >
                List
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <select 
                    className="form-select bg-gray-50 text-sm flex-[1.4] w-0 min-w-0"
                    value={filters.status}
                    onChange={(e) => setFilter('status', e.target.value)}
                >
                    <option value="all">All Status</option>
                    {columns.map(col => (
                    <option key={col._id || col.value} value={col.value}>{col.title}</option>
                    ))}
                </select>
                <div className="flex-[2] w-0 min-w-0 text-sm">
                    <DateFilterDropdown filters={filters} setFilter={setFilter} />
                </div>
                <button 
                    onClick={resetFilters}
                    className={`flex-none flex items-center justify-center p-2 rounded-lg border transition-all ${
                        isFilterActive 
                        ? 'text-gray-600 border-gray-300 bg-gray-100' 
                        : 'text-gray-400 border-gray-200 bg-white'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                    </svg>
                </button>
              </div>

              <select 
                className="form-select bg-gray-50 text-sm w-full"
                value={filters.tag}
                onChange={(e) => setFilter('tag', e.target.value)}
              >
                <option value="all">All Tags</option>
                {availableTags && availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
            
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium">
              Logout
            </button>
        </div>
      )}

      {/* Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
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
              <button onClick={() => setIsCustomerModalOpen(false)} className="btn-secondary">Cancel</button>
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
                className="btn-primary"
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
