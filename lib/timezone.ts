import { addDays as addDaysFns, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

/**
 * Toda a aplicação trata "o dia de hoje" a partir deste timezone fixo,
 * calculado no servidor — nunca a partir do relógio/timezone do browser
 * (regra #11 e #12 do escopo: não confiar no cliente para isso).
 */
export const APP_TIMEZONE = "America/Sao_Paulo";

export type DateOnly = string; // formato 'yyyy-MM-dd'

/** Data de hoje no timezone do Brasil, como string 'yyyy-MM-dd'. */
export function todayInBrazil(): DateOnly {
  return formatInTimeZone(new Date(), APP_TIMEZONE, "yyyy-MM-dd");
}

/** Índice do dia da semana (0=domingo ... 6=sábado) para uma data 'yyyy-MM-dd'. */
export function weekdayOf(date: DateOnly): number {
  // Meio-dia evita qualquer problema de borda de DST/arredondamento.
  const zoned = toZonedTime(`${date}T12:00:00`, APP_TIMEZONE);
  return zoned.getDay();
}

export function addDaysToDate(date: DateOnly, amount: number): DateOnly {
  const result = addDaysFns(parseISO(date), amount);
  return formatInTimeZone(result, APP_TIMEZONE, "yyyy-MM-dd");
}

export function formatDateLong(date: DateOnly): string {
  const zoned = toZonedTime(`${date}T12:00:00`, APP_TIMEZONE);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(zoned);
  return formatted;
}

export function formatDateShort(date: DateOnly): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateTimeShort(isoTimestamp: string | Date): string {
  return formatInTimeZone(isoTimestamp, APP_TIMEZONE, "dd/MM/yyyy HH:mm", {
    locale: ptBR,
  });
}

export function formatMonthLabel(date: DateOnly): string {
  const zoned = toZonedTime(`${date}T12:00:00`, APP_TIMEZONE);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(zoned);
}

/** Primeiro dia do mês (yyyy-MM-01) contendo a data informada. */
export function firstDayOfMonth(date: DateOnly): DateOnly {
  return `${date.slice(0, 7)}-01`;
}

export function isDateInPast(date: DateOnly): boolean {
  return date < todayInBrazil();
}

/** Intervalo [primeiro dia, último dia] de um mês no formato 'yyyy-MM'. */
export function monthRange(monthKey: string): { start: DateOnly; end: DateOnly } {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${monthKey}-01`,
    end: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
