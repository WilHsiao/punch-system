import { database } from '@/config/firebaseConfig';
import { ref, push } from 'firebase/database';
import axios from 'axios';

export async function POST(req) {
  const { code, state } = await req.json();

  try {
    const response = await axios.post('https://notify-bot.line.me/oauth/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://punch-system.vercel.app/line-notify',
        client_id: 'adAQrEf3zWs293h5nYzgYD',
        client_secret: 'iu1kf6kHT3QNbRWzsLBiXcOx6U6IPdkuwrxyTXOMMbt',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = response.data.access_token;

    // 存儲 access token 到 Firebase
    const dbRef = ref(database, 'line_tokens');
    await push(dbRef, {
      token: accessToken,
      createdAt: new Date().toISOString()
    });

    console.log('Access Token stored in Firebase');

    return new Response(JSON.stringify({ success: true, message: 'Access Token stored successfully' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error obtaining or storing access token:', error.response?.data || error.message);
    return new Response(JSON.stringify({ 
      error: 'Failed to obtain or store access token', 
      details: error.response?.data || error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}