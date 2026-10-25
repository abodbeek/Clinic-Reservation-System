require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./Config/db');
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
const appointmentRoutes = require('./routes/appointment.routes');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const origins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',').map(value => value.trim()).filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: '100kb' }));
app.get('/', (_req, res) => res.json({ message: 'Clinic Reservation API is running' }));
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (_err) {
    return res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
});
async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET to a random string of at least 32 characters in .env');
  }
  if (typeof process.env.DB_PASSWORD !== 'string') {
    throw new Error('DB_PASSWORD must be set in .env');
  }
  await pool.query('SELECT 1');
  console.log('PostgreSQL connected successfully');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
if (require.main === module) {
  startServer().catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
}
module.exports = app;
