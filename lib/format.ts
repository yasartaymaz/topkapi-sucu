/**
 * TL para birimi formatlaması
 */
export function formatTL(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (!Number.isFinite(n)) return '0,00 ₺';
  return (
    new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n) + ' ₺'
  );
}

/**
 * HH:MM formatına kısaltma (Postgres `time` tipi 08:00:00 döndürür)
 */
export function formatTime(t: string | null | undefined): string {
  if (!t) return '';
  return t.slice(0, 5);
}

/**
 * 'pending' -> 'Yeni sipariş' gibi Türkçe etiket
 */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Yeni sipariş',
  accepted: 'Onaylandı',
  preparing: 'Hazırlanıyor',
  delivering: 'Yolda',
  delivered: 'Teslim edildi',
  canceled: 'İptal',
};

export const ORDER_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:    { bg: 'bg-amber-100',  text: 'text-amber-800' },
  accepted:   { bg: 'bg-sky-100',    text: 'text-sky-800' },
  preparing:  { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  delivering: { bg: 'bg-violet-100', text: 'text-violet-800' },
  delivered:  { bg: 'bg-green-100',  text: 'text-green-800' },
  canceled:   { bg: 'bg-slate-200',  text: 'text-slate-700' },
};
