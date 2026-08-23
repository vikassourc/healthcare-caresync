import { format } from 'date-fns';

export function getGoogleCalendarUrl(params: {
  title: string;
  doctorName: string;
  patientName?: string;
  startTime: Date | string;
  endTime?: Date | string;
  details?: string;
}): string {
  const start = new Date(params.startTime);
  const end = params.endTime ? new Date(params.endTime) : new Date(start.getTime() + 30 * 60 * 1000);

  // Format ISO strings without hyphens and colons for Google Calendar URL (YYYYMMDDTHHmmssZ)
  const formatForGoogle = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const dates = `${formatForGoogle(start)}/${formatForGoogle(end)}`;
  const text = encodeURIComponent(params.title);
  const details = encodeURIComponent(
    params.details ||
      `Healthcare Consultation with Dr. ${params.doctorName}.\nPatient: ${params.patientName || 'Patient'}\nPlatform: CareSync Health Management System`
  );
  const location = encodeURIComponent(`CareSync Clinical Specialist Network (Dr. ${params.doctorName})`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}
