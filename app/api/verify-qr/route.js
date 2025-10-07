import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { qrCode } = await request.json();
    
    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.EVENTIVE_API_URL;
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Fetch all passes from Eventive API
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch passes from Eventive API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const passes = data.passes || [];

    // Search for the QR code
    let foundPass = null;
    let isMainRecord = false;
    let isUseRecord = false;

    // First, check if it's a main record ID
    foundPass = passes.find(pass => pass.id === qrCode);
    
    if (foundPass) {
      isMainRecord = true;
    } else {
      // If not found as main record, search in "uses" arrays
      for (const pass of passes) {
        if (pass.uses && Array.isArray(pass.uses)) {
          if (pass.uses.includes(qrCode)) {
            foundPass = pass;
            isUseRecord = true;
            break;
          }
        }
      }
    }

    if (!foundPass) {
      return NextResponse.json(
        { 
          found: false,
          message: 'QR code not found in the system. This badge is not registered in the Eventive API.'
        },
        { status: 404 }
      );
    }

    // Return the main record details
    return NextResponse.json({
      found: true,
      isMainRecord,
      isUseRecord,
      scannedId: qrCode,
      mainRecordId: foundPass.id,
      pass: {
        id: foundPass.id,
        name: foundPass.name,
        email: foundPass.person?.email || '',
        event_bucket: foundPass.event_bucket,
        pass_bucket: foundPass.pass_bucket,
        order: foundPass.order,
        created_at: foundPass.created_at,
        updated_at: foundPass.updated_at,
        is_active: foundPass.is_active,
        uses: foundPass.uses || [],
        qr_code_path: foundPass.qr_code_path,
        preview_available_ticket_uses: foundPass.preview_available_ticket_uses
      },
      message: isUseRecord 
        ? `This is a use ticket. Redirected to main record for ${foundPass.name}.`
        : `Main record found for ${foundPass.name}.`
    });

  } catch (error) {
    console.error('Error verifying QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error while verifying QR code' },
      { status: 500 }
    );
  }
}

