import { getSupabase } from '@/services/supabase';
import type { Order, CartLine } from '@/types';
import type { CreateOrderInput } from './types';

const ORDER_SELECT = 'id,order_reference,customer_id,business_id,status,payment_status,currency_code,subtotal,delivery_fee,service_fee,discount_amount,total_amount,delivery_address_id,delivery_address_line_1,delivery_address_line_2,delivery_neighborhood,delivery_municipality,delivery_city,delivery_province,delivery_country_code,recipient_name,recipient_phone,delivery_instructions,customer_note,placed_at,created_at,updated_at';
const ITEM_SELECT = 'id,order_id,product_id,product_name_snapshot,sku_snapshot,unit_price_snapshot,quantity,line_total,created_at';
const EVENT_SELECT = 'id,order_id,event_type,from_status,to_status,actor_user_id,metadata,created_at';

type DbOrder = { id:string; order_reference:string; business_id:string; status:string; payment_status:string; currency_code:string; subtotal:number|string; delivery_fee:number|string; discount_amount:number|string; total_amount:number|string; delivery_address_id:string|null; delivery_address_line_1:string; created_at:string };
type DbItem = { product_id:string|null; product_name_snapshot:string; unit_price_snapshot:number|string; quantity:number };
type DbEvent = { event_type:string; to_status:string|null; created_at:string };

function legacyStatus(status:string):Order['status'] {
  switch(status) {
    case 'ACCEPTED': return 'aceite';
    case 'PREPARING': return 'preparando';
    case 'READY': case 'ASSIGNED': return 'pronto';
    case 'PICKED_UP': case 'DELIVERING': return 'recolhido';
    case 'DELIVERED': return 'entregue';
    case 'CANCELLED': case 'FAILED': return 'cancelado';
    default: return 'novo';
  }
}
function eventLabel(eventType:string) {
  const labels: Record<string,string> = { ORDER_CREATED:'Pedido criado', PAYMENT_CONFIRMED:'Pagamento confirmado', MERCHANT_ACCEPTED:'Pedido aceite', ORDER_PREPARING:'A preparar o teu pedido', ORDER_READY:'Pedido pronto', DELIVERY_ASSIGNED:'Estafeta atribuído', ORDER_PICKED_UP:'Pedido recolhido', ORDER_DELIVERED:'Pedido entregue', ORDER_CANCELLED:'Pedido cancelado' };
  return labels[eventType] ?? eventType;
}
function mapOrder(order:DbOrder,businessName:string,items:DbItem[],events:DbEvent[]):Order {
  const lines:CartLine[] = items.map(item => ({ productId:item.product_id ?? '', name:item.product_name_snapshot, unitPrice:Number(item.unit_price_snapshot), quantity:item.quantity }));
  const status=legacyStatus(order.status);
  return { id:order.id, orderReference:order.order_reference, kind:'marketplace', merchant:businessName, type:'Negócio', date:new Date(order.created_at).toLocaleString('pt-PT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}), createdAt:order.created_at, total:Number(order.total_amount), status, items:lines.reduce((n,line)=>n+line.quantity,0), distance:'', duration:'', icon:'store', active:!['DELIVERED','CANCELLED','FAILED'].includes(order.status), subtotal:Number(order.subtotal), deliveryFee:Number(order.delivery_fee), discount:Number(order.discount_amount)||undefined, paymentMethod:undefined, deliveryTo:order.delivery_address_line_1, deliveryAddressId:order.delivery_address_id ?? undefined, lines, timeline:events.map(event=>({ status:legacyStatus(event.to_status ?? order.status), label:eventLabel(event.event_type), timestamp:new Date(event.created_at).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}), done:true })) };
}

export function createSupabaseOrderRepository() {
  const sb=getSupabase();
  let orders:Order[]=[];
  const byId=new Map<string,Order>();

  async function fetchOne(id:string) {
    if(!sb) throw new Error('Supabase não configurado.');
    const [{data:order,error:orderError},{data:items,error:itemError},{data:events,error:eventError}] = await Promise.all([
      sb.from('orders').select(ORDER_SELECT).eq('id',id).single(),
      sb.from('order_items').select(ITEM_SELECT).eq('order_id',id).order('created_at'),
      sb.from('order_events').select(EVENT_SELECT).eq('order_id',id).order('created_at'),
    ]);
    if(orderError) throw orderError; if(itemError) throw itemError; if(eventError) throw eventError;
    const dbOrder=order as unknown as DbOrder;
    const {data:business}=await sb.from('businesses').select('name').eq('id',dbOrder.business_id).maybeSingle();
    const mapped=mapOrder(dbOrder,business?.name ?? 'Negócio',(items ?? []) as unknown as DbItem[],(events ?? []) as unknown as DbEvent[]);
    byId.set(id,mapped);
    orders=[...byId.values()].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    return mapped;
  }
  async function initialize() {
    if(!sb) throw new Error('Supabase não configurado.');
    const {data,error}=await sb.from('orders').select(ORDER_SELECT).order('created_at',{ascending:false});
    if(error) throw error;
    orders=[]; byId.clear();
    for(const row of (data ?? []) as unknown as DbOrder[]) {
      try { await fetchOne(row.id); } catch (error) { console.warn('Pedejá: failed to hydrate order', row.id, error); }
    }
  }
  return {
    initialize,
    listActive:()=>orders.filter(order=>order.active),
    listHistory:()=>orders.filter(order=>!order.active),
    getById:(id:string)=>byId.get(id) ?? null,
    async create(input:CreateOrderInput) {
      if(!sb || !input.merchantId || !input.deliveryAddressId) throw new Error('Dados de pedido incompletos.');
      const payload={ p_business_id:input.merchantId, p_delivery_address_id:input.deliveryAddressId, p_items:input.lines.map(line=>({product_id:line.productId,quantity:line.quantity})), p_customer_note:input.note ?? null, p_delivery_instructions:input.deliveryInstructions ?? null, p_idempotency_key:input.idempotencyKey ?? crypto.randomUUID() };
      const {data,error}=await sb.rpc('create_customer_order',payload);
      if(error) throw error;
      return fetchOne(data as string);
    },
    async cancelOrder(id:string) {
      if(!sb) throw new Error('Supabase não configurado.');
      const {data,error}=await sb.rpc('cancel_customer_order',{p_order_id:id});
      if(error) throw error;
      return fetchOne(data as string);
    },
    async repeat() { return null; },
    async getOrderEvents(id:string) { return byId.get(id)?.timeline ?? []; },
    subscribe(listener:()=>void) {
      if(!sb) return ()=>{};
      const channel=sb.channel('customer-orders').on('postgres_changes',{event:'*',schema:'public',table:'orders'},()=>{ void initialize().then(listener).catch(()=>{}); }).subscribe();
      return ()=>{ void sb.removeChannel(channel); };
    },
  };
}
