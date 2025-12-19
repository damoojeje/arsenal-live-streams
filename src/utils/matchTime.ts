/**
 * Match Time Utilities
 *
 * Handles time parsing and match expiration logic for DaddyLive match data.
 * DaddyLive provides times in GMT format (e.g., "14:30", "LIVE", "TBD")
 */

export interface MatchTimeInfo {
  isLive: boolean;
  isTBD: boolean;
  isExpired: boolean;
  minutesSinceMatchEnd: number | null;
  parsedTime: Date | null;
}

/**
 * Parse DaddyLive time format and determine match status
 *
 * @param timeString - Time from DaddyLive API (e.g., "14:30", "LIVE", "TBD")
 * @param currentDate - Current date/time (defaults to now, injectable for testing)
 * @param matchDurationMinutes - Typical match duration in minutes (default: 120 for soccer)
 * @param expirationHours - Hours after match ends before hiding it (default: 4)
 * @returns MatchTimeInfo object with parsed time and status
 */
export function parseMatchTime(
  timeString: string | undefined,
  currentDate: Date = new Date(),
  matchDurationMinutes: number = 120, // 90 min + 30 min extra time/delays
  expirationHours: number = 2 // Drop matches 2 hours after they start (match duration considered)
): MatchTimeInfo {
  // Handle missing time
  if (!timeString) {
    return {
      isLive: false,
      isTBD: true,
      isExpired: false,
      minutesSinceMatchEnd: null,
      parsedTime: null,
    };
  }

  const timeLower = timeString.toLowerCase().trim();

  // Handle LIVE matches (never expire)
  if (timeLower === 'live') {
    return {
      isLive: true,
      isTBD: false,
      isExpired: false,
      minutesSinceMatchEnd: null,
      parsedTime: null,
    };
  }

  // Handle TBD matches (never expire)
  if (timeLower === 'tbd' || timeLower === 'to be determined') {
    return {
      isLive: false,
      isTBD: true,
      isExpired: false,
      minutesSinceMatchEnd: null,
      parsedTime: null,
    };
  }

  // Parse HH:mm format (GMT timezone)
  const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    // Invalid format - treat as TBD
    return {
      isLive: false,
      isTBD: true,
      isExpired: false,
      minutesSinceMatchEnd: null,
      parsedTime: null,
    };
  }

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);

  // Validate time
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return {
      isLive: false,
      isTBD: true,
      isExpired: false,
      minutesSinceMatchEnd: null,
      parsedTime: null,
    };
  }

  // Create Date object for match start time (GMT timezone)
  // Assume match is today unless it's in the past by more than 12 hours (then it's tomorrow)
  const matchDate = new Date(currentDate);
  matchDate.setUTCHours(hours, minutes, 0, 0);

  // If match time is more than 12 hours in the past, assume it's tomorrow
  const hoursDiff = (currentDate.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
  if (hoursDiff > 12) {
    matchDate.setUTCDate(matchDate.getUTCDate() + 1);
  }

  // Calculate match end time
  const matchEndTime = new Date(matchDate.getTime() + matchDurationMinutes * 60 * 1000);

  // Calculate minutes since match ended
  const minutesSinceEnd = (currentDate.getTime() - matchEndTime.getTime()) / (1000 * 60);

  // Match is expired if it ended more than expirationHours ago
  const isExpired = minutesSinceEnd > (expirationHours * 60);

  return {
    isLive: false,
    isTBD: false,
    isExpired,
    minutesSinceMatchEnd: minutesSinceEnd,
    parsedTime: matchDate,
  };
}

/**
 * Filter matches to remove expired ones
 *
 * @param matches - Array of matches to filter
 * @param currentDate - Current date/time (defaults to now, injectable for testing)
 * @returns Filtered array with only current/upcoming matches
 */
export function filterExpiredMatches<T extends { time?: string }>(
  matches: T[],
  currentDate: Date = new Date()
): T[] {
  return matches.filter(match => {
    const timeInfo = parseMatchTime(match.time, currentDate);

    // Keep LIVE matches always
    if (timeInfo.isLive) return true;

    // Keep TBD matches always
    if (timeInfo.isTBD) return true;

    // Keep non-expired matches
    return !timeInfo.isExpired;
  });
}

/**
 * Sort matches by time (LIVE first, then by start time, TBD last)
 *
 * @param matches - Array of matches to sort
 * @returns Sorted array (does not mutate original)
 */
export function sortMatchesByTime<T extends { time?: string }>(matches: T[]): T[] {
  return [...matches].sort((a, b) => {
    const aInfo = parseMatchTime(a.time);
    const bInfo = parseMatchTime(b.time);

    // LIVE matches always first
    if (aInfo.isLive && !bInfo.isLive) return -1;
    if (!aInfo.isLive && bInfo.isLive) return 1;

    // TBD matches always last
    if (aInfo.isTBD && !bInfo.isTBD) return 1;
    if (!aInfo.isTBD && bInfo.isTBD) return -1;

    // Sort by parsed time
    if (aInfo.parsedTime && bInfo.parsedTime) {
      return aInfo.parsedTime.getTime() - bInfo.parsedTime.getTime();
    }

    // Fallback to string comparison
    return (a.time || '').localeCompare(b.time || '');
  });
}

/**
 * Get human-readable time status for a match
 *
 * @param timeString - Time from DaddyLive API
 * @param currentDate - Current date/time (defaults to now)
 * @returns Human-readable status string
 */
export function getMatchTimeStatus(
  timeString: string | undefined,
  currentDate: Date = new Date()
): string {
  const info = parseMatchTime(timeString, currentDate);

  if (info.isLive) {
    return '🔴 LIVE NOW';
  }

  if (info.isTBD) {
    return 'Time TBD';
  }

  if (info.isExpired) {
    return '⏱️ Match Ended';
  }

  if (!info.parsedTime) {
    return timeString || 'Unknown';
  }

  // Calculate time until match starts
  const minutesUntilStart = (info.parsedTime.getTime() - currentDate.getTime()) / (1000 * 60);

  if (minutesUntilStart < 0) {
    // Match is in progress
    return '⚽ In Progress';
  }

  if (minutesUntilStart < 60) {
    return `🕐 Starts in ${Math.round(minutesUntilStart)} min`;
  }

  if (minutesUntilStart < 1440) { // Less than 24 hours
    const hours = Math.floor(minutesUntilStart / 60);
    return `🕐 Starts in ${hours}h ${Math.round(minutesUntilStart % 60)}m`;
  }

  // Show formatted time for matches more than 24h away
  return `🗓️ ${info.parsedTime.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'GMT'
  })} GMT`;
}
