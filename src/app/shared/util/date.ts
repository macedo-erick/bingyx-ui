const DAY_TIME = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDayTime(iso: string): string {
  return DAY_TIME.format(new Date(iso)).replace('.', '');
}

// <input type="datetime-local"> speaks local wall-clock time without an offset.
export function toLocalInput(iso: string | null): string {
  if (iso === null) {
    return '';
  }

  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function fromLocalInput(value: string): string | null {
  if (value === '') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
