const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, phone, message } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
      user: process.env.YANDEX_EMAIL,
      pass: process.env.YANDEX_PASSWORD,
    },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #4F46E5; margin-top: 0;">Новая заявка на 8POINTS</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666; width: 140px;">Имя</td><td style="padding: 8px 0; font-weight: bold;">${name}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;">${email}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Телефон</td><td style="padding: 8px 0;">${phone}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Компания</td><td style="padding: 8px 0;">${company || '—'}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Сообщение</td><td style="padding: 8px 0;">${message || '—'}</td></tr>
      </table>
      <p style="margin-top: 24px; font-size: 12px; color: #999;">Заявка получена с сайта 8points.site</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"8POINTS Сайт" <${process.env.YANDEX_EMAIL}>`,
      to: process.env.YANDEX_EMAIL,
      subject: `Новая заявка от ${name}`,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
