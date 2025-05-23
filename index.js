import fetch from 'node-fetch';

const PAGE_ACCESS_TOKEN = 'EAAWnmIoxGbYBO5C4JgZAZCLVaFpuPT9DQrVL34GMHGZAWZCycOAZBonscn354JlxaeIpZBeavWkXFKa7yqOEYrZA0BB4P9F0npcz0RoQUoYnY0XKsNLzwZCFhCqtpJ7ZCny0Rtm8LKZBBgXRNRfRKceX91cmp85dVsQeAXIAX3SKqGZAy4pQXM1LPAlSMMQhRfiwtZAr';
const PAGE_ID = '626455973878783ا';
const JSONBIN_ID = '68307e768561e97a501a911bا';
const JSONBIN_SECRET = '$2a$10$449JZDNwBY6BOxDb87K.iusKYOj2hUoN1iP0Qmf16xy4VjKrpQryu';
export default async function handler(req, res) {
  try {
    // جلب الخبر الأخير من Crunchyroll
    const response = await fetch('https://cr-news-api-service.prd.crunchyrollsvc.com/v1/ar-SA/widget/topstoriesasidewidget');
    const data = await response.json();
    const latestNews = data.stories?.[0];

    if (!latestNews) throw new Error('لم يتم العثور على خبر');

    // جلب uuid الأخير من JSONBin
    const jsonbinRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_SECRET }
    });
    const json = await jsonbinRes.json();
    const last_uuid = json?.record?.last_uuid || '';

    // تحقق إن كان الخبر جديدًا
    if (latestNews.uuid === last_uuid) {
      return res.status(200).json({ message: 'لا يوجد خبر جديد' });
    }

    // إرسال الخبر إلى الصفحة
    const message = {
      messaging_type: 'UPDATE',
      recipient: { id: PAGE_ID },
      message: {
        attachment: {
          type: 'image',
          payload: {
            url: latestNews.content.thumbnail.filename,
            is_reusable: true
          }
        }
      }
    };

    // إرسال الصورة
    await fetch(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    // إرسال النص
    await fetch(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: PAGE_ID },
        message: {
          text: `${latestNews.content.headline}\n\n${latestNews.content.lead}`
        }
      })
    });

    // تحديث uuid في JSONBin
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_SECRET
      },
      body: JSON.stringify({ last_uuid: latestNews.uuid })
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ' });
  }
}
