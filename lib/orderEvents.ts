import { supabase } from './supabase';

type OrderEvent = 'new_order' | 'status_changed' | 'canceled_by_customer';

/**
 * Sipariş olayını Edge Function'a iletir; push notification oradan gönderilir.
 * Hatalar sessiz: push bildirimi sipariş akışını bloklamasın.
 */
export async function sendOrderEvent(orderId: string, event: OrderEvent) {
  try {
    await supabase.functions.invoke('send-order-notification', {
      body: { orderId, event },
    });
  } catch {
    // Bildirimsiz devam
  }
}
