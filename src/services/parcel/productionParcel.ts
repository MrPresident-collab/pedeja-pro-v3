import { getSupabase, isSupabaseConfigured } from '@/services/supabase';
import type { Address, Order, ParcelPackageDraft, ParcelRecipientDraft, ParcelVehicleType, PaymentMethod } from '@/types';
import { estimateParcel, resolveVehicleConfig } from './estimate';

export type ProductionParcelInput = {
  pickup: Address;
  destination: Address;
  recipient: ParcelRecipientDraft;
  package: ParcelPackageDraft;
  vehicleType: ParcelVehicleType;
  vehicleConfigurationId?: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  estimate: ReturnType<typeof estimateParcel>;
  photo: File;
};

const CACHE='pedeja-production-enviar-orders';
function cacheRead():Record<string,Order>{try{return JSON.parse(localStorage.getItem(CACHE)||'{}');}catch{return {};}}
function cacheWrite(order:Order){const all=cacheRead();all[order.id]=order;localStorage.setItem(CACHE,JSON.stringify(all));}
export function getCachedProductionParcel(id:string){return cacheRead()[id]??null;}

export async function createProductionParcel(input:ProductionParcelInput):Promise<Order>{
  if(!isSupabaseConfigured()) throw new Error('Supabase não está configurado.');
  if(!input.pickup.id) throw new Error('Escolhe um ponto de recolha guardado.');
  if(!input.destination.coordinates) throw new Error('O destino precisa de localização exata.');
  if(!input.photo || input.photo.size === 0) throw new Error('Fotografa a encomenda antes de confirmar.');
  if(input.photo.size > 10 * 1024 * 1024) throw new Error('A foto da encomenda deve ter no máximo 10 MB.');
  if(input.photo.type && !['image/jpeg','image/png','image/webp'].includes(input.photo.type)) throw new Error('Usa uma foto JPG, PNG ou WebP.');
  const sb=getSupabase(); if(!sb) throw new Error('Supabase não está configurado.');
  const config=resolveVehicleConfig(input.vehicleType,input.vehicleConfigurationId);
  const {data:id,error}=await sb.rpc('create_customer_enviar_shipment',{p_pickup_address_id:input.pickup.id,p_recipient_name:input.recipient.name.trim(),p_recipient_phone:input.recipient.phone.trim(),p_recipient_address_line_1:input.destination.line,p_recipient_address_line_2:null,p_recipient_neighborhood:input.destination.neighborhood??null,p_recipient_municipality:input.destination.municipality??null,p_recipient_city:input.destination.city??input.destination.municipality??'Luanda',p_recipient_province:input.destination.province??'Luanda',p_recipient_latitude:input.destination.coordinates.latitude,p_recipient_longitude:input.destination.coordinates.longitude,p_package_description:input.package.description.trim(),p_package_weight_kg:input.package.approximateWeightKg??null,p_package_size:input.package.size,p_vehicle_type:input.vehicleType,p_is_fragile:Boolean(input.package.isFragile),p_customer_note:input.package.notes??input.deliveryNotes??null,p_idempotency_key:crypto.randomUUID()});
  if(error) throw error; const shipmentId=id as string;
  const user=(await sb.auth.getUser()).data.user; if(!user) throw new Error('Sessão expirada.');
  const ext=(input.photo.name.split('.').pop()||'jpg').toLowerCase(); const path=`${user.id}/${shipmentId}/package-${crypto.randomUUID()}.${ext}`;
  const {error:uploadError}=await sb.storage.from('delivery-proofs').upload(path,input.photo,{contentType:input.photo.type||'image/jpeg',upsert:false});
  if(uploadError){ try { await sb.rpc('cancel_customer_enviar_shipment',{p_shipment_id:shipmentId,p_reason:'Falha ao guardar a fotografia da encomenda'}); } catch { /* best-effort cleanup */ } throw new Error('Não foi possível guardar a fotografia da encomenda. Tenta novamente.'); }
  const {error:attachError}=await sb.rpc('attach_enviar_package_photo',{p_shipment_id:shipmentId,p_storage_path:path});
  if(attachError){ try { await sb.storage.from('delivery-proofs').remove([path]); } catch { /* best-effort cleanup */ } try { await sb.rpc('cancel_customer_enviar_shipment',{p_shipment_id:shipmentId,p_reason:'Falha ao associar a fotografia da encomenda'}); } catch { /* best-effort cleanup */ } throw new Error('Não foi possível finalizar a prova da encomenda. Tenta novamente.'); }
  const now=new Date().toISOString();
  const parcel={pickup:{...input.pickup},destination:{...input.destination},recipient:{...input.recipient},package:{...input.package,photo:{ref:path}},vehicle:{type:input.vehicleType,configurationId:config.configurationId,configurationLabel:config.label},deliveryNotes:input.deliveryNotes,estimate:input.estimate,paymentMethod:input.paymentMethod,status:'a_procurar_estafeta' as const,timeline:[{status:'a_procurar_estafeta' as const,label:'Envio criado',at:now}],createdAt:now,updatedAt:now,shipmentId};
  const order:Order={id:shipmentId,kind:'parcel',merchant:'Pedejá Enviar',type:'Enviar',date:new Date(now).toLocaleString('pt-PT'),createdAt:now,total:input.estimate.total,status:'novo',items:1,distance:`${input.estimate.distanceKm.toFixed(1)} km`,duration:`${input.estimate.durationMinutes} min`,icon:'send',active:true,subtotal:0,deliveryFee:input.estimate.deliveryFee,parcel};
  cacheWrite(order); return order;
}
