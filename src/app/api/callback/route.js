import axios from 'axios';

export async function POST(req) {
  try {
    const { code, state } = await req.json();

    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Missing code or state' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    
    console.log('Access Token:', accessToken);

    return new Response(JSON.stringify({ success: true, accessToken }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error obtaining access token:', error.response?.data || error.message);
    return new Response(JSON.stringify({ 
      error: 'Failed to obtain access token', 
      details: error.response?.data || error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}