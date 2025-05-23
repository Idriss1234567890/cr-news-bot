import fetch from 'node-fetch';

const PAGE_ACCESS_TOKEN = 'EAAWnmIoxGbYBO5C4JgZAZCLVaFpuPT9DQrVL34GMHGZAWZCycOAZBonscn354JlxaeIpZBeavWkXFKa7yqOEYrZA0BB4P9F0npcz0RoQUoYnY0XKsNLzwZCFhCqtpJ7ZCny0Rtm8LKZBBgXRNRfRKceX91cmp85dVsQeAXIAX3SKqGZAy4pQXM1LPAlSMMQhRfiwtZAr';
const PAGE_ID = '626455973878783ا';
const JSONBIN_ID = '68307e768561e97a501a911bا';
const JSONBIN_SECRET = '$2a$10$449JZDNwBY6BOxDb87K.iusKYOj2hUoN1iP0Qmf16xy4VjKrpQryu';

export default async function handler(req, res) {
  const newsUrl = 'https://cr-news-api-service.prd.crunchyrollsvc.com/v1/ar-SA/widget/topstoriesasidewidget';

  try {
    const response = await fetch(newsUrl);
    const data = await response.json();
    const latest = data.stories[0];

    const binRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
      headers: {
        'X-Master-Key': JSONBIN_SECRET
      }
    });
    const binData = await binRes.json();
    const savedUUID = binData.record.last_uuid;

    if (savedUUID === latest.uuid) {
      return res.status(200).json({ message: 'لا يوجد خبر جديد' });
    }

    await fetch(`https://graph.facebook.com/${PAGE_ID}/photos`, {
      method: 'POST',
      body: new URLSearchParams({
        url: latest.content.thumbnail.filename,
        caption: `${latest.content.headline}\n\n${latest.content.lead}`,
        access_token: PAGE_ACCESS_TOKEN
      })
    });

    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_SECRET
      },
      body: JSON.stringify({ last_uuid: latest.uuid })
    });

    res.status(200).json({ message: 'تم نشر الخبر الجديد' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ' });
  }
}