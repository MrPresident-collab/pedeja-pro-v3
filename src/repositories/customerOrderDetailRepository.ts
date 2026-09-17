import { supabase } from '../lib/supabase';

export type CustomerOrderItem = {
  id: string;
  productId: string | null;
  name: string;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CustomerOrderDetail = {
  orderId: string;
  orderReference: string;
  status: string;
  paymentStatus: string;
  businessId: string;
  businessName: string;
  businessCategory: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discountAmount: number;
  totalAmount: number;
  currencyCode: string;
  paymentMethod: string | null;
  placedAt: string | null;
  acceptedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  deliveryAddress: {
    line1: string | null;
    line2: string | null;
    neighborhood: string | null;
    municipality: string | null;
    city: string | null;
    province: string | null;
    countryCode: string | null;
  };
  recipientName: string | null;
  recipientPhone: string | null;
  deliveryInstructions: string | null;
  customerNote: string | null;
  items: CustomerOrderItem[];
  delivery: {
    jobId: string;
    status: string;
    riderId: string | null;
    riderName: string | null;
    riderPhone: string | null;
    vehicleType: string | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    vehicleRegistration: string | null;
  } | null;
};

export async function getCustomerOrderDetail(orderId: string): Promise<CustomerOrderDetail | null> {
  const { data, error } = await supabase.rpc('get_customer_order_detail', { p_order_id: orderId });
  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    subtotal: Number(data.subtotal ?? 0),
    deliveryFee: Number(data.deliveryFee ?? 0),
    serviceFee: Number(data.serviceFee ?? 0),
    discountAmount: Number(data.discountAmount ?? 0),
    totalAmount: Number(data.totalAmount ?? 0),
    items: Array.isArray(data.items) ? data.items.map((item: Record<string, unknown>) => ({
      id: String(item.id),
      productId: item.productId ? String(item.productId) : null,
      name: String(item.name ?? 'Produto'),
      sku: item.sku ? String(item.sku) : null,
      unitPrice: Number(item.unitPrice ?? 0),
      quantity: Number(item.quantity ?? 0),
      lineTotal: Number(item.lineTotal ?? 0),
    })) : [],
    delivery: data.delivery ? {
      jobId: String(data.delivery.jobId),
      status: String(data.delivery.status),
      riderId: data.delivery.riderId ? String(data.delivery.riderId) : null,
      riderName: data.delivery.riderName ?? null,
      riderPhone: data.delivery.riderPhone ?? null,
      vehicleType: data.delivery.vehicleType ?? null,
      vehicleMake: data.delivery.vehicleMake ?? null,
      vehicleModel: data.delivery.vehicleModel ?? null,
      vehicleRegistration: data.delivery.vehicleRegistration ?? null,
    } : null,
  } as CustomerOrderDetail;
}
