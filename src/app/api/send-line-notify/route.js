import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message, token } = await request.json();

    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`
      },
      body: `message=${encodeURIComponent(message)}`
    });

    if (!response.ok) {
      throw new Error('發送 Line Notify 失敗');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('發送 Line Notify 時出錯:', error);
    return NextResponse.json({ error: '發送 Line Notify 失敗' }, { status: 500 });
  }
}