export const formatTime = (seconds: number): string => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const formattedDays = days > 0 ? `${days}d ` : '';
  const formattedHours = hours > 0 ? `${hours}h ` : '';
  const formattedMinutes = minutes > 0 ? `${minutes}m ` : '';
  const formattedSeconds = `${remainingSeconds}s`;

  return `${formattedDays}${formattedHours}${formattedMinutes}${formattedSeconds}`.trim();
};
