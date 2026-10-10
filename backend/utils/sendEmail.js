const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;

  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If custom SMTP credentials (Brevo) are provided in .env
  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    // Ethereal test account for localhost development fallback
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const message = {
    from: `"${process.env.FROM_NAME || 'Student Task Planner'}" <${process.env.EMAIL_FROM || user || 'kentfloyd02@gmail.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  const info = await transporter.sendMail(message);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`\n======================================================`);
    console.log(`[Email Preview URL] View test email in browser:`);
    console.log(previewUrl);
    console.log(`======================================================\n`);
  }

  return { info, previewUrl };
};

module.exports = sendEmail;
