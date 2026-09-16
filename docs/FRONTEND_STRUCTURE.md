# Pedejá — Frontend Structure

**Status: authoritative frontend contract**  
**Product:** Pedejá. — *A promessa que se move*  
**Market:** Angola  
**Primary surface:** Customer PWA  

This document is the frontend source of truth for Pedejá. Future developers, AI agents, designers, and contributors must read it before changing frontend structure, navigation, surface boundaries, or UX architecture.

If another frontend document conflicts with this file, the newest explicit product decision recorded here takes precedence until this document is deliberately revised.

---

## 1. Product identity

Pedejá is an Angola-first delivery ecosystem, not a generic food-delivery clone.

It brings together:

- prepared food
- everyday shopping
- large stores / supermarkets / malls / retailers
- parcel and document delivery

Official brand name: **Pedejá.**

Official tagline: **A promessa que se move**.

### Visual foundation

- Primary purple: `#8A2BE2`
- Dark: `#121212`
- Dark surface: `#1A1A1A`
- Light background: `#F8F7FA`
- White: `#FFFFFF`
- Typography: **Ubuntu**, with Medium as the primary UI weight where appropriate
- Currency: **AOA / Kz**
- Portuguese / Angolan Portuguese UI
- Premium, modern, clean, mobile-native, African/Angolan, friendly, trustworthy, fast
- Avoid neon cyberpunk, unnecessary gradients, excessive glass effects, giant cards, and generic desktop-dashboard styling

### Wordmark rule

Use the complete wordmark **Pedejá.** when branding is required:

- `Pedejá` in white on dark/purple identity surfaces
- final `.` in Pedejá purple `#8A2BE2`
- **Do not introduce a standalone P logo/mark** unless explicitly requested later

---

## 2. Four-interface architecture

Pedejá is one ecosystem backed by Supabase, but it is not one frontend experience.

```text
                         SUPABASE
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       CUSTOMER          PARTNER          OPERATIONS
         PWA            EXPERIENCES           WEB
          │                 │                 │
      pedeja.ao       merchant/rider    operacoes.pedeja.ao
```

The frontend must preserve these boundaries:

```text
Pedejá
├── Customer PWA
├── Merchant experience
├── Estafeta / Delivery Partner experience
└── Operations web
```

A possible future Merchant surface may use `merchant.pedeja.ao`, but that is a separate experience, not a customer-app route.

### Hard boundary rules

- Customer cannot switch into Estafeta or Merchant through a UI role selector.
- Identity ≠ role ≠ capability ≠ internal authority.
- Capabilities are granted/approved by the backend.
- Operations is never exposed inside the customer application.
- No `/operacoes` consumer route.
- No client-side `is_admin`, `role`, `is_driver`, or similar authorization flags.
- No authorization state in localStorage.
- Never put a Supabase service-role key in browser code.
- Merchant, Estafeta, and Operations are not hidden tabs in the customer PWA.

---

## 3. Customer PWA is the current frontend priority

The current rebuild starts with the Customer PWA.

The customer experience must feel like an installed mobile application, not a desktop website squeezed into a phone.

### Target devices

Primary design targets:

- 390 × 844
- 393 × 852
- 412 × 915

Also test down to smaller Android devices and slower hardware.

### Mobile interaction rules

- safe-area aware
- thumb-friendly controls
- large enough touch targets
- fixed bottom navigation where specified
- sheets/drawers for secondary actions where appropriate
- full-screen detail flows where appropriate
- sticky actions when the action must remain available
- avoid unnecessary nested cards
- avoid desktop navigation patterns
- avoid horizontal desktop dashboard assumptions

---

## 4. Angola-first network and device requirement

**Pedejá must be usable under Angolan network realities, from 2G/intermittent connectivity through modern high-speed networks.**

Performance, bandwidth consumption, resilience, and installation are product requirements — not post-launch optimizations.

### Network tiers we design for

```text
2G / unstable
      ↓
3G / intermittent
      ↓
4G / normal
      ↓
5G / high-speed
```

The application must remain understandable and usable across this range.

### Rules

- The first meaningful UI must not depend on loading marketplace data.
- Splash must render without a Supabase request.
- Do not block navigation on non-essential network calls.
- Avoid large initial JavaScript bundles.
- Lazy-load routes/features where useful.
- Images must be compressed and responsive.
- Images should lazy-load below the fold.
- Avoid decorative video backgrounds and bandwidth-heavy animation.
- Avoid unnecessary third-party scripts.
- Show explicit loading, retry, empty, error, and offline states.
- Preserve user-entered information when a connection fails where safe.
- Use optimistic UI only when the operation can safely be reconciled.
- Never imply that an order/payment succeeded until the backend confirms it.

### Offline / intermittent connectivity

The PWA may cache the application shell and safe read-only information.

Offline does **not** mean that every operation is available.

Actions such as these require backend confirmation:

- creating an order
- confirming payment
- changing order state
- accepting a delivery
- live tracking
- other authoritative mutations

The UI must distinguish cached information from live information.

### Data-saving principle

Pedejá should eventually support a clear **Poupança de dados** experience, allowing the product to reduce image/data consumption without changing core functionality.

---

## 5. PWA requirements

Pedejá is a **PWA by design**.

Required foundation:

- valid web app manifest
- application icons
- installable standalone experience
- app theme color
- mobile viewport / safe-area support
- service worker for deliberate shell/offline caching
- controlled cache versioning
- install guidance / install prompt when appropriate

### Installation UX

Installation should be encouraged, not forced blindly.

The application should explain the value of installation at an appropriate moment and use the platform's install capability where available.

Do not make installation a prerequisite for using Pedejá in a normal browser.

---

## 6. Customer entry flow

The customer flow is:

```text
Splash
  ↓
Welcome
  ├── Entrar
  ├── Criar conta
  └── Continuar como convidado
        ↓
Authentication when required
        ↓
Address onboarding
        ↓
Customer application
```

### Splash

Purpose: brand identity and first-load entry point only.

Requirements:

- minimal
- lightweight
- official `Pedejá.` wordmark
- tagline: `A promessa que se move`
- no dashboard content
- no role selector
- no Supabase dependency to render
- explicit bottom **Próximo** action
- no automatic timeout navigation

### Welcome

Actions:

- Entrar
- Criar conta
- Continuar como convidado

No role selection.

### Authentication

Phone-first for Angola:

- `+244`
- OTP flow
- session state comes from Supabase Auth

Future supported identity providers may include email/Google/Apple where deliberately implemented.

### Address onboarding

- Casa is the primary required customer address.
- Habitual / work / school / other locations may be added later.
- Custom labels are allowed.
- Location permission must be contextual and explicit.
- Angola's location model should support province → municipality → neighborhood → street/landmark → coordinates.
- Landmarks are first-class because universal street addressing cannot be assumed.

---

## 7. Customer application navigation

Exactly four bottom navigation items:

1. **Início**
2. **Descobrir**
3. **Pedidos**
4. **Perfil**

Bottom navigation:

- dark surface `#1A1A1A`
- active state `#8A2BE2`
- subtle purple glow only where useful
- safe-area aware

`Descobrir` is the current preferred label for the informational hub. Older references may say `Explorar`; do not silently create a second navigation item.

---

## 8. Início

Header contains:

- avatar
- delivery address

Do not repeat the Pedejá wordmark in the normal home header.

Primary copy:

- `Entregar em [default address]`
- `Olá [NAME]`
- `O que precisas hoje?`

### Four primary intents

```text
COMIDA     → prepared food
COMPRAS    → everyday shopping
ENVIAR     → parcel/document delivery
LOJAS      → supermarkets / malls / large retail
```

**Compras and Lojas must remain separate experiences.**

### Home content

- search
- nearby feed
- filters
- promotional content where available
- recently ordered
- recommended
- nearby businesses

Filters include:

- Perto de ti
- Mais pedidos
- Promo
- Aberto
- <20 min

---

## 9. Comida

Comida covers:

- restaurants
- takeaways
- kitchens
- local prepared-food sellers

Customer flow:

```text
Comida
 ↓
Search / filters / nearby
 ↓
Business
 ↓
Menu
 ↓
Product
 ↓
Cart
 ↓
Checkout
```

Search should support dishes and restaurant names.

Useful category chips include:

- Hambúrguer
- Pizza
- Sushi
- Angolana

Business detail should support menu categories, product selection, pricing, and a sticky cart action.

---

## 10. Compras

Separate everyday-shopping experience.

Examples include:

- pharmacies
- convenience stores
- small registered local businesses

Do not merge this route with Lojas.

---

## 11. Lojas

Separate large-retail experience.

Examples include:

- supermarkets
- malls
- large retailers
- franchises

Do not merge this route with Compras.

---

## 12. Enviar

Parcel/document flow:

```text
Tipo
 ↓
Origem
 ↓
Destino
 ↓
Tamanho / valor / detalhes
 ↓
Server-calculated price
 ↓
Checkout
 ↓
Delivery / tracking
```

Types:

- Documento
- Pequena encomenda
- Pacote
- Outro

The client must never invent or become authoritative for final delivery pricing.

---

## 13. Checkout

One clear mobile checkout.

Show:

- delivery address
- items
- subtotal
- discounts where applicable
- delivery fee
- applicable fee/tip
- total
- payment method

Payment methods may include:

- Numerário
- Multicaixa

The final amount is server-authoritative.

---

## 14. Live order tracking

Active orders must remain visible.

Customer timeline projection:

```text
Novo
 ↓
Aceite
 ↓
Preparando / Pronto
 ↓
Recolhido
 ↓
Entregue
```

The frontend displays a projection; the backend remains the authority for the underlying order dimensions and events.

Live tracking may include:

- map
- assigned rider
- ETA
- distance
- duration
- call/message
- support / WhatsApp where available
- receipt in Kz

Realtime is used only where live state actually matters.

---

## 15. Pedidos

Two states:

- Ativos
- Histórico

Active orders are never hidden.

History should eventually support:

- receipt
- order details
- reorder
- rating

Do not fabricate live delivery information when the backend has not supplied it.

---

## 16. Perfil

Customer profile contains:

- phone
- Casa
- other saved locations such as Trabalho where applicable
- payment preferences
- support
- logout
- app version
- tagline

It must **not** contain:

- Operations access
- admin controls
- role switcher
- hidden capability grants

---

## 17. Descobrir

`Descobrir` is an informational hub, not a marketplace dashboard.

Sections:

### Sobre nós
- O que é Pedejá
- A promessa que se move

### Como funciona
- Como pedir
- Como enviar
- Acompanhar pedido

### Faz parte da rede
- Tornar-se Estafeta
- Tornar-se Parceiro
- Registar negócio

### Ajuda
- Perguntas frequentes
- Contactar suporte

Future additions may include legal links, social links, feedback, and rating entry points.

---

## 18. Merchant frontend boundary

Merchant is a separate experience.

Core areas:

- Dashboard
- Pedidos
- Produtos / Catálogo
- Horários
- Perfil
- Reports where applicable

Merchant order lifecycle projection:

```text
NOVO → ACEITE → PREPARANDO → PRONTO → RECOLHIDO
```

Merchant capabilities are business-scoped and server-authorized.

Merchant UI must never grant Operations access.

---

## 19. Estafeta frontend boundary

Estafeta is a separate mobile-first experience.

Core areas:

- Início
- Carteira
- Histórico
- Perfil

Typical delivery flow:

```text
Available offer
 ↓
ACEITAR
 ↓
Cheguei
 ↓
Recolhido
 ↓
Entregue
```

Assignment offers may have a 15-second acceptance window according to backend rules.

Rider earnings must be transparent and itemized.

Rider location is only exposed while authorized and relevant.

---

## 20. Operations frontend boundary

Operations is a separate web application:

`operacoes.pedeja.ao`

It has:

- separate authentication
- separate authorization
- internal staff permissions/scopes
- desktop-first control interface

It must never be implemented as a consumer route or hidden consumer feature.

Suggested operational areas include:

- Visão Geral
- Pedidos
- Entregadores
- Receita
- Clientes
- Relatórios
- Configurações

The exact operational navigation must follow the live capability model rather than frontend assumptions.

---

## 21. Frontend architecture

The intended dependency direction is:

```text
SUPABASE
   ↓
DOMAIN CONTRACTS
   ↓
REPOSITORIES / SERVICES
   ↓
FEATURES
   ↓
SCREENS
   ↓
USER EXPERIENCE
```

Never build this direction:

```text
Screen
  ↓
invent a table
  ↓
invent backend behavior
  ↓
invent permissions
```

Views should not become the persistence layer.

### Repository rule

UI components should consume repository/service contracts and view models rather than scattering persistence logic throughout screens.

The current frontend may contain transitional direct Supabase calls; those are technical debt to remove deliberately as the rebuild progresses. Do not create more direct persistence access merely because existing code does it.

---

## 22. Supabase boundary

Supabase is the source of truth for the existing Pedejá backend.

The frontend must not modify the backend schema merely to make a screen easier to build.

Do not:

- create a parallel database
- create a second backend
- invent tables to support UI mockups
- run destructive resets
- replace Supabase with Firebase/MongoDB/SQLite/custom Express
- expose service-role credentials in browser code

When frontend requirements do not match the live domain, investigate the existing backend/domain contract first.

---

## 23. Security rules for frontend work

Never trust the browser for:

- role
- capability
- ownership
- order status
- prices
- delivery fees
- payment state
- rider assignment
- administrative authority

The frontend may display server-provided state and request authorized actions.

Authorization is enforced by the backend/RLS/authorized server operations.

---

## 24. Progressive implementation order

Build vertically and validate each layer before moving forward:

1. **Foundation** — PWA shell, typography, identity, auth/session boundary, basic repositories/services.
2. **Entry** — Splash → Welcome → Authentication → Address onboarding.
3. **Customer marketplace** — Início → Comida → Business → Product → Cart.
4. **Real ordering** — Checkout → server-authoritative order creation → Pedidos.
5. **Delivery** — delivery job → assignment → Estafeta → Realtime tracking.
6. **Enviar** — parcel flow and server-calculated pricing.
7. **Merchant** — separate operational experience.
8. **Estafeta** — separate delivery-partner experience.
9. **Operations** — separate internal web application.

Do not jump ahead to decorative polish while the structure is wrong.

---

## 25. Validation rule for every screen

Before implementing or changing a screen, answer:

1. Which surface owns this screen?
2. Where does it sit in the navigation hierarchy?
3. What backend/domain authority supplies its data?
4. What repository/service boundary should the UI use?
5. What happens on 2G?
6. What happens when the connection disappears?
7. What happens when the backend rejects the action?
8. What information is safe to cache?
9. Is the action customer-facing, partner-facing, or Operations-only?
10. Does the screen accidentally grant authority it should not have?

If those questions cannot be answered, the screen is not ready to be built.

---

## 26. Current rebuild rule

**Structure first. Beauty second.**

The current rebuild intentionally prioritizes:

- correct information architecture
- correct surface boundaries
- correct PWA foundation
- correct Angola/network assumptions
- correct backend boundaries
- correct security boundaries
- correct navigation

Visual polish comes after the structure is proven.

---

## 27. Change discipline

Future contributors should:

- read this file before frontend work
- compare changes against this structure
- update this document when a structural product decision changes
- explain why a structural exception exists
- avoid silently changing terminology or navigation
- preserve `Pedejá.` and `A promessa que se move`
- preserve Angola-first assumptions
- preserve low-bandwidth requirements
- preserve Customer / Merchant / Estafeta / Operations separation

This document is deliberately written so a future human developer or AI agent can take over the project without reconstructing the product architecture from old conversations.
