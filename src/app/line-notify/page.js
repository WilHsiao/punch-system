import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LineNotifyCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      fetchAccessToken(code, state);
    }
  }, [searchParams]);

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
        // 這裡可以添加成功後的處理邏輯
      } else {
        console.error('Failed to obtain access token');
        // 這裡可以添加失敗後的處理邏輯
      }
    } catch (error) {
      console.error('Error fetching access token:', error);
      // 這裡可以添加錯誤處理邏輯
    }
  };

  return (
    <div>
      <h1>LINE Notify Authorization</h1>
      <p>Processing...</p>
    </div>
  );
}