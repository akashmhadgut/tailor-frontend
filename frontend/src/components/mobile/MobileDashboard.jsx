import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKanban } from '../../context/KanbanContext';
import StatusTile from './StatusTile';
import BottomNavbar from './BottomNavbar';
import MobileOrderCard from './MobileOrderCard';
import MobileFilterModal from './MobileFilterModal';
import OrderModal from '../OrderModal';

const MobileDashboard = ({ onOpenCustomerModal }) => {
  const { columns, filteredOrders, setFilter, setView, updateOrderStatus, filters } = useKanban();
  const [activeTab, setActiveTab] = useState('home');
  const [userName, setUserName] = useState('Admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStatus, setExpandedStatus] = useState(null);

  React.useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setUserName(user.name || user.email?.split('@')[0] || 'Admin');
      } catch (e) {
        console.error('Error parsing userInfo', e);
      }
    }
  }, []);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  // Status-to-Color/Pattern Mapping
  const statusMappings = {
    new: { color: 'purple', pattern: (
      <svg viewBox="0 0 61 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.2">
          <path d="M37.5 49C56.5538 49 72 33.5538 72 14.5C72 -4.55382 56.5538 -20 37.5 -20C18.4462 -20 3 -4.55382 3 14.5C3 33.5538 18.4462 49 37.5 49Z" stroke="#B0A6EF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23.6992 14.5039H51.2992" stroke="#B0A6EF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M37.5 0.699219V28.2992" stroke="#B0A6EF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    )},
    stitching_in_progress: { color: 'orange', pattern: (
      <svg width="65" height="56" viewBox="0 0 65 56" fill="none" xmlns="http://www.w3.org/2000/svg">
<g opacity="0.2">
<path d="M36.498 -14V-0.600428" stroke="#F8C777" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M50.5684 5.42953L60.283 -4.28516" stroke="#F8C777" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M56.5977 19.5H69.9972" stroke="#F8C777" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M50.5684 33.5703L60.283 43.285" stroke="#F8C777" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M36.498 39.6016V53.0011" stroke="#F8C777" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M12.7148 43.285L22.4295 33.5703" stroke="#F8C777" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M3 19.5H16.3996" stroke="#F8C777" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M12.7148 -4.28516L22.4295 5.42953" stroke="#F8C777" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
</g>
</svg>

    )},
    done: { color: 'green', pattern: (
      <svg width="58" height="53" viewBox="0 0 58 53" fill="none" xmlns="http://www.w3.org/2000/svg">
<g opacity="0.2">
<path d="M36.5 50C55.0015 50 70 35.0015 70 16.5C70 -2.00154 55.0015 -17 36.5 -17C17.9985 -17 3 -2.00154 3 16.5C3 35.0015 17.9985 50 36.5 50Z" stroke="#7AC87A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M26.4492 16.5086L33.1492 23.2086L46.5492 9.80859" stroke="#7AC87A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
</g>
</svg>

    )},
    completed: { color: 'green', pattern: (
      <svg viewBox="0 0 58 53" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.2">
          <path d="M36.5 50C55.0015 50 70 35.0015 70 16.5C70 -2.00154 55.0015 -17 36.5 -17C17.9985 -17 3 -2.00154 3 16.5C3 35.0015 17.9985 50 36.5 50Z" stroke="#7AC87A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M26.4492 16.5086L33.1492 23.2086L46.5492 9.80859" stroke="#7AC87A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    )},
    fittings: { color: 'blue', pattern: (
      <svg width="64" height="56" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
<g opacity="0.2">
<path d="M27.7896 -14.0716C27.9957 -16.2398 29.0027 -18.2533 30.614 -19.7187C32.2253 -21.1841 34.325 -21.9961 36.503 -21.9961C38.681 -21.9961 40.7808 -21.1841 42.3921 -19.7187C44.0033 -18.2533 45.0104 -16.2398 45.2165 -14.0716C45.3404 -12.671 45.7999 -11.3208 46.5561 -10.1353C47.3123 -8.94989 48.343 -7.96409 49.5609 -7.26137C50.7789 -6.55866 52.1482 -6.15971 53.5529 -6.09829C54.9577 -6.03688 56.3566 -6.31481 57.6312 -6.90856C59.6103 -7.80711 61.853 -7.93712 63.9227 -7.27331C65.9924 -6.6095 67.7411 -5.19934 68.8284 -3.3173C69.9157 -1.43526 70.2639 0.784025 69.8051 2.90862C69.3464 5.03321 68.1135 6.91111 66.3465 8.17683C65.1959 8.9842 64.2566 10.0568 63.6082 11.304C62.9597 12.5511 62.6212 13.9361 62.6212 15.3417C62.6212 16.7474 62.9597 18.1324 63.6082 19.3795C64.2566 20.6266 65.1959 21.6993 66.3465 22.5066C68.1135 23.7724 69.3464 25.6503 69.8051 27.7749C70.2639 29.8994 69.9157 32.1187 68.8284 34.0008C67.7411 35.8828 65.9924 37.293 63.9227 37.9568C61.853 38.6206 59.6103 38.4906 57.6312 37.592C56.3566 36.9983 54.9577 36.7204 53.5529 36.7818C52.1482 36.8432 50.7789 37.2421 49.5609 37.9448C48.343 38.6476 47.3123 39.6334 46.5561 40.8188C45.7999 42.0042 45.3404 43.3544 45.2165 44.7551C45.0104 46.9233 44.0033 48.9368 42.3921 50.4022C40.7808 51.8676 38.681 52.6796 36.503 52.6796C34.325 52.6796 32.2253 51.8676 30.614 50.4022C29.0027 48.9368 27.9957 46.9233 27.7896 44.7551C27.6659 43.3539 27.2064 42.0032 26.45 40.8174C25.6935 39.6315 24.6624 38.6454 23.444 37.9426C22.2256 37.2398 20.8557 36.841 19.4504 36.78C18.0452 36.719 16.6459 36.9975 15.3711 37.592C13.392 38.4906 11.1493 38.6206 9.07964 37.9568C7.00993 37.293 5.26124 35.8828 4.17392 34.0008C3.0866 32.1187 2.73844 29.8994 3.1972 27.7749C3.65595 25.6503 4.8888 23.7724 6.6558 22.5066C7.80645 21.6993 8.74572 20.6266 9.39417 19.3795C10.0426 18.1324 10.3812 16.7474 10.3812 15.3417C10.3812 13.9361 10.0426 12.5511 9.39417 11.304C8.74572 10.0568 7.80645 8.9842 6.6558 8.17683C4.89128 6.91047 3.66061 5.0333 3.20296 2.91015C2.74532 0.787005 3.09339 -1.43046 4.17954 -3.31128C5.26569 -5.1921 7.01232 -6.60192 9.07998 -7.26675C11.1476 -7.93157 13.3886 -7.8039 15.3674 -6.90856C16.642 -6.31481 18.0409 -6.03688 19.4457 -6.09829C20.8504 -6.15971 22.2197 -6.55866 23.4376 -7.26137C24.6556 -7.96409 25.6863 -8.94989 26.4425 -10.1353C27.1987 -11.3208 27.6582 -12.671 27.7821 -14.0716" stroke="#8BC5FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M36.5008 26.5718C42.6982 26.5718 47.7222 21.5478 47.7222 15.3504C47.7222 9.15293 42.6982 4.12891 36.5008 4.12891C30.3033 4.12891 25.2793 9.15293 25.2793 15.3504C25.2793 21.5478 30.3033 26.5718 36.5008 26.5718Z" stroke="#8BC5FF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
</g>
</svg>

    )},
    ready_for_pickup: { color: 'red', pattern: (
      <svg viewBox="0 0 54 53" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.2">
          <path d="M52.7711 34.6973C54.8686 33.195 56.1128 30.7735 56.1128 28.1935V8.69821C56.1117 7.66332 55.8385 6.6469 55.3206 5.75093C54.8027 4.85495 54.0583 4.11092 53.1621 3.59348L32.5071 -8.20936C31.61 -8.72732 30.5923 -9 29.5564 -9C28.5205 -9 27.5028 -8.72732 26.6057 -8.20936L5.95071 3.59348C5.05447 4.11092 4.31006 4.85495 3.79215 5.75093C3.27425 6.6469 3.00106 7.66332 3 8.69821V32.3039C3.00106 33.3388 3.27425 34.3552 3.79215 35.2512C4.31006 36.1471 5.05447 36.8912 5.95071 37.4086L26.6057 49.2114C27.5028 49.7294 28.5205 50.0021 29.5564 50.0021C30.5923 50.0021 31.61 49.7294 32.5071 49.2114L52.7711 34.6973Z" stroke="#F58C88" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16.2773 -2.30469L42.8337 12.8915" stroke="#F58C88" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.85547 5.75L29.5561 20.5035L55.2568 5.75" stroke="#F58C88" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M29.5566 50.0071V20.5" stroke="#F58C88" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    )},
    ready: { color: 'red', pattern: (
      <svg viewBox="0 0 54 53" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.2">
          <path d="M52.7711 34.6973C54.8686 33.195 56.1128 30.7735 56.1128 28.1935V8.69821C56.1117 7.66332 55.8385 6.6469 55.3206 5.75093C54.8027 4.85495 54.0583 4.11092 53.1621 3.59348L32.5071 -8.20936C31.61 -8.72732 30.5923 -9 29.5564 -9C28.5205 -9 27.5028 -8.72732 26.6057 -8.20936L5.95071 3.59348C5.05447 4.11092 4.31006 4.85495 3.79215 5.75093C3.27425 6.6469 3.00106 7.66332 3 8.69821V32.3039C3.00106 33.3388 3.27425 34.3552 3.79215 35.2512C4.31006 36.1471 5.05447 36.8912 5.95071 37.4086L26.6057 49.2114C27.5028 49.7294 28.5205 50.0021 29.5564 50.0021C30.5923 50.0021 31.61 49.7294 32.5071 49.2114L52.7711 34.6973Z" stroke="#F58C88" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16.2773 -2.30469L42.8337 12.8915" stroke="#F58C88" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.85547 5.75L29.5561 20.5035L55.2568 5.75" stroke="#F58C88" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M29.5566 50.0071V20.5" stroke="#F58C88" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    )}
  };

  const statusColors = {
    purple: { bg: 'bg-[#D4CDFF]', accent: '#B0A6EF' },
    orange: { bg: 'bg-[#F8E7CB]', accent: '#F8C777' },
    green: { bg: 'bg-[#AED8AE]', accent: '#7AC87A' },
    blue: { bg: 'bg-[#CBE5FF]', accent: '#8BC5FF' },
    red: { bg: 'bg-[#FCC6C4]', accent: '#F58C88' }
  };

  // Dynamically generate tiles from columns to ensure same data/titles as desktop
  const mobileTiles = useMemo(() => {
    // Filter columns based on active status filters
    let displayColumns = columns;
    const activeStatuses = filters.status || [];
    
    if (activeStatuses.length > 0 && !activeStatuses.includes('all')) {
      displayColumns = columns.filter(col => activeStatuses.includes(col.value));
    }

    return displayColumns.map(col => {
      const mapping = statusMappings[col.value] || statusMappings.new;
      return {
        id: col._id || col.value,
        title: col.title,
        count: filteredOrders.filter(order => order.status === col.value).length,
        color: mapping.color,
        value: col.value,
        pattern: mapping.pattern
      };
    });
  }, [columns, filteredOrders, filters.status]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setFilter('search', e.target.value);
  };

  const handleTabChange = (tabId) => {
    if (tabId === 'order') {
      setIsAddOrderModalOpen(true);
    } else if (tabId === 'customer') {
      onOpenCustomerModal();
    } else {
      setActiveTab(tabId);
    }
  };

  const handleTileClick = (statusValue) => {
    if (expandedStatus === statusValue) {
      setExpandedStatus(null);
    } else {
      setExpandedStatus(statusValue);
    }
  };

  const getStatusOrders = (statusValue) => {
    return filteredOrders.filter(order => order.status === statusValue);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-[100px] px-4 font-inter">
      {/* Professional Top Bar */}
      <div className="flex items-center justify-end pt-6 pb-2">
        <div className="relative">
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-10 h-10 rounded-full border border-[#E5E5E5] bg-white flex items-center justify-center text-[#5858CB] font-bold shadow-sm active:scale-95 transition-all"
          >
            {userName.charAt(0).toUpperCase()}
          </button>

          {isProfileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-[160px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-1.5 animate-scale-in">
                <div className="px-3 py-2 border-b border-gray-50 mb-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Account</p>
                  <p className="text-sm font-bold text-[#424242] truncate">{userName}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-red-500 text-sm font-bold hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Welcome Section */}
      <div className="pt-2 pb-4">
        <p className="text-[13px] font-bold text-gray-400 uppercase tracking-[0.1em]">Welcome back !</p>
        <h2 className="text-[24px] font-black text-[#1A1A1A] leading-none mt-1">{userName}</h2>
      </div>

      <div className="relative mb-6">
        <div className="flex items-center bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg h-[40px] px-3 gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="6" cy="6" r="4.5" stroke="#AFB7BE" strokeWidth="1"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="#AFB7BE" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search Task" 
            className="bg-transparent border-none outline-none text-sm text-[#424242] placeholder-[#B5B5B5] w-full"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6 border-b border-[#E5E5E5] relative h-[36px]">
        <button className="flex items-center gap-1 pb-2 relative" onClick={() => setView('board')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="4" stroke="#5858CB"/>
            <path d="M12 8V12" stroke="#5858CB" strokeLinecap="round"/>
            <path d="M16 8V16" stroke="#5858CB" strokeLinecap="round"/>
            <path d="M8 8V14" stroke="#5858CB" strokeLinecap="round"/>
          </svg>
          <span className="text-[14px] text-[#5858CB]">Board</span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#5858CB]"></div>
        </button>
        <button className="flex items-center gap-1 pb-2 text-[#424242]" onClick={() => setView('list')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="4" stroke="#AFB7BE"/>
            <path d="M9 4L9 20" stroke="#AFB7BE" strokeLinecap="round"/>
            <path d="M4 9H20" stroke="#AFB7BE" strokeLinecap="round"/>
          </svg>
          <span className="text-[14px]">Table</span>
        </button>
        <div className="ml-auto pb-2 flex items-center">
          <button 
            className="p-1 active:scale-90 transition-transform"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7C3 4.79086 4.79086 3 7 3H17C19.2091 3 21 4.79086 21 7V17C21 19.2091 19.2091 21 17 21H7C4.79086 21 3 19.2091 3 17V7Z" stroke="#AFB7BE"/>
              <path d="M8 8H16" stroke="#AFB7BE" strokeLinecap="round"/>
              <path d="M8 12H16" stroke="#AFB7BE" strokeLinecap="round"/>
              <path d="M8 16H16" stroke="#AFB7BE" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Step 1: Expanded View at Top */}
        {expandedStatus && (
          <div className={`${statusColors[statusMappings[expandedStatus]?.color || 'purple']?.bg || 'bg-gray-100'} rounded-[16px] p-[16px] flex flex-col gap-[16px]`}>
            {/* Expanded Header */}
            <div onClick={() => setExpandedStatus(null)} className="flex justify-between items-center cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-[#424242] text-[24px] font-bold font-inter">
                  {columns.find(c => c.value === expandedStatus)?.title || expandedStatus}
                </span>
                <div className="bg-white rounded-full w-[36px] h-[36px] flex items-center justify-center shadow-md">
                  <span className="text-[#424242] text-[18px] font-bold">
                    {getStatusOrders(expandedStatus).length}
                  </span>
                </div>
              </div>
              <div className="w-[32px] h-[32px] bg-white/40 rounded-full flex items-center justify-center shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 15L12 9L6 15" stroke="#424242" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Orders List */}
            <div className="flex flex-col gap-[12px]">
              {getStatusOrders(expandedStatus).length > 0 ? (
                getStatusOrders(expandedStatus).map((order) => (
                  <MobileOrderCard 
                    key={order._id} 
                    order={order} 
                    onClick={() => setSelectedOrder(order)}
                  />
                ))
              ) : (
                <div className="bg-white/40 rounded-[12px] p-8 text-center text-[#424242] font-medium border border-white/20">
                  No orders found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Remaining Grid at Bottom */}
        <div className="grid grid-cols-2 gap-[16px]">
          {mobileTiles.map((tile) => {
            const isExpanded = expandedStatus === tile.value;
            if (isExpanded) return null;
            return (
              <StatusTile 
                key={tile.id}
                {...tile}
                onClick={() => handleTileClick(tile.value)}
                onDrop={(orderId) => updateOrderStatus(orderId, tile.value)}
              />
            );
          })}
        </div>
      </div>

      <BottomNavbar activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Filter Modal */}
      <MobileFilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
      />

      {/* Order Details/Edit Modal */}
      {(isAddOrderModalOpen || selectedOrder) && (
        <OrderModal
          orderToEdit={selectedOrder}
          onClose={() => {
            setIsAddOrderModalOpen(false);
            setSelectedOrder(null);
          }}
          initialReadOnly={false}
        />
      )}
    </div>
  );
};

export default MobileDashboard;
