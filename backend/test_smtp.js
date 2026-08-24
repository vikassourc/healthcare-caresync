const nodemailer = require('nodemailer');

async function testSMTP() {
  const smtpUser = 'vsrivastava873@gmail.com';
  const smtpPass = 'tiztxgffnamwgggc';

  console.log('Testing SMTP connection with Gmail...');
  console.log('User:', smtpUser);
  console.log('Pass:', smtpPass.substring(0, 4) + '****');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  try {
    const verified = await transporter.verify();
    console.log('\n✅ SMTP CONNECTION VERIFIED:', verified);
  } catch (err) {
    console.log('\n❌ SMTP CONNECTION FAILED:', err.message);
    console.log('Full error:', JSON.stringify(err, null, 2));
    return;
  }

  // Try sending a real test email
  try {
    const info = await transporter.sendMail({
      from: 'CareSync Healthcare <vsrivastava873@gmail.com>',
      to: 'vsrivastava2004dec@gmail.com',
      subject: 'CareSync Email Test - ' + new Date().toISOString(),
      html: '<h2>Email system test</h2><p>If you receive this, SMTP is working fine from your local machine.</p>'
    });
    console.log('\n✅ TEST EMAIL SENT:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.log('\n❌ SEND FAILED:', err.message);
    console.log('Error code:', err.code);
    console.log('Full error:', JSON.stringify(err, null, 2));
  }

  transporter.close();
}

testSMTP();
