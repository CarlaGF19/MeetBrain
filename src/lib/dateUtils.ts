/**
 * Utility functions for handling and formatting dates in UTC-5 timezone.
 */

/**
 * Formats an ISO date string or Date object in UTC-5 (using America/Bogota timezone as anchor since it has no DST).
 * Defaults to es-ES locale format for friendly Spanish reading.
 */
export function formatInUTC5(
  dateInput: string | Date | number,
  formatType: "date" | "time" | "datetime" | "shortDate" | "text" = "datetime"
): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Bogota",
  };

  switch (formatType) {
    case "date":
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      return date.toLocaleDateString("es-ES", options);

    case "shortDate":
      options.month = "short";
      options.day = "numeric";
      return date.toLocaleDateString("es-ES", options);

    case "time":
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.second = "2-digit";
      options.hour12 = false;
      return date.toLocaleTimeString("es-ES", options);

    case "text":
      options.weekday = "long";
      options.year = "numeric";
      options.month = "long";
      options.day = "numeric";
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.hour12 = false;
      return date.toLocaleString("es-ES", options);

    case "datetime":
    default:
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.hour12 = false;
      return date.toLocaleString("es-ES", options);
  }
}
