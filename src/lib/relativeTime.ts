export function daysAgoLabel(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  if (days === 0) return "convidado hoje";
  if (days === 1) return "convidado há 1 dia";
  return `convidado há ${days} dias`;
}
