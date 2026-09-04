export const COLOMBIA_TIME_ZONE = 'America/Bogota';

export function formatearInstanteColombia(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const fecha =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'es-CO',
    {
      timeZone: COLOMBIA_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      ...options
    }
  ).format(fecha);
}

export function obtenerFechaHoyColombia(): string {
  const partes =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone: COLOMBIA_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    ).formatToParts(new Date());

  const year =
    partes.find(p => p.type === 'year')?.value ?? '';

  const month =
    partes.find(p => p.type === 'month')?.value ?? '';

  const day =
    partes.find(p => p.type === 'day')?.value ?? '';

  return `${year}-${month}-${day}`;
}

export function obtenerAnioActualColombia(): number {
  const fecha = obtenerFechaHoyColombia();

  return Number(
    fecha.substring(0, 4)
  );
}

export function obtenerMesActualColombia(): number {
  const fecha = obtenerFechaHoyColombia();

  return Number(
    fecha.substring(5, 7)
  );
}

export function fechaCivilComparable(
  value: string | null | undefined
): string {
  if (!value) {
    return '';
  }

  return value.substring(0, 10);
}

export function fechaHoraColombiaAUtc(
  value: string
): string {
  if (!value) {
    return '';
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!match) {
    return value;
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second = '00'
  ] = match;

  const fechaUtc = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) + 5,
      Number(minute),
      Number(second)
    )
  );

  return fechaUtc.toISOString();
}

export function obtenerFechaHoraActualColombia(): string {
  const partes =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone: COLOMBIA_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }
    ).formatToParts(new Date());

  const obtener = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find(p => p.type === tipo)?.value ?? '';

  return `${obtener('year')}-${obtener('month')}-${obtener('day')}T${obtener('hour')}:${obtener('minute')}`;
}