import { useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function PunchSystem() {
  const router = useRouter();

  useEffect(() => {
    const { code, state } = router.query;

    if (code && state) {
      // 發送請求到後端 API 獲取 Access Token
      fetchAccessToken(code, state);
    }
  }, [router.query]);

  const fetchAccessToken = async (code, state) => {
    try {
      const response = await fetch('/api/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (response.ok) {
        console.log('Access token obtained successfully');
      } else {
        console.error('Failed to obtain access token');
      }
    } catch (error) {
      console.error('Error fetching access token:', error);
    }
  };

  return (
    <div>
      <h1>LINE Notify Authorization</h1>
      <p>Processing...</p>
    </div>
  );
}
