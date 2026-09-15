import { repositories } from '@/repositories';
import { getSupabase, isSupabaseConfigured } from '@/services/supabase';
import { getCachedProductionParcel } from './productionParcel';
import type { ParcelCancellationResult, ParcelStatus } from '@/types';

const CANCELLABLE_STATUSES: ReadonlyArray<ParcelStatus> = ['criado','a_procurar_estafeta','estafeta_atribuido','a_caminho_recolha','chegou_recolha'];

export async function cancelParcelOrder(orderId: string, reason: string): Promise<ParcelCancellationResult> {
  const cached=getCachedProductionParcel(orderId);
  if(isSupabaseConfigured() && cached?.parcel){
    const sb=getSupabase(); if(!sb) return {ok:false,message:'Supabase não configurado.'};
    const {error}=await sb.rpc('cancel_customer_enviar_shipment',{p_shipment_id:orderId,p_reason:reason.trim()||'Pedido do cliente'});
    if(error) return {ok:false,message:error.message};
    return {ok:true};
  }
  const order = repositories.parcel.getParcelOrder(orderId);
  if (!order?.parcel) return { ok:false, message:'Envio não encontrado.' };
  if (!CANCELLABLE_STATUSES.includes(order.parcel.status)) return { ok:false, message:'Este envio já não pode ser cancelado. A encomenda já foi recolhida.' };
  return repositories.parcel.cancelParcelOrder(orderId, reason.trim() || 'Pedido do cliente');
}
