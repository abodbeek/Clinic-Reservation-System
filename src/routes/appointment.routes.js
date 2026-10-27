const express = require("express");
const pool = require("../Config/db");
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
  positiveId,
  validDate,
  validTime,
  weekday,
  toUtcDate,
  slotWithinSchedule,
} = require("../utils/booking");

const router = express.Router();

// Shared appointment query
const appointmentSelect = `
  SELECT
    a.id,
    a.doctor_id,
    a.patient_id,
    a.starts_at,
    a.status,
    a.reason,
    a.contact_phone,
    a.created_at,
    doctor_user.full_name AS doctor_name,
    patient_user.full_name AS patient_name
  FROM appointments a
  JOIN doctors d ON d.id = a.doctor_id
  JOIN users doctor_user ON doctor_user.id = d.user_id
  JOIN users patient_user ON patient_user.id = a.patient_id
`;

// ========================================
// PATIENT - Create Appointment
// POST /api/appointments
// ========================================

router.post("/", protect, authorize("PATIENT"), async (req, res) => {
  const { doctor_id, date, time, reason, contact_phone } = req.body || {};

  // Validate appointment data
  if (
    !positiveId(String(doctor_id ?? "")) ||
    !validDate(date) ||
    !validTime(time) ||
    (reason != null && (typeof reason !== "string" || reason.length > 300)) ||
    typeof contact_phone !== "string" ||
    !/^[0-9+()\s-]{10,25}$/.test(contact_phone.trim())
  ) {
    return res.status(400).json({
      message: "Invalid appointment data",
    });
  }

  // Convert Istanbul date/time to UTC
  const start = toUtcDate(date, time);

  // Prevent past appointments
  if (start.getTime() <= Date.now()) {
    return res.status(400).json({
      message: "Appointment must be in the future",
    });
  }

  let client;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    // Check doctor availability
    const doctor = await client.query(
      `SELECT id
         FROM doctors
         WHERE id = $1
         AND is_active = TRUE
         FOR SHARE`,
      [doctor_id],
    );

    if (!doctor.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Doctor not found or inactive",
      });
    }

    // Get doctor's working hours
    const schedule = await client.query(
      `SELECT start_time, end_time
         FROM doctor_schedules
         WHERE doctor_id = $1
         AND day_of_week = $2`,
      [doctor_id, weekday(date)],
    );

    // Check whether slot is within schedule
    if (!schedule.rows.length || !slotWithinSchedule(time, schedule.rows[0])) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Time is outside doctor working hours",
      });
    }

    // Create appointment with patient phone
    const result = await client.query(
      `INSERT INTO appointments (
          doctor_id,
          patient_id,
          starts_at,
          reason,
          contact_phone
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          doctor_id,
          patient_id,
          starts_at,
          status,
          reason,
          contact_phone,
          created_at`,
      [
        doctor_id,
        req.user.sub,
        start,
        reason == null ? null : reason.trim(),
        contact_phone.trim(),
      ],
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment: result.rows[0],
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(console.error);
    }

    // Prevent duplicate appointments
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This time slot is already booked",
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// ========================================
// PATIENT - Get My Appointments
// GET /api/appointments/me
// ========================================

router.get("/me", protect, authorize("PATIENT"), async (req, res) => {
  try {
    const result = await pool.query(
      `${appointmentSelect}
         WHERE a.patient_id = $1
         ORDER BY a.starts_at DESC`,
      [req.user.sub],
    );

    return res.status(200).json({
      appointments: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// ========================================
// DOCTOR - Get My Appointments
// GET /api/appointments/doctor
// ========================================

router.get("/doctor", protect, authorize("DOCTOR"), async (req, res) => {
  try {
    const result = await pool.query(
      `${appointmentSelect}
         WHERE d.user_id = $1
         ORDER BY a.starts_at ASC`,
      [req.user.sub],
    );

    return res.status(200).json({
      appointments: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// ========================================
// ADMIN - Get All Appointments
// GET /api/appointments
// ========================================

router.get("/", protect, authorize("ADMIN"), async (req, res) => {
  try {
    const result = await pool.query(
      `${appointmentSelect}
         ORDER BY a.starts_at DESC
         LIMIT 500`,
    );

    return res.status(200).json({
      appointments: result.rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// ========================================
// PATIENT / ADMIN - Cancel Appointment
// PATCH /api/appointments/:id/cancel
// ========================================

router.patch(
  "/:id/cancel",
  protect,
  authorize("PATIENT", "ADMIN"),
  async (req, res) => {
    if (!positiveId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    try {
      const result = await pool.query(
        `UPDATE appointments
         SET status = 'CANCELLED'
         WHERE id = $1
         AND status = 'BOOKED'
         AND (
           $2::boolean
           OR patient_id = $3
         )
         RETURNING id, status`,
        [req.params.id, req.user.role === "ADMIN", req.user.sub],
      );

      if (!result.rows.length) {
        return res.status(404).json({
          message: "Booked appointment not found or not yours",
        });
      }

      return res.status(200).json({
        message: "Appointment cancelled",
        appointment: result.rows[0],
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

// ========================================
// DOCTOR / ADMIN - Complete Appointment
// PATCH /api/appointments/:id/complete
// ========================================

router.patch(
  "/:id/complete",
  protect,
  authorize("DOCTOR", "ADMIN"),
  async (req, res) => {
    if (!positiveId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    try {
      const result = await pool.query(
        `UPDATE appointments a
         SET status = 'COMPLETED'
         FROM doctors d
         WHERE a.id = $1
         AND a.doctor_id = d.id
         AND a.status = 'BOOKED'
         AND (
           $2::boolean
           OR d.user_id = $3
         )
         RETURNING a.id, a.status`,
        [req.params.id, req.user.role === "ADMIN", req.user.sub],
      );

      if (!result.rows.length) {
        return res.status(404).json({
          message: "Booked appointment not found or not assigned to you",
        });
      }

      return res.status(200).json({
        message: "Appointment completed",
        appointment: result.rows[0],
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

module.exports = router;
