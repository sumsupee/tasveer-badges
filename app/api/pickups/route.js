import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const PICKUPS_KEY = 'badge:pickups';

// GET - Retrieve all pickups
export async function GET() {
  try {
    const pickups = await kv.get(PICKUPS_KEY);
    return NextResponse.json({ pickups: pickups || [] });
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

    // Get existing pickups
    const pickups = (await kv.get(PICKUPS_KEY)) || [];

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

    // Save to Vercel KV
    await kv.set(PICKUPS_KEY, pickups);

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

