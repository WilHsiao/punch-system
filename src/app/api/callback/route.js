// api/callback/route.js

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import axios from 'axios';

// 初始化 Firebase
const firebaseConfig = {
  credential: cert({
    projectId: 'time-clock-system-da745',
    clientEmail: 'firebase-adminsdk-8tqiz@time-clock-system-da745.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7geZW0ilNZkfO\nYwqIXsqV+4Iubnb8agi+LXLS3m9L4dMEZrdshJ5z2+whhIITvyrVj9/OpxC3+y17\nPFiYsMfio2MsTPZRp8YGuflnxu2WQGMz6I4lAilg19VUQ9FD88sZz7A65oqaGJ2H\nJvnyz9CgW+7KDZ1d1u06MfPixZT/dfXLlaVg2fKlmS7HHp5PEDBVqSYwP5VqdpPq\ncp3yEdAPipDhUrlrEWtWioTeIgujC6MZmYTqHpLkwU4dxv5VAOUoOc1agFJ/T7aa\ndXYW4QXbhBDq7EvZKh3bDIjx24CYUtWLKiJ/T0GGO4APTiT/ZzG+ryPgIcA6YH8s\nWUtHt3RtAgMBAAECggEAQiE+pOkq8ua7NXFdshnIVhwlXg3MfhpBah0qTW9wjjEf\nVIKLd0TQg2kRPwL2Q1OdHkPHOaFXNqPp9vgiAPv8CxT3sZSVHNhQcWfeq7iPa3na\n4uBGXYwFHugQD095uv785uYGL8fGIzHCQPvAlF+xoxS5Q16I3SMjeG5MpvJrKasM\nMuv37aRinkXKlLe/nUYivJJHmUsiGGJyl68+w8O4zlF5g15fpwlC+ISQHG/g1Tqi\nMV5ly2AxwXU5eVN1I6xaIurPjJh62m2qa5XZKfSfvnu0BO+FVXyva4+5Sj2V9NXh\nUmSwEGwuPaTFZHND0d2MCqFUFp90PEjrfE4VIueXCwKBgQDq0SjMyCeiCjKfOncd\nIaKrbRUhzrRqeUq419AeIwb2qAtpITV6mozftqSnUqf9Xc84xH/A3W1/WA6b509y\nkvW2FmdGgzbXEAqjzJNgC16Cj82LoieCeimsWYY3ZKY0NLvYqodFv8On/6pJXw75\nYX+UesZHGs1Qf1mWYJalv3i4IwKBgQDMbC1W165XYMy4RPlI0tpVQhqAu8fs1wmc\nFVg27haC4T58VRWvmDnfV+Nr+UsRvdRWTrE7FsmTFHh+YhK09saLOP970lSO+peB\nsTA5FG8HQzDUl0BP0HkN2VIevH9jO9LzSGewv5vrBe7aeBXVJCfdrhbJIk4TMgG+\nu7G09JMiLwKBgQCzfvkyONpa+nKh1v5QjXKcmgDqW+j77wXYcFhNgTcEe4ZlcZZA\nxz1ikWoh4YQ6oGgUG9kQY/McwgJA2LuZeI9NBqkhdJIKKeAIQAx0AZzYLvbPgz+y\ndJHAhpqbY1vNUnY5dHl9Ls5wcHYKKhj3Nrlglc1Vcz55BzBDTEg8ITY1gwKBgQC5\nBjjLX5BHOjBRoOxZA6/md1xxpIVCUyg5hABCR6FMeP8Lnh9wvcGz62LGue8+cakd\nLUCxEOEGJQMisTXpYWs3XDGyKx+qAhrbojrZjysnUaOC6BunojPPWyI++7H5aY53\n8NMZYXSIduhICWUJdB45QXcSOeCc8ygtMMmZ1bzOtQKBgD5BgL9+SBLBzWppeyq0\nLsGwC4zFabmAoJ6nYp/K7rmCXs9d4+83muMoFvIReQYRghYJRg+0ICAVgsUkldeY\nHOvu5MO/Qs2aNu5S8mFKmpQkqNHpivCmj3o2grPaewEgrU+vlYIg0cJHC0wYtzlb\nZHRSyRZsP+XY3uTs4KolHPL+\n-----END PRIVATE KEY-----\n',
  }),
  databaseURL: 'https://time-clock-system-da745-default-rtdb.firebaseio.com'
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

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
    
    // 存儲 access token 到 Firebase，使用 state 作為 key
    const db = getDatabase();
    const ref = db.ref(`line_tokens/${state}`).push();  // 使用 push 方法生成唯一鍵
    await ref.set({
      token: accessToken,
      createdAt: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
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