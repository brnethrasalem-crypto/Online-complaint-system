const mongoose = require('mongoose');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split(/\r?\n/).reduce((acc, line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) acc[m[1]] = m[2];
  return acc;
}, {});
const uri = env.MONGO_URI;
console.log('URI sample:', uri.replace(/:[^:@]+@/, '****@'));
(async () => {
  try {
    await mongoose.connect(uri, {
      dbName: 'grievance-management',
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('CONNECTED');
    await mongoose.connection.close();
  } catch (err) {
    console.error('ERROR MESSAGE:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
