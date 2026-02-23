import React from 'react';

const BottomNavbar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: (active) => (
        <div className="relative">
          {active && <div className="absolute inset-[-6px] bg-[#5858CB] opacity-5 rounded-full"></div>}
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle opacity="0.05" cx="15" cy="15" r="15" fill="#5858CB"/>
<path d="M7 15.779C7 14.6213 7.50163 13.5203 8.37529 12.7606L12.3753 9.28236C13.8804 7.97359 16.1196 7.97359 17.6247 9.28236L21.6247 12.7606C22.4984 13.5203 23 14.6213 23 15.779V20C23 22.2091 21.2091 24 19 24H11C8.79086 24 7 22.2091 7 20V15.779Z" stroke={active ? "#5858CB" : "#AFB7BE"} strokeLinecap="round" strokeLinejoin="round"/>
<path d="M18 24V20C18 18.3431 16.6569 17 15 17C13.3431 17 12 18.3431 12 20V24" stroke={active ? "#5858CB" : "#AFB7BE"} strokeLinecap="round" strokeLinejoin="round"/>
</svg>

        </div>
      )
    },
    { 
      id: 'order', 
      label: 'Order', 
      icon: (active) => (
        <div className="relative">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 12L17 12" stroke={active ? "#5858CB" : "#AFB7BE"} strokeLinecap="round"/>
            <path d="M12 7L12 17" stroke={active ? "#5858CB" : "#AFB7BE"} strokeLinecap="round"/>
            <rect x="4" y="4" width="16" height="16" rx="4" stroke={active ? "#5858CB" : "#AFB7BE"}/>
          </svg>
        </div>
      )
    },
    { 
      id: 'customer', 
      label: 'Customer', 
      icon: (active) => (
        <div className="relative">
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="4" stroke={active ? "#5858CB" : "#AFB7BE"}/>
            <circle cx="11.8413" cy="8.64011" r="2.64011" stroke={active ? "#5858CB" : "#AFB7BE"}/>
            <path d="M7 15.5C7 14.1193 8.11929 13 9.5 13H14.5C15.8807 13 17 14.1193 17 15.5C17 16.8807 15.8807 18 14.5 18H9.5C8.11929 18 7 16.8807 7 15.5Z" stroke={active ? "#5858CB" : "#AFB7BE"}/>
          </svg>
        </div>
      )
    }
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[328px] h-[57px] bg-white border border-[#5858CB] rounded-[20px] shadow-[0px_0px_16px_rgba(66,66,66,0.15)] flex items-center justify-around z-[100]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="flex flex-col items-center gap-0.5"
        >
          {tab.icon(activeTab === tab.id)}
          <span className={`font-inter text-[12px] leading-[15px] ${activeTab === tab.id ? 'text-[#5858CB]' : 'text-[#424242]'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavbar;
