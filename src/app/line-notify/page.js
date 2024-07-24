// */line-notify

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LineNotifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      fetchAccessToken(code, state);
    } else {
      setStatus('Error: Missing code or state');
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
        const data = await response.json();
        console.log(data.message); // 'Access Token stored successfully'
        setStatus('Authorization successful');
      } else {
        const errorData = await response.json();
        setStatus('Failed to obtain access token: ' + errorData.error);
        console.error('Failed to obtain or store access token');
      }
    } catch (error) {
      setStatus('Error: ' + error.message);
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h1>LINE Notify Authorization</h1>
      <p>{status}</p>
    </div>
  );
}

export default function LineNotifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LineNotifyContent />
    </Suspense>
  );
}