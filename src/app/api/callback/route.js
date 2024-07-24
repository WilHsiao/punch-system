import axios from 'axios';

export async function POST(req) {
  const { code, state } = await req.json();

  try {
    const response = await axios.post('https://notify-bot.line.me/oauth/token', new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://punch-system.vercel.app/line-notify',
      client_id: 'adAQrEf3zWs293h5nYzgYD',
      client_secret: 'iu1kf6kHT3QNbRWzsLBiXcOx6U6IPdkuwrxyTXOMMbt',
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const accessToken = response.data.access_token;
    // 存儲 accessToken 以便後續使用，例如存儲在數據庫中或環境變量中
    console.log('Access Token:', accessToken);
    return new Response(JSON.stringify({ success: true, accessToken }), { status: 200 });

  } catch (error) {
    console.error('Error obtaining access token:', error);
    return new Response(JSON.stringify({ error: 'Failed to obtain access token' }), { status: 500 });
  }
}
