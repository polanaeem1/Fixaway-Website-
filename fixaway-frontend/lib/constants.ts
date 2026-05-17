// Shared UI constants — single source of truth

export const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  QUOTED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  TECHNICIAN_EN_ROUTE: 'bg-indigo-100 text-indigo-700',
};

export const serviceIcons: Record<string, string> = {
  Plumbing: 'plumbing',
  Electrical: 'bolt',
  'AC Maintenance': 'ac_unit',
  Carpentry: 'carpenter',
  Painting: 'format_paint',
  Roadside: 'car_repair',
  ROADSIDE: 'car_repair',
  HOME: 'home_repair_service',
};

export const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  QUOTED: 'Quoted',
  CONFIRMED: 'Confirmed',
  TECHNICIAN_EN_ROUTE: 'On the Way',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
