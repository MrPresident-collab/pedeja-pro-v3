import { useState } from 'react';
import {
  Banknote,
  Bell,
  Bike,
  Car,
  ChevronRight,
  Clock3,
  FileText,
  HelpCircle,
  MessageCircle,
  Package,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Star,
  TrendingUp,
  Truck,
  Utensils,
} from 'lucide-react';
import { AppearanceSheet } from '@/components/account/AppearanceSheet';
import { showToast } from '@/components/toastStore';
import type {
  DriverApprovalStatus,
  DriverDocument,
  DriverDocumentStatus,
  DriverVehicle,
  DriverVehicleType,
  DriverVehicleVerificationStatus,
  RiderRepository,
} from '@/repositories/riderTypes';
import { formatKz } from '@/utils/format';

type Props = {
  riderRepo: RiderRepository;
  onAction: (label: string) => void;
  onAppearanceChanged?: () => void;
};

const APPROVAL_LABELS: Record<DriverApprovalStatus, string> = {
  pending_documents: 'Documentos pendentes',
  pending_review: 'Em revisão',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  suspended: 'Suspenso',
};

const DOCUMENT_LABELS: Record<DriverDocumentStatus, string> = {
  approved: 'Aprovado',
  under_review: 'Em revisão',
  rejected: 'Rejeitado',
  not_sent: 'Não enviado',
  expired: 'Expirado',
  update_required: 'Atualização necessária',
};

const VEHICLE_LABELS: Record<DriverVehicleVerificationStatus, string> = {
  approved: 'Aprovado',
  pending: 'Em revisão',
  suspended: 'Suspensa',
};

function vehicleIcon(type: DriverVehicleType) {
  switch (type) {
    case 'carro':
      return <Car size={17} />;
    case 'carrinha':
      return <Truck size={17} />;
    case 'triciclo':
      return <Bike size={17} />;
    default:
      return <Bike size={17} />;
  }
}

function approvalChip(status: DriverApprovalStatus) {
  const cls = status === 'approved' ? 'chip chip-success' : 'chip chip-warn';
  return <span className={cls}>{APPROVAL_LABELS[status]}</span>;
}

function documentChip(doc: DriverDocument) {
  const cls =
    doc.status === 'approved'
      ? 'chip chip-success'
      : doc.status === 'under_review' || doc.status === 'rejected'
        ? 'chip chip-warn'
        : 'chip chip-pill';
  return <span className={cls}>{DOCUMENT_LABELS[doc.status]}</span>;
}

function vehicleChip(vehicle: DriverVehicle) {
  const cls = vehicle.verificationStatus === 'approved' ? 'chip chip-success' : 'chip chip-warn';
  return <span className={cls}>{VEHICLE_LABELS[vehicle.verificationStatus]}</span>;
}

export function RiderProfileView({ riderRepo, onAction, onAppearanceChanged }: Props) {
  const profile = riderRepo.getProfile();
  const stats = riderRepo.getStats();
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const toggleRow = (
    icon: JSX.Element,
    title: string,
    subtitle: string,
    checked: boolean,
    onToggle: () => void,
    label: string,
  ) => (
    <div className="profile-link rider-toggle-row">
      <span className="profile-link-icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{checked ? 'Ativado' : 'Desativado'} · {subtitle}</small>
      </span>
      <button
        className={`rider-switch ${checked ? 'on' : ''}`}
        onClick={onToggle}
        aria-label={label}
      >
        <span className="rider-switch-thumb" />
      </button>
    </div>
  );

  return (
    <main className="page rider-page inner-page profile-page">
      <header className="inner-header">
        <p className="eyebrow">PERFIL</p>
        <h1>Olá, {profile.name.split(' ')[0]}.</h1>
        <p>A tua conta de estafeta.</p>
      </header>

      <div className="profile-identity">
        <span className="profile-avatar">{profile.initials}</span>
        <div>
          <strong>{profile.name}</strong>
          <small>{profile.phone} · {profile.email}</small>
          <small>Membro desde {profile.memberSince}</small>
        </div>
        {approvalChip(profile.approvalStatus)}
      </div>

      <div className="rider-profile-stats">
        <div className="rider-profile-stat">
          <Star size={16} fill="currentColor" />
          <strong>{profile.rating}</strong>
          <small>Avaliação</small>
        </div>
        <div className="rider-profile-stat">
          <Clock3 size={16} />
          <strong>{profile.onlineHours}h</strong>
          <small>Hoje</small>
        </div>
        <div className="rider-profile-stat">
          <Package size={16} />
          <strong>{stats.totalDeliveries}</strong>
          <small>Entregas</small>
        </div>
        <div className="rider-profile-stat">
          <TrendingUp size={16} />
          <strong>{formatKz(stats.avgPerDeliveryMoney.amount)}</strong>
          <small>Média</small>
        </div>
      </div>

      <section className="profile-group">
        <p className="eyebrow">DADOS PESSOAIS</p>
        <div className="profile-links">
          <div className="profile-link">
            <span className="profile-link-icon"><Package size={17} /></span>
            <span>
              <strong>Identificação</strong>
              <small>Estafeta · {profile.id}</small>
            </span>
            {approvalChip(profile.approvalStatus)}
          </div>
        </div>
      </section>

      <section className="profile-group">
        <p className="eyebrow">VEÍCULOS</p>
        <div className="profile-links">
          {profile.vehicles.map((vehicle) => (
            <div className="profile-link" key={vehicle.id}>
              <span className="profile-link-icon">{vehicleIcon(vehicle.type)}</span>
              <span>
                <strong>
                  {vehicle.label}
                  {vehicle.isActive ? ' · Ativo' : ''}
                </strong>
                <small>{vehicle.color} · {vehicle.licensePlate} · Adicionado {vehicle.addedAt}</small>
              </span>
              {vehicleChip(vehicle)}
            </div>
          ))}
        </div>
      </section>

      <section className="profile-group">
        <p className="eyebrow">DOCUMENTOS</p>
        <div className="profile-links">
          {profile.documents.map((doc) => (
            <div className="profile-link" key={doc.kind}>
              <span className="profile-link-icon"><FileText size={17} /></span>
              <span>
                <strong>{doc.label}</strong>
                <small>
                  {doc.submittedAt ? `Enviado em ${doc.submittedAt}` : 'Ainda não enviado'}
                  {doc.expiresAt ? ` · Expira em ${doc.expiresAt}` : ''}
                </small>
              </span>
              {documentChip(doc)}
            </div>
          ))}
        </div>
      </section>

      <section className="profile-group">
        <p className="eyebrow">PREFERÊNCIAS</p>
        <div className="profile-links">
          {toggleRow(
            <Banknote size={17} />,
            'Pedidos em dinheiro',
            'Vai ver ofertas pagas em dinheiro',
            profile.preferences.acceptCash,
            () => riderRepo.updatePreferences({ acceptCash: !profile.preferences.acceptCash }),
            'Alternar pedidos em dinheiro',
          )}
          {toggleRow(
            <Utensils size={17} />,
            'Entregas de comida',
            'Restaurantes e comida ao domicílio',
            profile.preferences.acceptFood,
            () => riderRepo.updatePreferences({ acceptFood: !profile.preferences.acceptFood }),
            'Alternar entregas de comida',
          )}
          {toggleRow(
            <ShoppingBag size={17} />,
            'Entregas de compras',
            'Supermercados e farmácias',
            profile.preferences.acceptShopping,
            () => riderRepo.updatePreferences({ acceptShopping: !profile.preferences.acceptShopping }),
            'Alternar entregas de compras',
          )}
          {toggleRow(
            <Package size={17} />,
            'Envios e encomendas',
            'Pacotes de casa para casa',
            profile.preferences.acceptParcel,
            () => riderRepo.updatePreferences({ acceptParcel: !profile.preferences.acceptParcel }),
            'Alternar envios e encomendas',
          )}
          {toggleRow(
            <Bell size={17} />,
            'Notificações',
            'Novos pedidos e atualizações',
            profile.preferences.notificationsEnabled,
            () => riderRepo.updatePreferences({ notificationsEnabled: !profile.preferences.notificationsEnabled }),
            'Alternar notificações',
          )}
        </div>
        <p className="rider-settings-note">
          As preferências afetam os pedidos que recebes. Pedidos em dinheiro dependem da autorização operacional.
        </p>
      </section>

      <section className="profile-group">
        <p className="eyebrow">APARÊNCIA</p>
        <div className="profile-links">
          <button className="profile-link" onClick={() => setAppearanceOpen(true)}>
            <span className="profile-link-icon"><Palette size={17} /></span>
            <span>
              <strong>Tema da aplicação</strong>
              <small>Claro · Escuro · Automático</small>
            </span>
            <ChevronRight size={17} className="profile-chevron" />
          </button>
        </div>
      </section>

      <section className="profile-group">
        <p className="eyebrow">SEGURANÇA E SUPORTE</p>
        <div className="profile-links">
          <button className="profile-link" onClick={() => onAction('security')}>
            <span className="profile-link-icon"><ShieldCheck size={17} /></span>
            <span>
              <strong>Segurança da conta</strong>
              <small>Palavra-passe e verificações</small>
            </span>
            <ChevronRight size={17} className="profile-chevron" />
          </button>
          <button
            className="profile-link"
            onClick={() => showToast('Suporte Pedejá. Em breve.')}
          >
            <span className="profile-link-icon"><HelpCircle size={17} /></span>
            <span>
              <strong>Precisas de ajuda?</strong>
              <small>Fala com o suporte</small>
            </span>
            <ChevronRight size={17} className="profile-chevron" />
          </button>
          <button
            className="profile-link"
            onClick={() => showToast('A abrir chat com o suporte...')}
          >
            <span className="profile-link-icon"><MessageCircle size={17} /></span>
            <span>
              <strong>Chat de apoio</strong>
              <small>Conversa em tempo real</small>
            </span>
            <ChevronRight size={17} className="profile-chevron" />
          </button>
        </div>
      </section>

      <p className="profile-footer">Pedejá v1.0.0</p>

      <button className="logout-button" onClick={() => onAction('logout')}>
        Terminar sessão
      </button>

      <AppearanceSheet
        open={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
        onChanged={() => onAppearanceChanged?.()}
      />

      <div className="bottom-space" />
    </main>
  );
}