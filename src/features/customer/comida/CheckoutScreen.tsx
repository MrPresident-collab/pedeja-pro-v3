import { ArrowLeft, Check, CreditCard, MapPin, ShoppingBag, Banknote } from 'lucide-react';
import { formatKz } from '../../../app/app-types';
import type { Product } from '../../../app/app-types';
import type { CartItem } from './RestaurantDetail';
import './comida.css';

type Props = {
  items: CartItem[];
  businessName: string;
  address: string;
  onBack: () => void;
  onAddressChange: (value: string) => void;
  onComplete: () => void;
};

type PaymentMethod = 'cash' | 'card';

export default function CheckoutScreen({ items, businessName, address, onBack, onAddressChange, onComplete }: Props) {
  const [payment, setPayment] = React.useState<PaymentMethod>('cash');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const submit = () => {
    if (!address.trim() || busy) return;
    setBusy(true);
    // No order is created here yet. Merchant/order backend comes next.
    window.setTimeout(() => {
      setBusy(false);
      onComplete();
    }, 350);
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
        <label className="checkout-field"><span>Endereço</span><input value={address} onChange={event => onAddressChange(event.target.value)} placeholder="Ex.: Rua, bairro, casa ou referência" /></label>
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
          <button className={payment === 'cash' ? 'payment-option active' : 'payment-option'} onClick={() => setPayment('cash')}><Banknote size={19} /><div><strong>Dinheiro</strong><small>Pagamento na entrega</small></div>{payment === 'cash' && <Check size={17} />}</button>
          <button className={payment === 'card' ? 'payment-option active' : 'payment-option'} onClick={() => setPayment('card')}><CreditCard size={19} /><div><strong>Cartão / Multicaixa</strong><small>Disponibilidade será confirmada</small></div>{payment === 'card' && <Check size={17} />}</button>
        </div>
      </section>

      <section className="checkout-section">
        <label className="checkout-field"><span>Nota para o parceiro <em>Opcional</em></span><textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Ex.: sem cebola, tocar à campainha…" rows={3} /></label>
      </section>

      <section className="checkout-total">
        <div><span>Subtotal · {count} {count === 1 ? 'item' : 'itens'}</span><strong>{formatKz(subtotal)}</strong></div>
        <div><span>Entrega</span><strong>A calcular</strong></div>
        <small>A taxa de entrega e o total final serão calculados pelo backend no momento de criação do pedido.</small>
      </section>

      <button className="primary checkout-submit" disabled={!address.trim() || busy} onClick={submit}>{busy ? 'A preparar pedido…' : `Confirmar pedido · ${formatKz(subtotal)} + entrega`}</button>
      <p className="checkout-disclaimer">Ao confirmar, o pedido ainda não será criado nesta fase do MVP. Estamos a preparar a ligação ao sistema de parceiros.</p>
    </main>
  );
}

import React from 'react';
