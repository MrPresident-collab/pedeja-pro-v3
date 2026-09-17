import { supabase } from '../lib/supabase';

export type EnviarTracking = {
  shipmentId: string;
  status: string;
  deliveryJobId: string | null;
  assignmentId: string | null;
  riderId: string | null;
  riderName: string | null;
  riderPhone: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleRegistration: string | null;
  riderLocation: unknown;
  riderLocationUpdatedAt: string | null;
  expectedDeliveryAt: string | null;
  distanceKm: number | null;
};

export async function getEnviarTracking(shipmentId: string): Promise<EnviarTracking | null> {
  const { data, error } = await supabase.rpc('get_customer_enviar_tracking', {
    p_shipment_id: shipmentId,
  });

  if (error) throw error;
  if (!data) return null;

  return {
    shipmentId: String(data.shipmentId),
    status: String(data.status ?? data.shipmentStatus ?? 'REQUESTED'),
    deliveryJobId: data.deliveryJobId ?? null,
    assignmentId: data.assignmentId ?? null,
    riderId: data.riderId ?? null,
    riderName: data.riderName ?? null,
    riderPhone: data.riderPhone ?? null,
    vehicleMake: data.vehicleMake ?? null,
    vehicleModel: data.vehicleModel ?? null,
    vehicleRegistration: data.vehicleRegistration ?? null,
    riderLocation: data.riderLocation ?? null,
    riderLocationUpdatedAt: data.riderLocationUpdatedAt ?? null,
    expectedDeliveryAt: data.expectedDeliveryAt ?? null,
    distanceKm: data.distanceKm == null ? null : Number(data.distanceKm),
  };
}

export function subscribeToEnviarTracking(shipmentId: string, refresh: () => void) {
  const channel = supabase
    .channel(`enviar-tracking:${shipmentId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'enviar_shipments', filter: `id=eq.${shipmentId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_jobs', filter: `enviar_shipment_id=eq.${shipmentId}` }, refresh)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
