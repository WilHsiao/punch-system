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
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
        <h1 className="text-2xl font-bold">
          {status === 'Processing' && 'Processing Line Notify Authorization...'}
          {status === 'Authorization successful' && 'Line Notify 授權成功！'}
          {status.startsWith('Error:') && 'Line Notify 授權失敗'}
          {status.startsWith('Failed') && 'Line Notify 授權失敗'}
        </h1>
        {(status.startsWith('Error:') || status.startsWith('Failed')) && (
          <p className="mt-4 text-red-500">{status}</p>
        )}
      </div>
    </div>
  );
}

export default function LineNotifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
          <h1 className="text-2xl font-bold">載入中...</h1>
        </div>
      </div>
    }>
      <LineNotifyContent />
    </Suspense>
  );
}