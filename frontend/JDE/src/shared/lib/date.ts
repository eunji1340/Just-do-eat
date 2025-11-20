const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const pad = (value: number) => value.toString().padStart(2, "0");

export function formatPlanDate(dateISO: string): string {
  if (!dateISO) return "";
  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const weekday = WEEKDAYS[date.getDay()];

  return `${year}.${month}.${day}(${weekday})`;
}

