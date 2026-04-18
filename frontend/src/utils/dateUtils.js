import { format, formatDistanceToNow, startOfWeek, subDays, eachDayOfInterval } from 'date-fns';

export const formatDate = (date) => format(new Date(date), 'MMM d, yyyy');
export const formatDateTime = (date) => format(new Date(date), 'MMM d, yyyy h:mm a');
export const formatShortDate = (date) => format(new Date(date), 'MMM d');
export const formatTimeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const getWeekStart = (date = new Date()) => {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
};

export const getLast365Days = () => {
  const end = new Date();
  const start = subDays(end, 364);
  return eachDayOfInterval({ start, end });
};

export const getDayName = (dayIndex) => {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
};

export const getMonthName = (monthIndex) => {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex];
};

export const formatHour = (hour) => {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
};
