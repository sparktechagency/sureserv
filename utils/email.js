import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  console.log('--- Email Config Check ---');
  console.log('EMAIL_HOST:', process.env.SMTP_HOST);
  console.log('EMAIL_PORT:', process.env.SMTP_PORT);
  console.log('EMAIL_USER:', process.env.SMTP_USER);
  console.log('EMAIL_PASS (first 3 chars):', process.env.SMTP_PASS ? process.env.SMTP_PASS.substring(0, 3) : 'N/A');
  console.log('--------------------------');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure:false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: 'SureServ <noreply@sureserv.com>',
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
