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
  const [systemTags, setSystemTags] = useState([]);
  const [customersEnabled, setCustomersEnabled] = useState(true);
  const [view, setView] = useState('board'); 
  const [filters, setFilters] = useState({
    search: '',
    status: [], // Empty array means 'all'
    date: '',
    dateType: 'all', // 'all', 'today', 'week', 'month', 'custom'
    tag: [], // Empty array means 'all'
    customer: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, ordersRes, tagsRes] = await Promise.all([
        api.get('/statuses'),
        api.get('/orders', { params: { limit: 100 } }), // Fetch reasonable chunk for now
        api.get('/tags')
      ]);
      setColumns(statusRes.data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setOrders(ordersRes.data);
      setSystemTags(tagsRes.data);

      // Customers endpoint may not exist on older/deployed backends — handle 404 gracefully
      try {
        const customersRes = await api.get('/customers', { params: { limit: 100 } }); // Fetch reasonable chunk for now
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


  const updateOrder = async (orderId, updatedFields) => {
    // Optimistic Update
    const originalOrders = [...orders];
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId ? { ...order, ...updatedFields } : order
      )
    );

    try {
      await api.patch(`/orders/${orderId}`, updatedFields);
    } catch (error) {
      setOrders(originalOrders); // Revert
      console.error("Error updating order", error);
    }
  };

  const updateOrderStatus = async (orderId, newStatusVal) => {
    await updateOrder(orderId, { status: newStatusVal });
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
      status: [],
      date: '',
      dateType: 'all',
      tag: [],
      customer: ''
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderId.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.toLowerCase().includes(filters.search.toLowerCase()));
      
      // Status Filter (Multiple)
      const matchesStatus =
        !filters.status || filters.status.length === 0 || filters.status.includes('all') || filters.status.includes(order.status);
      
      // Tag Filter (Multiple)
      const matchesTag = 
        !filters.tag || filters.tag.length === 0 || filters.tag.includes('all') || 
        (order.tags && order.tags.some(t => filters.tag.includes(t)));

      let matchesDate = true;
      
      // Robust date normalization helper to handle multiple formats
      const normalizeDate = (input) => {
        if (!input) return null;
        try {
          // If it's already YYYY-MM-DD...
          if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.split('T')[0])) {
             return input.split('T')[0];
          }
          // If it's DD-MM-YYYY (like user might enter or store)...
          if (typeof input === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(input)) {
             const [d, m, y] = input.split('-');
             return `${y}-${m}-${d}`;
          }
          const d = new Date(input);
          if (isNaN(d.getTime())) return null;
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } catch (e) {
          return null;
        }
      };

      const orderDateStr = normalizeDate(order.deliveryDate);
      const todayStr = normalizeDate(new Date());

      if (!orderDateStr) {
        matchesDate = filters.dateType === 'all';
      } else if (filters.dateType === 'today') {
        matchesDate = orderDateStr === todayStr;
      } else if (filters.dateType === 'week') {
        const [y, m, d] = orderDateStr.split('-').map(Number);
        const target = new Date(y, m - 1, d);
        
        const now = new Date();
        const start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        
        matchesDate = target >= start && target <= end;
      } else if (filters.dateType === 'month') {
        const [y, m] = orderDateStr.split('-').map(String);
        const now = new Date();
        const curY = String(now.getFullYear());
        const curM = String(now.getMonth() + 1).padStart(2, '0');
        matchesDate = (y === curY && m === curM);
      } else if (filters.dateType === 'custom' || filters.dateType === 'date') {
        const filterDateStr = normalizeDate(filters.date);
        matchesDate = !filterDateStr || orderDateStr === filterDateStr;
      }

      return matchesSearch && matchesStatus && matchesDate && matchesTag;
    });
  }, [orders, filters]);

  const availableTags = useMemo(() => {
    return systemTags;
  }, [systemTags]);

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
    updateOrder,
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
