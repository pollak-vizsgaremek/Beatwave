const formatRelative = (date: Date) => {
  const now = new Date();
  const posted = new Date(date);
  const diff = (posted.getTime() - now.getTime()) / 1000; // seconds

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const minutes = Math.round(diff / 60);
  const hours = Math.round(diff / 3600);
  const days = Math.round(diff / 86400);

  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  return new Date(posted).toLocaleDateString("sv-SE");
};

export default formatRelative;