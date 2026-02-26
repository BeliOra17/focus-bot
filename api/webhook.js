export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, msg: 'Focus Bot running' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const BOT_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
  const PRO_STARS = 50;

  try {
    const update = req.body;

    // 1. /start command
    if (update.message?.text === '/start') {
      await fetch(`${BOT_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: update.message.chat.id,
          text: '🔥 Focus — твой трекер целей и привычек!\n\nНажми кнопку ниже, чтобы открыть приложение:',
          reply_markup: {
            inline_keyboard: [[{
              text: '🔥 Открыть Focus',
              web_app: { url: 'https://beliora17.github.io/focus-app/' }
            }]]
          }
        })
      });
    }

    // 2. web_app_data (buy_pro from Mini App)
    if (update.message?.web_app_data) {
      let data;
      try { data = JSON.parse(update.message.web_app_data.data); } catch(e) {}
      
      if (data?.action === 'buy_pro') {
        const chatId = update.message.chat.id;
        const r = await fetch(`${BOT_API}/createInvoiceLink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Focus PRO ⭐',
            description: 'Месяц + Финансы + Аналитика — навсегда',
            payload: `focus_pro_${chatId}_${Date.now()}`,
            currency: 'XTR',
            prices: [{ label: 'Focus PRO', amount: PRO_STARS }]
          })
        });
        const d = await r.json();

        if (d.ok) {
          await fetch(`${BOT_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `⭐ Оплатите Focus PRO (${PRO_STARS} Stars):`,
              reply_markup: {
                inline_keyboard: [[{
                  text: `⭐ Оплатить ${PRO_STARS} Stars`,
                  url: d.result
                }]]
              }
            })
          });
        }
      }
    }

    // 3. Successful payment
    if (update.message?.successful_payment) {
      const chatId = update.message.chat.id;
      await fetch(`${BOT_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ Focus PRO активирован навсегда! Откройте приложение:',
          reply_markup: {
            inline_keyboard: [[{
              text: '🔥 Открыть Focus',
              web_app: { url: 'https://beliora17.github.io/focus-app/' }
            }]]
          }
        })
      });
    }

    // 4. Pre-checkout query (required!)
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

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error:', e);
    res.status(200).json({ ok: true });
  }
}
