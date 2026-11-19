const ejs = require('ejs');
const nodemailer = require('nodemailer');
const path = require('path');

const sendVerificationCode = async (user, verificationCode) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY
    }
  });

  const html = await ejs.renderFile(
    path.join(__dirname, '../../views/verificationEmail.ejs'),
    { firstName: user.firstName, verificationCode }
  );

  await transporter.sendMail({
    from: process.env.BREVO_Email,
    to: user.email,
    subject: 'Verify your Airbnb account',
    html
  });
};


module.exports = { sendVerificationCode };
