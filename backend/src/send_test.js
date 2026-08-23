const nodemailer = require('nodemailer');

async function testVerboseSend() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'vsrivastava873@gmail.com',
      pass: 'tiztxgffnamwgggc'
    },
    debug: true,
    logger: true
  });

  console.log('Sending direct test email to vsrivastava2004dec@gmail.com...');
  const info = await transporter.sendMail({
    from: 'CareSync Healthcare <vsrivastava873@gmail.com>',
    to: 'vsrivastava2004dec@gmail.com',
    subject: 'CareSync: Consultation Booking Confirmation for Vikas',
    text: 'Hello Vikas,\n\nYour appointment with Dr. Rajesh Sharma has been successfully confirmed.\n\nDate: Sunday, Aug 23, 2026\nTime: 8:00 PM\nClinic: CareSync Health Management\n\nBest regards,\nCareSync Healthcare Team',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background: #fdfdfd;">
        <h2 style="color: #2E3B24; margin-top: 0;">Appointment Confirmed</h2>
        <p>Dear Vikas,</p>
        <p>Your consultation with <strong>Dr. Rajesh Sharma (Cardiologist)</strong> has been successfully booked and confirmed.</p>
        <div style="background: #F4F7F0; padding: 14px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 4px 0;"><strong>Date:</strong> Sunday, Aug 23, 2026</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> 8:00 PM</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #2E7D32; font-weight: bold;">CONFIRMED</span></p>
        </div>
        <p style="font-size: 12px; color: #777;">Please arrive 10 minutes prior to your consultation time.</p>
      </div>
    `
  });

  console.log('\n--- SMTP RESULT ---');
  console.log('Accepted by Google:', info.accepted);
  console.log('Rejected by Google:', info.rejected);
  console.log('Google Server Response:', info.response);
  console.log('Google Message ID:', info.messageId);
  process.exit(0);
}

testVerboseSend().catch((err) => {
  console.error('SMTP Error:', err);
  process.exit(1);
});
