import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message, token } = req.body;

    try {
      const response = await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        body: `message=${encodeURIComponent(message)}`
      });

      if (!response.ok) {
        throw new Error('發送 Line Notify 失敗');
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('發送 Line Notify 時出錯:', error);
      res.status(500).json({ error: '發送 Line Notify 失敗' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}