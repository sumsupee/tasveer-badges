import { useState, useEffect } from 'react';
import { fetchPasses as apiFetchPasses } from '../lib/apiService';

/**
 * Custom hook for managing passes data
 */
export function usePasses() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPasses = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await apiFetchPasses();
      setPasses(data);
    } catch (err) {
      console.error('Error fetching passes:', err);
      setError('Failed to load passes data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  return {
    passes,
    loading,
    error,
    fetchPasses
  };
}
