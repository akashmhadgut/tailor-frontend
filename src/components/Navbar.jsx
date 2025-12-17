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
        className="flex items-center justify-between w-36 py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 hover:bg-white hover:border-gray-300 transition-all"
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

const Navbar = ({ onOpenModal }) => {
  const { filters, setFilter, view, setView, columns, availableTags } = useKanban();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo & Desktop View Toggle */}
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-primary-600 tracking-tight">TailorTrack</h1>
            
            <div className="hidden md:flex bg-gray-100/50 p-1 rounded-lg border border-gray-200">
              <button 
                onClick={() => setView('board')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'board' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Board
              </button>
              <button 
                onClick={() => setView('list')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                List
              </button>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
              <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none w-36 md:w-48 transition-all"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
              />
            </div>

            <select 
              className="py-2 pl-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer hover:bg-white transition-colors w-40 md:w-auto"
              value={filters.status}
              onChange={(e) => setFilter('status', e.target.value)}
            >
              <option value="all">All Status</option>
              {columns.map(col => (
                <option key={col._id || col.value} value={col.value}>{col.title}</option>
              ))}
            </select>

            <select 
              className="py-2 pl-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer hover:bg-white transition-colors w-40 md:w-auto"
              value={filters.tag}
              onChange={(e) => setFilter('tag', e.target.value)}
            >
              <option value="all">All Tags</option>
              {availableTags && availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <DateFilterDropdown filters={filters} setFilter={setFilter} />

            <button onClick={onOpenModal} className="btn-primary py-2 px-4 shadow-primary-500/20 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
              + New Order
            </button>
            
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 hover:text-gray-900 p-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 animate-[slideDown_0.2s_ease-out]">
           <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
              <button 
                onClick={() => setView('board')}
                className={`flex-1 py-2 rounded-md text-sm font-medium ${view === 'board' ? 'bg-white shadow' : 'text-gray-500'}`}
              >
                Board
              </button>
              <button 
                onClick={() => setView('list')}
                className={`flex-1 py-2 rounded-md text-sm font-medium ${view === 'list' ? 'bg-white shadow' : 'text-gray-500'}`}
              >
                List
              </button>
            </div>

            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full form-input bg-gray-50"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <select 
                className="form-select bg-gray-50"
                value={filters.status}
                onChange={(e) => setFilter('status', e.target.value)}
              >
                <option value="all">All Status</option>
                {columns.map(col => (
                  <option key={col._id || col.value} value={col.value}>{col.title}</option>
                ))}
              </select>
              <div className="w-full">
                <DateFilterDropdown filters={filters} setFilter={setFilter} />
              </div>
              <select 
                className="form-select bg-gray-50 col-span-2"
                value={filters.tag}
                onChange={(e) => setFilter('tag', e.target.value)}
              >
                <option value="all">All Tags</option>
                {availableTags && availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            <button onClick={onOpenModal} className="btn-primary w-full justify-center">
              + New Order
            </button>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full p-2 text-red-600 bg-red-50 rounded-lg">
              Logout
            </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
