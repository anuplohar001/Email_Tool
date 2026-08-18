const nodemailer = require("nodemailer");
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return transporter;
}

async function sendEmail(to, subject, htmlBody) {
  const mailer = getTransporter();
  console.log(`[Mailer] Sending email to: ${Array.isArray(to) ? to.join(", ") : to} | subject: ${subject}`);
  await mailer.verify();
  const info = await mailer.sendMail({
    from: `"Anup Lohar" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlBody,
    attachments: [
      {
        filename: "Anup_Lohar.pdf",
        path: "./Anup_Lohar.pdf",
        contentType: "application/pdf",
      },
    ],
  });
  console.log(`[Mailer] Sent successfully. MessageId: ${info.messageId}`);
  return info;
}

module.exports = { sendEmail };
