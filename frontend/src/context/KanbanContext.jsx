import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api';

const KanbanContext = createContext();

export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};

export const KanbanProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [columns, setColumns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customersEnabled, setCustomersEnabled] = useState(true);
  const [view, setView] = useState('board'); 
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    date: '',
    dateType: 'all', // 'all', 'today', 'week', 'month', 'custom'
    tag: 'all', // 'all', 'Urgent', 'Delicate', etc.
    customer: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, ordersRes] = await Promise.all([
        api.get('/statuses'),
        api.get('/orders')
      ]);
      setColumns(statusRes.data);
      setOrders(ordersRes.data);

      // Customers endpoint may not exist on older/deployed backends — handle 404 gracefully
      try {
        const customersRes = await api.get('/customers');
        setCustomers(customersRes.data);
        setCustomersEnabled(true);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.warn('/customers endpoint not found on server — continuing with empty customers list');
          setCustomers([]);
          setCustomersEnabled(false);
        } else {
          console.error('Failed to fetch customers', err);
          setCustomers([]);
          setCustomersEnabled(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (customerId) => {
    try {
      setLoading(true);
      const params = {};
      if (customerId) params.customer = customerId;
      const ordersRes = await api.get('/orders', { params });
      setOrders(ordersRes.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchData();
    }
  }, [fetchData]);

  // Refetch orders when customer filter changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    // If filters has a customer property, use it. Otherwise do nothing here.
    if (filters.customer) {
      fetchOrders(filters.customer);
    }
  }, [filters.customer, fetchOrders]);

  const addOrder = async (newOrder) => {
    try {
      const { data } = await api.post('/orders', newOrder);
      setOrders((prev) => [data, ...prev]);
      return data;
    } catch (error) {
      console.error("Error adding order", error);
      throw error;
    }
  };

  const addCustomer = async (customer) => {
    try {
      if (!customersEnabled) {
        const e = new Error('Customers endpoint not available on server');
        e.isEndpointMissing = true;
        throw e;
      }
      const { data } = await api.post('/customers', customer);
      setCustomers((prev) => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding customer', error);
      throw error;
    }
  };

  const updateCustomer = async (customerId, updatedData) => {
    try {
      if (!customersEnabled) return;
      const { data } = await api.patch(`/customers/${customerId}`, updatedData);
      setCustomers((prev) => 
        prev.map(c => c._id === customerId ? data : c)
      );
      return data;
    } catch (error) {
      console.error('Error updating customer', error);
      throw error;
    }
  };


  const updateOrderStatus = async (orderId, newStatusVal) => {
    // Optimistic Update
    const originalOrders = [...orders];
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId ? { ...order, status: newStatusVal } : order
      )
    );

    try {
      await api.patch(`/orders/${orderId}`, { status: newStatusVal });
    } catch (error) {
      setOrders(originalOrders); // Revert
      console.error("Error updating status", error);
    }
  };

  const deleteOrder = async (orderId) => {
    // Optimistic Delete
    const originalOrders = [...orders];
    setOrders((prev) => prev.filter((order) => order._id !== orderId));

    try {
      await api.delete(`/orders/${orderId}`);
    } catch (error) {
      setOrders(originalOrders);
      console.error("Error deleting order", error);
      alert("Failed to delete order");
    }
  };

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      date: '',
      dateType: 'all',
      tag: 'all',
      customer: ''
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderId.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesStatus =
        filters.status === 'all' || order.status === filters.status;
      
      // Tag Filter
      const matchesTag = 
        filters.tag === 'all' || (order.tags && order.tags.includes(filters.tag));

      let matchesDate = true;
      const orderDate = new Date(order.deliveryDate);
      const today = new Date();
      
      // Reset time parts for accurate comparison
      today.setHours(0, 0, 0, 0);
      // orderDate is parsed from YYYY-MM-DD, usually defaults to UTC midnight if not careful, 
      // but if we treat it as local string parsing or just use string comparison for today.
      
      // Simplest way for 'YYYY-MM-DD' comparison
      const orderDateString = order.deliveryDate;
      const todayString = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format in CA/SE/etc. or just manual

      const getStartOfWeek = (d) => {
        const date = new Date(d);
        const day = date.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start if needed, or just standard
        // Let's assume standard Sunday start for simplicity or user locale
        const sunday = new Date(date.setDate(date.getDate() - day));
        return sunday;
      }

      if (filters.dateType === 'today') {
         // Construct local YYYY-MM-DD
         const year = today.getFullYear();
         const month = String(today.getMonth() + 1).padStart(2, '0');
         const day = String(today.getDate()).padStart(2, '0');
         const localToday = `${year}-${month}-${day}`;
         matchesDate = order.deliveryDate === localToday;
      } else if (filters.dateType === 'week') {
        const current = new Date();
        const startOfWeek = new Date(current.setDate(current.getDate() - current.getDay()));
        const endOfWeek = new Date(current.setDate(current.getDate() - current.getDay() + 6));
        
        // Reset times
        startOfWeek.setHours(0,0,0,0);
        endOfWeek.setHours(23,59,59,999);
        
        // Order date (assuming YYYY-MM-DD is local midnight)
        // We will append T00:00:00 to ensure it parses correctly as local if needed, OR matches strict
        const targetDate = new Date(order.deliveryDate + 'T00:00:00');
        matchesDate = targetDate >= startOfWeek && targetDate <= endOfWeek;

      } else if (filters.dateType === 'month') {
        const current = new Date();
        const targetDate = new Date(order.deliveryDate + 'T00:00:00');
        matchesDate = 
          targetDate.getMonth() === current.getMonth() && 
          targetDate.getFullYear() === current.getFullYear();
      } else if (filters.dateType === 'custom') {
        matchesDate = !filters.date || order.deliveryDate === filters.date;
      }

      return matchesSearch && matchesStatus && matchesDate && matchesTag;
    });
  }, [orders, filters]);

  const availableTags = useMemo(() => {
    const tags = new Set();
    orders.forEach(order => {
      if (order.tags && Array.isArray(order.tags)) {
        order.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [orders]);

  const value = {
    orders,
    columns,
    customers,
    customersEnabled,
    view,
    setView,
    filters,
    setFilter,
    addCustomer,
    updateCustomer,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    resetFilters,
    filteredOrders,
    refreshBoard: fetchData,
    loading,
    availableTags
  };

  return (
    <KanbanContext.Provider value={value}>
      {children}
    </KanbanContext.Provider>
  );
};
