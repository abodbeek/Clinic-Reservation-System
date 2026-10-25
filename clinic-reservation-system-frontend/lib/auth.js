// Training MVP: sessionStorage keeps the token in this browser tab/session.
// For production with real patient data, use secure HttpOnly cookies + CSRF protection.
const KEY = 'clinic_auth';
export function getSession() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); }
  catch (_error) { return null; }
}
export function saveSession(token, user) {
  sessionStorage.setItem(KEY, JSON.stringify({ token, user }));
  window.dispatchEvent(new Event('clinic-auth-change'));
}
export function clearSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event('clinic-auth-change'));
}
