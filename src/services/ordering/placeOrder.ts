import { repositories } from '@/repositories';
import { isSupabaseConfigured } from '@/services/supabase';
import type { CreateOrderInput } from '@/repositories/types';
import type { Order, PaymentMethod } from '@/types';
import { computePricing } from './pricing';

export type PlaceOrderParams = { paymentMethod: PaymentMethod; tip: number };
export type PlaceOrderOutcome =
  | { ok: true; order: Order }
  | { ok: false; reason: 'empty-cart' | 'no-address' | 'unknown'; message: string };

let attemptKey: string | null = null;
let attemptSignature: string | null = null;

function checkoutSignature(businessId: string, addressId: string, lines: { productId: string; quantity: number }[]) {
  return JSON.stringify({ businessId, addressId, lines: [...lines].sort((a,b)=>a.productId.localeCompare(b.productId)) });
}
function getAttemptKey(signature: string) {
  if (attemptSignature !== signature || !attemptKey) {
    attemptSignature = signature;
    attemptKey = crypto.randomUUID();
  }
  return attemptKey;
}
function clearAttempt() { attemptKey = null; attemptSignature = null; }

export function resetCheckoutAttempt() { clearAttempt(); }

function clearReasonMessage() { return 'O teu cesto está vazio. Adiciona itens antes de continuar.'; }
function noAddressMessage() { return 'Adiciona um endereço de entrega para fazeres o pedido.'; }

export async function placeOrder({ paymentMethod, tip }: PlaceOrderParams): Promise<PlaceOrderOutcome> {
  const cart = repositories.cart;
  const business = cart.getBusiness();
  const lines = cart.getLines();
  if (!business || lines.length === 0) return { ok:false, reason:'empty-cart', message:clearReasonMessage() };
  const address = repositories.location.getDefaultAddress();
  if (!address) return { ok:false, reason:'no-address', message:noAddressMessage() };

  const signature = checkoutSignature(business.id, address.id, lines);
  const idempotencyKey = getAttemptKey(signature);
  const estimate = computePricing(lines, false, cart.getDeliveryFee(), isSupabaseConfigured() ? 0 : tip);
  const input: CreateOrderInput = {
    merchant: business.name,
    merchantId: business.id,
    type: business.type,
    icon: business.icon,
    lines,
    subtotal: estimate.subtotal,
    discounts: 0,
    deliveryFee: estimate.deliveryFee,
    tip: isSupabaseConfigured() ? 0 : tip,
    total: estimate.total,
    paymentMethod,
    deliveryTo: address.line,
    deliveryAddressId: address.id,
    idempotencyKey,
    deliveryInstructions: address.deliveryInstructions,
  };

  try {
    const order = await repositories.order.create(input);
    cart.clear();
    clearAttempt();
    return { ok:true, order };
  } catch (err) {
    console.error('Pedejá order creation failed', err);
    return { ok:false, reason:'unknown', message:'Não conseguimos criar o pedido agora. Tenta novamente.' };
  }
}
