const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, phone, message } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const isChecklist = company === 'Скачал чек-лист';

  const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
      user: process.env.YANDEX_EMAIL,
      pass: process.env.YANDEX_PASSWORD,
    },
  });

  const ownerHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #4F46E5; margin-top: 0;">${isChecklist ? 'Запрос чек-листа' : 'Новая заявка на 8POINTS'}</h2>
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

  const userHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 32px; background: #f9f9f9; border-radius: 12px;">
      <h2 style="color: #4F46E5; margin-top: 0;">Ваш чек-лист готов!</h2>
      <p style="color: #333; line-height: 1.6;">Здравствуйте, ${name}!</p>
      <p style="color: #333; line-height: 1.6;">Во вложении к этому письму — <strong>«Чек-лист: 10 скрытых проблем бизнеса»</strong>.</p>
      <p style="color: #333; line-height: 1.6;">Этот чек-лист поможет вам понять, где ваш бизнес теряет до 30% прибыли. Пройдитесь по каждому пункту — это займёт не больше 15 минут.</p>
      <p style="color: #555; line-height: 1.6; margin-top: 24px;">Если по итогам захотите разобраться глубже — я готова провести диагностику лично.</p>
      <p style="color: #333; margin-top: 24px;"><strong>Наталия Акинина</strong><br>8 ПОИНТС — диагностика бизнес-процессов<br><a href="tel:+79528121977" style="color: #4F46E5;">+7 (952) 812-19-77</a><br><a href="https://8points.site" style="color: #4F46E5;">8points.site</a></p>
    </div>
  `;

  try {
    // Уведомление владельцу
    await transporter.sendMail({
      from: `"8POINTS Сайт" <${process.env.YANDEX_EMAIL}>`,
      to: process.env.YANDEX_EMAIL,
      subject: isChecklist ? `Запрос чек-листа от ${name}` : `Новая заявка от ${name}`,
      html: ownerHtml,
    });

    // Письмо с PDF пользователю (только для запроса чек-листа)
    if (isChecklist) {
      let attachments = [];
      try {
        const pdfPath = path.join(process.cwd(), 'checklist.pdf');
        const pdfBuffer = fs.readFileSync(pdfPath);
        attachments = [{
          filename: 'Чек-лист 8ПОИНТС.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        }];
      } catch (e) {
        console.error('PDF read error:', e);
      }

      await transporter.sendMail({
        from: `"Наталия Акинина | 8ПОИНТС" <${process.env.YANDEX_EMAIL}>`,
        to: email,
        subject: 'Чек-лист: 10 скрытых проблем бизнеса',
        html: userHtml,
        attachments,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
