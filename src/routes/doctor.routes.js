const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../Config/db');
const protect = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const {
  positiveId, validDate, validTime, weekday, toUtcDate,
  slotWithinSchedule, timeToMinutes, formatLocalTime,
} = require('../utils/booking');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const doctorSelect = `
  SELECT d.id, d.user_id, u.full_name, d.specialty, d.biography, d.is_active, d.created_at
  FROM doctors d JOIN users u ON u.id = d.user_id
`;

// PUBLIC: list only active doctors.
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `${doctorSelect} WHERE d.is_active = TRUE ORDER BY d.id ASC`
    );
    return res.json({ doctors: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ADMIN: create user + doctor record in one transaction.
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  const { full_name, email, password, specialty, biography } = req.body || {};
  if (
    typeof full_name !== 'string' || !full_name.trim() || full_name.trim().length > 150 ||
    typeof email !== 'string' || !EMAIL_RE.test(email.trim()) || email.trim().length > 255 ||
    typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72 ||
    typeof specialty !== 'string' || !specialty.trim() || specialty.trim().length > 120 ||
    (biography != null && typeof biography !== 'string')
  ) {
    return res.status(400).json({ message: 'Invalid doctor data' });
  }

  let client;
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    client = await pool.connect();
    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'DOCTOR') RETURNING id, full_name, email, role`,
      [full_name.trim(), email.trim().toLowerCase(), passwordHash]
    );
    const user = userResult.rows[0];
    const doctorResult = await client.query(
      `INSERT INTO doctors (user_id, specialty, biography)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, specialty, biography, is_active`,
      [user.id, specialty.trim(), biography == null ? null : biography.trim()]
    );
    await client.query('COMMIT');
    return res.status(201).json({
      message: 'Doctor created successfully',
      doctor: { ...doctorResult.rows[0], full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(console.error);
    if (err.code === '23505') return res.status(409).json({ message: 'Email already exists' });
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// PUBLIC: doctor detail.
router.get('/:id', async (req, res) => {
  if (!positiveId(req.params.id)) return res.status(400).json({ message: 'Invalid doctor ID' });
  try {
    const result = await pool.query(
      `${doctorSelect} WHERE d.id = $1 AND d.is_active = TRUE`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Doctor not found' });
    return res.json({ doctor: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ADMIN: edit name, specialty, biography, active flag (soft delete / restore).
router.patch('/:id', protect, authorize('ADMIN'), async (req, res) => {
  if (!positiveId(req.params.id)) return res.status(400).json({ message: 'Invalid doctor ID' });
  const body = req.body || {};
  const allowed = ['full_name', 'specialty', 'biography', 'is_active'];
  const keys = Object.keys(body);
  if (!keys.length || keys.some(k => !allowed.includes(k))) {
    return res.status(400).json({ message: 'Allowed fields: full_name, specialty, biography, is_active' });
  }
  if (
    (body.full_name !== undefined && (typeof body.full_name !== 'string' || !body.full_name.trim() || body.full_name.trim().length > 150)) ||
    (body.specialty !== undefined && (typeof body.specialty !== 'string' || !body.specialty.trim() || body.specialty.trim().length > 120)) ||
    (body.biography !== undefined && body.biography !== null && typeof body.biography !== 'string') ||
    (body.is_active !== undefined && typeof body.is_active !== 'boolean')
  ) {
    return res.status(400).json({ message: 'Invalid doctor update data' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const found = await client.query('SELECT user_id FROM doctors WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!found.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Doctor not found' });
    }
    if (body.full_name !== undefined) {
      await client.query('UPDATE users SET full_name = $1 WHERE id = $2', [body.full_name.trim(), found.rows[0].user_id]);
    }
    await client.query(
      `UPDATE doctors SET
        specialty = COALESCE($1, specialty),
        biography = CASE WHEN $2::boolean THEN $3::text ELSE biography END,
        is_active = COALESCE($4, is_active)
       WHERE id = $5`,
      [body.specialty === undefined ? null : body.specialty.trim(),
       body.biography !== undefined, body.biography === undefined ? null : body.biography,
       body.is_active === undefined ? null : body.is_active, req.params.id]
    );
    const updated = await client.query(`${doctorSelect} WHERE d.id = $1`, [req.params.id]);
    await client.query('COMMIT');
    return res.json({ message: 'Doctor updated successfully', doctor: updated.rows[0] });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(console.error);
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// ADMIN: logical deactivation (preserves appointments and audit history).
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  if (!positiveId(req.params.id)) return res.status(400).json({ message: 'Invalid doctor ID' });
  try {
    const result = await pool.query(
      'UPDATE doctors SET is_active = FALSE WHERE id = $1 RETURNING id, is_active',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Doctor not found' });
    return res.json({ message: 'Doctor deactivated successfully', doctor: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUBLIC: weekly schedule. day_of_week: 0 Sunday ... 6 Saturday.
router.get('/:id/schedule', async (req, res) => {
  if (!positiveId(req.params.id)) return res.status(400).json({ message: 'Invalid doctor ID' });
  try {
    const exists = await pool.query('SELECT id FROM doctors WHERE id=$1 AND is_active=TRUE', [req.params.id]);
    if (!exists.rows.length) return res.status(404).json({ message: 'Doctor not found' });
    const result = await pool.query(
      `SELECT day_of_week, to_char(start_time, 'HH24:MI') AS start_time,
              to_char(end_time, 'HH24:MI') AS end_time
       FROM doctor_schedules WHERE doctor_id=$1 ORDER BY day_of_week`,
      [req.params.id]
    );
    return res.json({ schedule: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ADMIN or owner DOCTOR: replace weekly schedule atomically.
router.put('/:id/schedule', protect, authorize('ADMIN', 'DOCTOR'), async (req, res) => {
  if (!positiveId(req.params.id)) return res.status(400).json({ message: 'Invalid doctor ID' });
  const { schedule } = req.body || {};
  if (!Array.isArray(schedule) || schedule.length > 7 ||
      new Set(schedule.map(s => s && s.day_of_week)).size !== schedule.length ||
      schedule.some(s => !s || !Number.isInteger(s.day_of_week) ||
        s.day_of_week < 0 || s.day_of_week > 6 ||
        !validTime(s.start_time) || !validTime(s.end_time) ||
        timeToMinutes(s.end_time) - timeToMinutes(s.start_time) < 30)) {
    return res.status(400).json({ message: 'Invalid schedule: day 0-6; HH:00 or HH:30; start < end' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const doctor = await client.query('SELECT user_id FROM doctors WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!doctor.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Doctor not found' });
    }
    if (req.user.role === 'DOCTOR' && String(doctor.rows[0].user_id) !== req.user.sub) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Not your schedule' });
    }
    await client.query('DELETE FROM doctor_schedules WHERE doctor_id = $1', [req.params.id]);
    for (const s of schedule) {
      await client.query(
        `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time)
         VALUES ($1,$2,$3,$4)`,
        [req.params.id, s.day_of_week, s.start_time, s.end_time]
      );
    }
    await client.query('COMMIT');
    return res.json({ message: 'Weekly schedule saved successfully' });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(console.error);
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// PUBLIC: get bookable 30-minute time slots on a given date.
router.get('/:id/availability', async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  if (!positiveId(id) || !validDate(date)) {
    return res.status(400).json({ message: 'Use a valid doctor id and date=YYYY-MM-DD' });
  }
  try {
    const exists = await pool.query('SELECT id FROM doctors WHERE id=$1 AND is_active=TRUE', [id]);
    if (!exists.rows.length) return res.status(404).json({ message: 'Doctor not found' });
    const sc = await pool.query(
      'SELECT start_time, end_time FROM doctor_schedules WHERE doctor_id=$1 AND day_of_week=$2',
      [id, weekday(date)]
    );
    if (!sc.rows.length) return res.json({ date, time_zone: 'Europe/Istanbul', slots: [] });

    const startDay = toUtcDate(date, '00:00');
    const nextDay = new Date(startDay.getTime() + 86400000);
    const booked = await pool.query(
      `SELECT starts_at FROM appointments
       WHERE doctor_id=$1 AND starts_at >= $2 AND starts_at < $3
         AND status <> 'CANCELLED'`,
      [id, startDay, nextDay]
    );
    const unavailable = new Set(booked.rows.map(r => new Date(r.starts_at).getTime()));
    const schedule = sc.rows[0];
    const slots = [];
    for (let mins = timeToMinutes(schedule.start_time);
         mins + 30 <= timeToMinutes(schedule.end_time);
         mins += 30) {
      const time = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
      const instant = toUtcDate(date, time);
      if (instant.getTime() > Date.now() && !unavailable.has(instant.getTime())) {
        slots.push(time);
      }
    }
    return res.json({ date, time_zone: 'Europe/Istanbul', slots });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
