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
  const { data: shipment, error: shipmentError } = await supabase
    .from('enviar_shipments')
    .select('id,status')
    .eq('id', shipmentId)
    .maybeSingle();

  if (shipmentError) throw shipmentError;
  if (!shipment) return null;

  const { data: job, error: jobError } = await supabase
    .from('delivery_jobs')
    .select('id,status,expected_delivery_at,delivery_distance_km')
    .eq('enviar_shipment_id', shipmentId)
    .maybeSingle();

  if (jobError) throw jobError;

  if (!job) {
    return {
      shipmentId,
      status: shipment.status,
      deliveryJobId: null,
      assignmentId: null,
      riderId: null,
      riderName: null,
      riderPhone: null,
      vehicleMake: null,
      vehicleModel: null,
      vehicleRegistration: null,
      riderLocation: null,
      riderLocationUpdatedAt: null,
      expectedDeliveryAt: null,
      distanceKm: null,
    };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('delivery_assignments')
    .select('id,rider_id,vehicle_id,status')
    .eq('delivery_job_id', job.id)
    .order('accepted_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (assignmentError) throw assignmentError;

  let riderName: string | null = null;
  let riderPhone: string | null = null;
  let riderLocation: unknown = null;
  let riderLocationUpdatedAt: string | null = null;
  let vehicleMake: string | null = null;
  let vehicleModel: string | null = null;
  let vehicleRegistration: string | null = null;

  if (assignment?.rider_id) {
    const { data: rider, error: riderError } = await supabase
      .from('riders')
      .select('id,current_location,last_location_at,user_id')
      .eq('id', assignment.rider_id)
      .maybeSingle();

    if (riderError) throw riderError;
    riderLocation = rider?.current_location ?? null;
    riderLocationUpdatedAt = rider?.last_location_at ?? null;

    if (rider?.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name,phone')
        .eq('id', rider.user_id)
        .maybeSingle();

      if (profileError) throw profileError;
      riderName = profile?.full_name ?? null;
      riderPhone = profile?.phone ?? null;
    }
  }

  if (assignment?.vehicle_id) {
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('make,model,registration_number')
      .eq('id', assignment.vehicle_id)
      .maybeSingle();

    if (vehicleError) throw vehicleError;
    vehicleMake = vehicle?.make ?? null;
    vehicleModel = vehicle?.model ?? null;
    vehicleRegistration = vehicle?.registration_number ?? null;
  }

  return {
    shipmentId,
    status: shipment.status,
    deliveryJobId: job.id,
    assignmentId: assignment?.id ?? null,
    riderId: assignment?.rider_id ?? null,
    riderName,
    riderPhone,
    vehicleMake,
    vehicleModel,
    vehicleRegistration,
    riderLocation,
    riderLocationUpdatedAt,
    expectedDeliveryAt: job.expected_delivery_at,
    distanceKm: job.delivery_distance_km == null ? null : Number(job.delivery_distance_km),
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
