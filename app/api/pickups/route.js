import { NextResponse } from 'next/server';
import { createClient } from 'redis';

const PICKUPS_KEY = 'badge:pickups';

// Create Redis client
let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    
    await redisClient.connect();
  }
  
  return redisClient;
}

// GET - Retrieve all pickups
export async function GET() {
  try {
    const client = await getRedisClient();
    const data = await client.get(PICKUPS_KEY);
    const pickups = data ? JSON.parse(data) : [];
    
    return NextResponse.json({ pickups });
  } catch (error) {
    console.error('Error reading pickups:', error);
    return NextResponse.json(
      { error: 'Failed to read pickups' },
      { status: 500 }
    );
  }
}

// POST - Mark a badge as picked up
export async function POST(request) {
  try {
    const body = await request.json();
    const { id, name, email } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    
    // Get existing pickups
    const data = await client.get(PICKUPS_KEY);
    const pickups = data ? JSON.parse(data) : [];

    // Check if already picked up
    const existingPickup = pickups.find(p => p.id === id);
    if (existingPickup) {
      return NextResponse.json(
        { message: 'Badge already picked up', pickup: existingPickup },
        { status: 200 }
      );
    }

    // Add new pickup
    const newPickup = {
      id,
      name: name || '',
      email: email || '',
      pickedUpAt: new Date().toISOString()
    };

    pickups.push(newPickup);

    // Save to Redis
    await client.set(PICKUPS_KEY, JSON.stringify(pickups));

    return NextResponse.json({ 
      message: 'Badge marked as picked up',
      pickup: newPickup
    });
  } catch (error) {
    console.error('Error marking pickup:', error);
    return NextResponse.json(
      { error: 'Failed to mark badge as picked up' },
      { status: 500 }
    );
  }
}

