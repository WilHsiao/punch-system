import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('開始處理請求');
    const { message, token } = await request.json();
    console.log('收到的消息:', message);
    console.log('Token 長度:', token.length);

    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`
      },
      body: `message=${encodeURIComponent(message)}`
    });

    console.log('Line API 響應狀態:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Line API 錯誤響應:', responseText);
      throw new Error('發送 Line Notify 失敗');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('發送 Line Notify 時出錯:', error);
    return NextResponse.json({ error: error.message || '發送 Line Notify 失敗' }, { status: 500 });
  }
}