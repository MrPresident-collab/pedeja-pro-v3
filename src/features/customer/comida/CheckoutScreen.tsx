import { useState } from 'react';
import { ArrowLeft, Banknote, Check, CreditCard, MapPin, ShoppingBag } from 'lucide-react';
import { formatKz } from '../../../app/app-types';
import { createCustomerOrder } from '../../../repositories/customerOrderRepository';
import type { CartItem } from './RestaurantDetail';
import './comida.css';

type Props = {
  items: CartItem[];
  businessId: string;
  businessName: string;
  address: string;
  addressId: string | null;
  onBack: () => void;
  onComplete: (orderId: string) => void;
};

type PaymentMethod = 'cash' | 'card';

export default function CheckoutScreen({ items, businessId, businessName, address, addressId, onBack, onComplete }: Props) {
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const submit = async () => {
    if (!addressId || !items.length || busy || payment !== 'cash') return;
    setBusy(true);
    setError(null);
    try {
      const orderId = await createCustomerOrder({
        businessId,
        deliveryAddressId: addressId,
        items: items.map(item => ({ productId: item.id, quantity: item.quantity })),
        customerNote: note,
      });
      onComplete(orderId);
    } catch (err) {
      console.error('Failed to create customer order', err);
      setError('Não foi possível criar o pedido. Confirma a tua morada e tenta novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="screen checkout-screen">
      <header className="marketplace-header">
        <button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
        <div><span className="eyebrow">PEDEJÁ</span><h1>Checkout</h1></div>
        <div className="restaurant-detail-spacer" />
      </header>

      <section className="checkout-section">
        <div className="checkout-section-title"><MapPin size={18} /><div><span>ENTREGA</span><strong>Onde devemos entregar?</strong></div></div>
        <div className="checkout-address-value">{address || 'Nenhuma morada selecionada'}</div>
      </section>

      <section className="checkout-section">
        <div className="checkout-section-title"><ShoppingBag size={18} /><div><span>PEDIDO</span><strong>{businessName}</strong></div></div>
        <div className="checkout-items">
          {items.map(item => <div className="checkout-item" key={item.id}><span>{item.quantity}× {item.name}</span><strong>{formatKz(item.price * item.quantity)}</strong></div>)}
        </div>
      </section>

      <section className="checkout-section">
        <div className="checkout-section-title"><CreditCard size={18} /><div><span>PAGAMENTO</span><strong>Como vais pagar?</strong></div></div>
        <div className="payment-options">
          <button type="button" className="payment-option active" onClick={() => setPayment('cash')}><Banknote size={19} /><div><strong>Dinheiro</strong><small>Pagamento na entrega</small></div>{payment === 'cash' && <Check size={17} />}</button>
          <button type="button" className="payment-option" disabled aria-disabled="true"><CreditCard size={19} /><div><strong>Cartão / Multicaixa</strong><small>Pagamento digital será ligado ao provedor Pedejá.</small></div></button>
        </div>
      </section>

      <section className="checkout-section">
        <label className="checkout-field"><span>Nota para o parceiro <em>Opcional</em></span><textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Ex.: sem cebola, tocar à campainha…" rows={3} /></label>
      </section>

      <section className="checkout-total">
        <div><span>Subtotal · {count} {count === 1 ? 'item' : 'itens'}</span><strong>{formatKz(subtotal)}</strong></div>
        <div><span>Entrega</span><strong>Calculada pelo Pedejá</strong></div>
        <small>O valor final, incluindo entrega e taxa de serviço, é calculado no backend.</small>
      </section>

      {error && <div className="notice">{error}</div>}
      {!addressId && <div className="notice">Adiciona uma morada de entrega antes de fazer o pedido.</div>}

      <button className="primary checkout-submit" disabled={!addressId || !items.length || busy} onClick={submit}>{busy ? 'A criar pedido…' : 'Confirmar pedido'}</button>
      <p className="checkout-disclaimer">O pedido será criado no Pedejá com preços e taxas definidos pelo backend.</p>
    </main>
  );
}
