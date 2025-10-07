import { useState, useEffect } from 'react';
import { fetchPickups as apiFetchPickups, markBadgeAsPickedUp } from '../lib/apiService';
import { PICKUP_REFRESH_INTERVAL } from '../lib/constants';

/**
 * Custom hook for managing badge pickups
 */
export function usePickups() {
  const [pickups, setPickups] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);

  const fetchPickups = async () => {
    try {
      const data = await apiFetchPickups();
      setPickups(data);
    } catch (err) {
      console.error('Error fetching pickups:', err);
    }
  };

  const isPickedUp = (badgeId) => {
    return pickups.some(p => p.id === badgeId);
  };

  const handlePickup = async ({ id, name, email = '' }) => {
    // Refresh pickups first to get latest data from other users
    await fetchPickups();

    if (isPickedUp(id)) {
      throw new Error('This badge has already been picked up by someone else');
    }

    setPickupLoading(true);

    try {
      const pickup = await markBadgeAsPickedUp({ id, name, email });
      
      // Refresh pickups list immediately to update UI
      await fetchPickups();
      
      return pickup;
    } finally {
      setPickupLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();

    // Auto-refresh pickups every 10 seconds to catch updates from other users
    const pickupInterval = setInterval(() => {
      fetchPickups();
    }, PICKUP_REFRESH_INTERVAL);

    return () => {
      clearInterval(pickupInterval);
    };
  }, []);

  return {
    pickups,
    pickupLoading,
    isPickedUp,
    handlePickup,
    fetchPickups
  };
}
