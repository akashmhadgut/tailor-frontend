import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { KanbanProvider, useKanban } from './context/KanbanContext';
import Navbar from './components/Navbar';
import Board from './components/Board';
import ListView from './components/ListView';
import OrderModal from './components/OrderModal';
import CustomerModal from './components/CustomerModal';
import OrderDetails from './components/OrderDetails';
import LoginPage from './pages/LoginPage';
import MobileDashboard from './components/mobile/MobileDashboard';
import useIsMobile from './hooks/useIsMobile';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Dashboard = () => {
  const { view, loading } = useKanban();
  const isMobile = useIsMobile();
  const [modalState, setModalState] = useState({ isOpen: false, orderToEdit: null, initialReadOnly: false });
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const openAddModal = () => setModalState({ isOpen: true, orderToEdit: null, initialReadOnly: false });
  const openEditModal = (order) => setModalState({ isOpen: true, orderToEdit: order, initialReadOnly: false });
  const closeModal = () => setModalState({ isOpen: false, orderToEdit: null, initialReadOnly: false });

  const openCustomerModal = () => setIsCustomerModalOpen(true);
  const closeCustomerModal = () => setIsCustomerModalOpen(false);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Mobile View
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white">
        <MobileDashboard onOpenCustomerModal={openCustomerModal} />
        {modalState.isOpen && (
          <OrderModal 
            onClose={closeModal} 
            orderToEdit={modalState.orderToEdit} 
            initialReadOnly={modalState.initialReadOnly}
          />
        )}
        {isCustomerModalOpen && (
          <CustomerModal onClose={closeCustomerModal} />
        )}
      </div>
    );
  }

  // Desktop View
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      <Navbar onOpenModal={openAddModal} onOpenCustomerModal={openCustomerModal} />
      
      <main className="w-full max-w-[1600px] mx-auto px-12 pt-6 pb-8 flex-1">
        {view === 'board' ? (
          <Board onEditOrder={openEditModal} />
        ) : (
          <ListView onEditOrder={openEditModal} />
        )}
      </main>

      <footer className="w-full py-6 text-center text-gray-400 text-sm font-inter border-t border-gray-100 mt-auto bg-white">
        © 2026 Powered by Pixelpair Studio. All rights reserved.
      </footer>

      {modalState.isOpen && (
        <OrderModal 
          onClose={closeModal} 
          orderToEdit={modalState.orderToEdit} 
          initialReadOnly={modalState.initialReadOnly}
        />
      )}
      {isCustomerModalOpen && (
        <CustomerModal onClose={closeCustomerModal} />
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <KanbanProvider>
                <Dashboard />
              </KanbanProvider>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
