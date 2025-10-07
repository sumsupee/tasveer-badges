import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.EVENTIVE_API_URL;
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Disable caching to always get fresh data
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch passes from Eventive API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching passes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

