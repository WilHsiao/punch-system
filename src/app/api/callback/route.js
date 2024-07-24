// api/callback/route.js

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import axios from "axios";

// 初始化 Firebase
const requiredEnvironmentVariables = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_DATABASE_URL",
  "LINE_NOTIFY_CLIENT_ID",
  "LINE_NOTIFY_CLIENT_SECRET",
];

function initializeFirebaseAdmin() {
  const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]
  );

  if (missingEnvironmentVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`
    );
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
}

export async function POST(req) {
  initializeFirebaseAdmin();

  const { code, state } = await req.json();

  // export async function POST(req) {
  //   const { code, state, client_id } = await req.json();
  
  //   if (!clientCredentials[client_id]) {
  //     return new Response(JSON.stringify({ error: 'Invalid client ID' }), {
  //       status: 400,
  //       headers: { 'Content-Type': 'application/json' }
  //     });
  //   }
  
  //   const { client_secret, redirect_uri } = clientCredentials[client_id];

  try {
    const response = await axios.post('https://notify-bot.line.me/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_NOTIFY_REDIRECT_URI || "https://punch-system.vercel.app/line-notify",
        client_id: process.env.LINE_NOTIFY_CLIENT_ID,
        client_secret: process.env.LINE_NOTIFY_CLIENT_SECRET,
      }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
    );

    const accessToken = response.data.access_token;

    // 儲存 access token 到 Firebase，使用 state 作為 key
    const db = getDatabase();
    const ref = db.ref(`line_tokens/${state}`).push();  // 使用 push 方法生成唯一鍵
    await ref.set({
      token: accessToken,
      // client_id,
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
