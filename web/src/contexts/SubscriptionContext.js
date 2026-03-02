import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SubscriptionContext = createContext();

export const useSubscriptions = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const addSubscription = async (subscriptionData) => {
    try {
      const response = await api.post('/subscriptions', subscriptionData);
      setSubscriptions(prev => [...prev, response.data]);
      toast.success('Subscription added successfully');
      return true;
    } catch (error) {
      toast.error('Failed to add subscription');
      return false;
    }
  };

  const updateSubscription = async (id, subscriptionData) => {
    try {
      const response = await api.put(`/subscriptions/${id}`, subscriptionData);
      setSubscriptions(prev => 
        prev.map(sub => sub._id === id ? response.data : sub)
      );
      toast.success('Subscription updated successfully');
      return true;
    } catch (error) {
      toast.error('Failed to update subscription');
      return false;
    }
  };

  const deleteSubscription = async (id) => {
    try {
      await api.delete(`/subscriptions/${id}`);
      setSubscriptions(prev => prev.filter(sub => sub._id !== id));
      toast.success('Subscription deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete subscription');
      return false;
    }
  };

  const getSubscriptionById = (id) => {
    return subscriptions.find(sub => sub._id === id);
  };

  const getTotalMonthly = () => {
    return subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => {
        switch(sub.billingPeriod) {
          case 'weekly': return sum + sub.cost * 4.33;
          case 'monthly': return sum + sub.cost;
          case 'quarterly': return sum + sub.cost / 3;
          case 'yearly': return sum + sub.cost / 12;
          default: return sum + sub.cost;
        }
      }, 0);
  };

  const getTotalYearly = () => {
    return getTotalMonthly() * 12;
  };

  const getSubscriptionsByCategory = () => {
    const categories = {};
    subscriptions.forEach(sub => {
      if (!categories[sub.category]) {
        categories[sub.category] = [];
      }
      categories[sub.category].push(sub);
    });
    return categories;
  };

  const getUpcomingBills = (days = 7) => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return subscriptions
      .filter(sub => {
        const nextBill = new Date(sub.nextBillingDate);
        return sub.status === 'active' && 
               nextBill >= now && 
               nextBill <= future;
      })
      .sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate));
  };

  const value = {
    subscriptions,
    loading,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    getSubscriptionById,
    getTotalMonthly,
    getTotalYearly,
    getSubscriptionsByCategory,
    getUpcomingBills,
    refresh: fetchSubscriptions
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};