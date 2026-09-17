import { supabase } from '../lib/supabase';

export type CustomerOrderHistory = {
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
  durationMinutes: number | null;
  deliveryJobId: string | null;
  deliveryStatus: string | null;
  riderId: string | null;
  riderUserId: string | null;
  riderName: string | null;
  riderPhone: string | null;
  vehicleId: string | null;
  vehicleType: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleRegistration: string | null;
};

function toNumber(value: unknown): number {
  return value == null ? 0 : Number(value);
}

function mapOrder(row: Record<string, unknown>): CustomerOrderHistory {
  return {
    orderId: String(row.order_id),
    orderReference: String(row.order_reference ?? row.order_id ?? ''),
    status: String(row.status ?? ''),
    paymentStatus: String(row.payment_status ?? ''),
    businessId: String(row.business_id ?? ''),
    businessName: String(row.business_name ?? 'Negócio Pedejá'),
    businessCategory: String(row.business_category ?? ''),
    subtotal: toNumber(row.subtotal),
    deliveryFee: toNumber(row.delivery_fee),
    serviceFee: toNumber(row.service_fee),
    discountAmount: toNumber(row.discount_amount),
    totalAmount: toNumber(row.total_amount),
    currencyCode: String(row.currency_code ?? 'AOA'),
    paymentMethod: row.payment_method == null ? null : String(row.payment_method),
    placedAt: row.placed_at == null ? null : String(row.placed_at),
    acceptedAt: row.accepted_at == null ? null : String(row.accepted_at),
    deliveredAt: row.delivered_at == null ? null : String(row.delivered_at),
    durationMinutes: row.duration_minutes == null ? null : Number(row.duration_minutes),
    deliveryJobId: row.delivery_job_id == null ? null : String(row.delivery_job_id),
    deliveryStatus: row.delivery_status == null ? null : String(row.delivery_status),
    riderId: row.rider_id == null ? null : String(row.rider_id),
    riderUserId: row.rider_user_id == null ? null : String(row.rider_user_id),
    riderName: row.rider_name == null ? null : String(row.rider_name),
    riderPhone: row.rider_phone == null ? null : String(row.rider_phone),
    vehicleId: row.vehicle_id == null ? null : String(row.vehicle_id),
    vehicleType: row.vehicle_type == null ? null : String(row.vehicle_type),
    vehicleMake: row.vehicle_make == null ? null : String(row.vehicle_make),
    vehicleModel: row.vehicle_model == null ? null : String(row.vehicle_model),
    vehicleRegistration: row.vehicle_registration == null ? null : String(row.vehicle_registration),
  };
}

export async function getCustomerOrdersHistory(): Promise<CustomerOrderHistory[]> {
  const { data, error } = await supabase.rpc('get_customer_orders_history');

  if (error) throw error;
  if (!Array.isArray(data)) return [];

  return data.map((row) => mapOrder(row as Record<string, unknown>));
}
