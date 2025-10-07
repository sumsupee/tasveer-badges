/**
 * Fetch all passes from the API
 */
export async function fetchPasses() {
  const response = await fetch('/api/passes', {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch passes');
  }
  
  const data = await response.json();
  return data.passes || [];
}

/**
 * Fetch all pickups from the API
 */
export async function fetchPickups() {
  const response = await fetch('/api/pickups', {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch pickups');
  }
  
  const data = await response.json();
  return data.pickups || [];
}

/**
 * Mark a badge as picked up
 */
export async function markBadgeAsPickedUp({ id, name, email = '' }) {
  const response = await fetch('/api/pickups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, name, email }),
  });

  if (!response.ok) {
    throw new Error('Failed to mark badge as picked up');
  }

  const data = await response.json();
  return data.pickup;
}

/**
 * Verify a QR code against the Eventive API
 */
export async function verifyQRCode(qrCode) {
  const response = await fetch('/api/verify-qr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ qrCode }),
    cache: 'no-store'
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 404) {
      return {
        found: false,
        message: data.message || 'QR code not found in the system'
      };
    }
    throw new Error(data.error || 'Failed to verify QR code');
  }

  return data;
}
