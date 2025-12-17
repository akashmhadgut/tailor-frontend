import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { KanbanProvider, useKanban } from './context/KanbanContext';
import Navbar from './components/Navbar';
import Board from './components/Board';
import ListView from './components/Listview';
import OrderModal from './components/OrderModal';
import LoginPage from './pages/LoginPage';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Dashboard = () => {
  const { view, loading } = useKanban();
  const [modalState, setModalState] = useState({ isOpen: false, orderToEdit: null });

  const openAddModal = () => setModalState({ isOpen: true, orderToEdit: null });
  const openEditModal = (order) => setModalState({ isOpen: true, orderToEdit: order });
  const closeModal = () => setModalState({ isOpen: false, orderToEdit: null });

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar onOpenModal={openAddModal} />
      
      <main className="container mx-auto px-4 pb-8">
        {view === 'board' ? (
          <Board onEditOrder={openEditModal} />
        ) : (
          <ListView onEditOrder={openEditModal} />
        )}
      </main>

      {modalState.isOpen && (
        <OrderModal 
          onClose={closeModal} 
          orderToEdit={modalState.orderToEdit} 
        />
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
