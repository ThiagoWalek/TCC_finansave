function startOfMonth(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

function endOfMonth(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0); // last day of previous month
  return d;
}

function diffInDays(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

module.exports = { startOfMonth, endOfMonth, diffInDays };