import crypto from 'crypto';
import { IWorkingHours, SlotInfo } from '../types';

export function generateIdempotencyKey(type: string, ...parts: string[]): string {
  const payload = [type, ...parts].join(':');
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function safeParseJSON<T>(text: string): T | null {
  try {
    const cleaned = text
      .replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }
}

export function isWithinWorkingHours(date: Date, workingHours?: IWorkingHours): boolean {
  if (!workingHours) return true;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[date.getUTCDay()];
  const hours = workingHours[dayName] || { start: '08:00', end: '20:00' };

  const [startH, startM] = hours.start.split(':').map(Number);
  const [endH, endM] = hours.end.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const currentMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function generateSlots(
  targetDate: Date,
  workingHours?: IWorkingHours,
  durationMinutes: number = 30
): SlotInfo[] {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[targetDate.getUTCDay()];
  const hours = workingHours?.[dayName] || { start: '09:00', end: '18:00' };

  const [startH, startM] = hours.start.split(':').map(Number);
  const [endH, endM] = hours.end.split(':').map(Number);

  const slots: SlotInfo[] = [];
  const year = targetDate.getUTCFullYear();
  const month = targetDate.getUTCMonth();
  const day = targetDate.getUTCDate();

  let currentStartMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentStartMinutes + durationMinutes <= endMinutes) {
    const slotH = Math.floor(currentStartMinutes / 60);
    const slotM = currentStartMinutes % 60;
    const startTime = new Date(Date.UTC(year, month, day, slotH, slotM, 0, 0));

    const endHCalc = Math.floor((currentStartMinutes + durationMinutes) / 60);
    const endMCalc = (currentStartMinutes + durationMinutes) % 60;
    const endTime = new Date(Date.UTC(year, month, day, endHCalc, endMCalc, 0, 0));

    slots.push({
      startTime,
      endTime,
      available: true
    });

    currentStartMinutes += durationMinutes;
  }

  return slots;
}

export function formatDateForDisplay(date: Date, timezone: string = 'Asia/Kolkata'): string {
  try {
    return date.toLocaleString('en-IN', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}
