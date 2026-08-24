const mongoose = require('mongoose');

async function diagnoseEmails() {
  const uri = 'mongodb+srv://vsrivastava873_db_user:VikasMongo123@cluster0.zhxe831.mongodb.net/017?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const apptSchema = new mongoose.Schema({}, { strict: false });
  const notifSchema = new mongoose.Schema({}, { strict: false });
  const userSchema = new mongoose.Schema({}, { strict: false });

  const Appointment = mongoose.model('Appointment', apptSchema, 'appointments');
  const NotificationLog = mongoose.model('NotificationLog', notifSchema, 'notificationlogs');
  const User = mongoose.model('User', userSchema, 'users');

  // Last 5 appointments
  const recentAppts = await Appointment.find().sort({ createdAt: -1 }).limit(5);
  console.log('\n=== LAST 5 APPOINTMENTS ===');
  for (const a of recentAppts) {
    const pat = await User.findById(a.patientId);
    const doc = await User.findById(a.doctorId);
    console.log(JSON.stringify({
      id: a._id.toString(),
      status: a.status,
      slotTime: a.slotStartTime,
      patient: pat ? (pat.firstName + ' ' + pat.lastName + ' <' + pat.email + '>') : 'UNKNOWN',
      doctor: doc ? ('Dr. ' + doc.firstName + ' ' + doc.lastName + ' <' + doc.email + '>') : 'UNKNOWN',
      createdAt: a.createdAt
    }, null, 2));
  }

  // Last 10 notification logs
  const recentLogs = await NotificationLog.find().sort({ createdAt: -1 }).limit(10);
  console.log('\n=== LAST 10 NOTIFICATION LOGS ===');
  for (const n of recentLogs) {
    const user = await User.findById(n.recipientId);
    console.log(JSON.stringify({
      id: n._id.toString(),
      recipient: user ? user.email : String(n.recipientId),
      type: n.type,
      subject: n.subject,
      status: n.status,
      retryCount: n.retryCount,
      errorMessage: n.errorMessage || 'none',
      lastAttemptAt: n.lastAttemptAt,
      createdAt: n.createdAt
    }, null, 2));
  }

  // Count by status
  const counts = await NotificationLog.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  console.log('\n=== NOTIFICATION STATUS COUNTS ===');
  console.log(JSON.stringify(counts, null, 2));

  await mongoose.disconnect();
}
diagnoseEmails().catch(e => console.error('Error:', e));
