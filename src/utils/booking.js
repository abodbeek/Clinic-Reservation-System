// Version 1: fixed 30-minute slots. Istanbul has UTC+03:00 year-round.
const CLINIC_TZ_OFFSET = "+03:00";

function positiveId(value) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value);
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):(00|30)$/.test(value);
}

function weekday(dateStr) {
  // Sunday = 0, Monday = 1, ..., Saturday = 6
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

function timeToMinutes(value) {
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  return 60 * hour + minute;
}

function toUtcDate(date, time) {
  return new Date(`${date}T${time}:00${CLINIC_TZ_OFFSET}`);
}

function slotWithinSchedule(time, schedule) {
  const start = timeToMinutes(time);
  return (
    start >= timeToMinutes(schedule.start_time) &&
    start + 30 <= timeToMinutes(schedule.end_time)
  );
}

function formatLocalTime(time) {
  return time.slice(0, 5);
}

module.exports = {
  positiveId,
  validDate,
  validTime,
  weekday,
  timeToMinutes,
  toUtcDate,
  slotWithinSchedule,
  formatLocalTime,
};
