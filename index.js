const express = require('express');
const app = express();
app.use(express.json());

// ⚠️ ЗАМЕНИ НА СВОЙ НОВЫЙ ТОКЕН
const BOT_TOKEN = process.env.BOT_TOKEN || 'ВСТАВЬ_НОВЫЙ_ТОКЕН';
const BOT_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const PRO_STARS = 50;

// Webhook endpoint — Telegram sends updates here
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;

    // 1. Handle /start command
    if (update.message && update.message.text === '/start') {
      await fetch(`${BOT_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: update.message.chat.id,
          text: '🔥 Focus — откройте приложение!',
          reply_markup: {
            inline_keyboard: [[{
              text: '🔥 Открыть Focus',
              web_app: { url: 'https://beliora17.github.io/focus-app/' }
            }]]
          }
        })
      });
    }

    // 2. Handle web_app_data (buy_pro request from Mini App)
    if (update.message && update.message.web_app_data) {
      const data = JSON.parse(update.message.web_app_data.data);
      if (data.action === 'buy_pro') {
        const chatId = update.message.chat.id;

        // Create invoice link
        const r = await fetch(`${BOT_API}/createInvoiceLink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Focus PRO',
            description: 'Месяц + Финансы + Аналитика — навсегда',
            payload: `focus_pro_${chatId}_${Date.now()}`,
            currency: 'XTR',
            prices: [{ label: 'Focus PRO', amount: PRO_STARS }]
          })
        });
        const d = await r.json();

        if (d.ok) {
          // Send invoice link to user
          await fetch(`${BOT_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `⭐ Оплатите Focus PRO:\n${d.result}`,
              reply_markup: {
                inline_keyboard: [[{
                  text: '⭐ Оплатить PRO',
                  url: d.result
                }]]
              }
            })
          });
        }
      }
    }

    // 3. Handle successful payment
    if (update.message && update.message.successful_payment) {
      const chatId = update.message.chat.id;
      await fetch(`${BOT_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ PRO активирован! Откройте Focus снова.',
          reply_markup: {
            inline_keyboard: [[{
              text: '🔥 Открыть Focus',
              web_app: { url: 'https://beliora17.github.io/focus-app/' }
            }]]
          }
        })
      });
    }

    // 4. Handle pre_checkout_query (required for Telegram payments)
    if (update.pre_checkout_query) {
      await fetch(`${BOT_API}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: update.pre_checkout_query.id,
          ok: true
        })
      });
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('Error:', e);
    res.sendStatus(200); // Always 200 so Telegram doesn't retry
  }
});

// Health check
app.get('/', (req, res) => res.send('Focus Bot running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot listening on port ${PORT}`));
