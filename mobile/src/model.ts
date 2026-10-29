export const MIN = 60_000;

export type Role = "manager" | "waiter" | "kitchen";
export type OrderStatus = "sent" | "preparing" | "ready" | "delivered";
export type TableStatus = "free" | "occ" | "bill";
export type PayStatus = "pending" | "confirmed" | "failed";
export type TabId =
  | "dash"
  | "pulse"
  | "caixa"
  | "stock"
  | "menu"
  | "users"
  | "audit"
  | "tables"
  | "new"
  | "orders"
  | "kds";

export type ModalKind =
  | null
  | { k: "forgot" }
  | { k: "review" }
  | { k: "rel" }
  | { k: "more" };

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  /** Lista própria. Se ausente, vale o pacote do cargo (sessões antigas). */
  perms?: string[];
}

export interface Table {
  n: number;
  st: TableStatus;
  seats: number;
  w: string | null;
}

export interface StockItem {
  id: string;
  name: string;
  q: number;
  min: number;
  u: string;
  step: number;
}

export interface MenuItem {
  id: string;
  name: string;
  cat: string;
  p: number;
  ok: boolean;
  rec: Record<string, number>;
}

export interface OrderLine {
  name: string;
  q: number;
  note: string;
  mid: string;
}

export interface Order {
  id: string;
  n: number;
  table: number;
  w: string;
  st: OrderStatus;
  t0: number;
  tp?: number;
  tr?: number;
  td?: number;
  items: OrderLine[];
  ded?: boolean;
  closed?: boolean;
}

export interface Payment {
  id: string;
  key: string;
  table: number;
  amount: number;
  method: string;
  st: PayStatus;
  t: number;
  ref?: string;
  closed?: boolean;
}

export interface AuditEntry {
  t: number;
  u: string;
  a: string;
}

export interface CartLine {
  mid: string;
  name: string;
  p: number;
  q: number;
  note: string;
}

export interface Cfg {
  prep: number;
  wait: number;
}

export interface Snapshot {
  rid: string;
  cfg: Cfg;
  cart: CartLine[];
  selTable: number;
  cat: string;
  tab: TabId | null;
  user: Staff | null;
  seq: number;
  users: Staff[];
  tables: Table[];
  stock: StockItem[];
  menu: MenuItem[];
  orders: Order[];
  pays: Payment[];
  audit: AuditEntry[];
}

export function seed(): Snapshot {
  const now = Date.now();
  return {
    rid: "demo-rest-1",
    cfg: { prep: 15, wait: 5 },
    cart: [],
    selTable: 3,
    cat: "Todos",
    tab: null,
    user: null,
    seq: 104,
    users: [
      { id: "u1", name: "Marina Souza", email: "marina@demo.cheffar", role: "manager", active: true },
      { id: "u2", name: "Caio Lima", email: "caio@demo.cheffar", role: "waiter", active: true },
      { id: "u3", name: "Rosa Alves", email: "rosa@demo.cheffar", role: "kitchen", active: true },
    ],
    tables: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
      n,
      st: [2, 5].includes(n) ? "occ" : n === 3 ? "bill" : "free",
      seats: 4,
      w: [2, 5, 3].includes(n) ? "u2" : null,
    })),
    stock: [
      { id: "s1", name: "Pão brioche", q: 40, min: 20, u: "un", step: 10 },
      { id: "s2", name: "Carne 150 g", q: 18, min: 15, u: "un", step: 10 },
      { id: "s3", name: "Queijo muçarela", q: 0, min: 5, u: "kg", step: 2 },
      { id: "s4", name: "Refrigerante lata", q: 30, min: 12, u: "un", step: 12 },
    ],
    menu: [
      { id: "m1", name: "Hambúrguer artesanal", cat: "Hambúrgueres", p: 34, ok: true, rec: { s1: 1, s2: 1 } },
      { id: "m2", name: "X-Queijo", cat: "Hambúrgueres", p: 29, ok: true, rec: { s1: 1, s2: 1, s3: 0.05 } },
      { id: "m3", name: "Batata frita", cat: "Acompanhamentos", p: 18, ok: true, rec: {} },
      { id: "m4", name: "Refrigerante", cat: "Bebidas", p: 7, ok: true, rec: { s4: 1 } },
      { id: "m5", name: "Pudim", cat: "Sobremesas", p: 14, ok: false, rec: {} },
    ],
    orders: [
      {
        id: "o1",
        n: 101,
        table: 2,
        w: "u2",
        st: "preparing",
        t0: now - 22 * MIN,
        tp: now - 18 * MIN,
        items: [{ name: "Hambúrguer artesanal", q: 2, note: "sem cebola (alergia)", mid: "m1" }],
        ded: true,
      },
      {
        id: "o2",
        n: 102,
        table: 5,
        w: "u2",
        st: "sent",
        t0: now - 3 * MIN,
        items: [
          { name: "X-Queijo", q: 1, note: "", mid: "m2" },
          { name: "Refrigerante", q: 2, note: "", mid: "m4" },
        ],
      },
      {
        id: "o3",
        n: 103,
        table: 3,
        w: "u2",
        st: "delivered",
        t0: now - 30 * MIN,
        tp: now - 25 * MIN,
        tr: now - 9 * MIN,
        td: now - 6 * MIN,
        items: [{ name: "Batata frita", q: 1, note: "", mid: "m3" }],
        ded: true,
      },
    ],
    pays: [],
    audit: [{ t: now - 50 * MIN, u: "Marina Souza", a: "Meta de preparo definida em 15 min" }],
  };
}

export interface CompanyInfo {
  slug: string;
  name: string;
  rid: string;
}

export interface RegisteredCompany {
  slug: string;
  name: string;
  legalName: string;
  cnpj: string;
  phone: string;
  zip: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  ownerName: string;
  ownerEmail: string;
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCnpj(value: string) {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function cnpjOk(value: string) {
  const c = onlyDigits(value);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const digit = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += Number(c[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  return digit(12) === Number(c[12]) && digit(13) === Number(c[13]);
}

export function formatPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length < 11) {
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatCep(value: string) {
  return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

export const DEMO_COMPANIES: CompanyInfo[] = [
  { slug: "sabor-da-casa", name: "Sabor da Casa", rid: "rest-sabor-da-casa" },
  { slug: "demo", name: "Casa Demo", rid: "demo-rest-1" },
  { slug: "burger-demo", name: "Burger Demo", rid: "rest-burger-demo" },
];

export function companyFromSlug(slug: string): CompanyInfo {
  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const found = DEMO_COMPANIES.find((c) => c.slug === clean);
  if (found) return found;

  const name = clean
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "Restaurante";

  return {
    slug: clean || "demo",
    name,
    rid: `rest-${clean || "demo"}`,
  };
}

export function seedFor(slug: string): Snapshot {
  const info = companyFromSlug(slug);
  const base = seed();
  return {
    ...base,
    rid: info.rid,
  };
}

export function seedCompany(info: RegisteredCompany): Snapshot {
  const base = seedFor(info.slug);
  const ownerName = info.ownerName.trim();
  const ownerEmail = info.ownerEmail.trim().toLowerCase();
  return {
    ...base,
    rid: `rest-${info.slug}`,
    cart: [],
    selTable: 1,
    tab: null,
    user: null,
    seq: 100,
    users: [
      {
        id: "u1",
        name: ownerName,
        email: ownerEmail,
        role: "manager",
        active: true,
      },
    ],
    tables: base.tables.map((t) => ({ ...t, st: "free" as const, w: null })),
    orders: [],
    pays: [],
    audit: [{ t: Date.now(), u: ownerName, a: `Empresa ${info.name.trim()} cadastrada` }],
  };
}

export const ROLES: Record<Role, { label: string; perms: string[] }> = {
  manager: {
    label: "Gerência",
    perms: [
      "dash",
      "pulse",
      "stock",
      "stock:write",
      "users",
      "users:write",
      "audit",
      "orders:view",
      "cfg:write",
      "table:release",
      "pay:view",
      "pay:write",
      "menu:edit",
      "tables",
    ],
  },
  waiter: {
    label: "Garçom",
    perms: ["tables", "order:create", "order:deliver", "orders:view", "table:bill"],
  },
  kitchen: {
    label: "Cozinha",
    perms: ["kds", "order:prepare", "order:ready"],
  },
};

export const TABS: Record<Role, [TabId, string][]> = {
  manager: [
    ["dash", "Painel"],
    ["pulse", "Pulse"],
    ["tables", "Mesas"],
    ["caixa", "Caixa"],
    ["orders", "Pedidos"],
    ["stock", "Estoque"],
    ["menu", "Cardápio"],
    ["users", "Equipe"],
    ["audit", "Histórico"],
  ],
  waiter: [
    ["tables", "Mesas"],
    ["new", "Novo pedido"],
    ["orders", "Pedidos"],
  ],
  kitchen: [["kds", "Cozinha"]],
};

export const PRIMARY: Record<Role, TabId[]> = {
  manager: ["dash", "tables", "caixa", "users"],
  waiter: ["tables", "new", "orders"],
  kitchen: ["kds"],
};

export const NEED: Record<TabId, string> = {
  dash: "dash",
  pulse: "pulse",
  caixa: "pay:view",
  stock: "stock",
  menu: "menu:edit",
  users: "users",
  audit: "audit",
  tables: "tables",
  new: "order:create",
  orders: "orders:view",
  kds: "kds",
};

export const PERM_LABEL: Record<string, string> = {
  dash: "Painel",
  pulse: "Pulse",
  stock: "Estoque",
  "stock:write": "Ajustar estoque",
  users: "Equipe",
  "users:write": "Cadastrar equipe",
  audit: "Histórico",
  "orders:view": "Ver pedidos",
  "cfg:write": "Metas de tempo",
  "table:release": "Liberar mesa",
  "pay:view": "Caixa",
  "pay:write": "Registrar pagamento",
  "menu:edit": "Editar cardápio",
  tables: "Mesas",
  "order:create": "Criar pedido",
  "order:deliver": "Confirmar entrega",
  "table:bill": "Pedir conta",
  kds: "Cozinha",
  "order:prepare": "Iniciar preparo",
  "order:ready": "Marcar pronto",
};

export const PAY_METHODS = ["Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito"] as const;

export const ST: Record<OrderStatus, [string, "wait" | "ok" | "neutral"]> = {
  sent: ["Recebido", "wait"],
  preparing: ["Em preparo", "neutral"],
  ready: ["Pronto", "wait"],
  delivered: ["Entregue", "ok"],
};

export const TS: Record<TableStatus, string> = {
  free: "Livre",
  occ: "Ocupada",
  bill: "Conta",
};

export const PERM_GROUPS: { title: string; perms: string[] }[] = [
  { title: "Salão", perms: ["tables", "order:create", "orders:view", "order:deliver", "table:bill", "table:release"] },
  { title: "Cozinha", perms: ["kds", "order:prepare", "order:ready"] },
  { title: "Caixa", perms: ["pay:view", "pay:write"] },
  { title: "Gestão", perms: ["dash", "pulse", "cfg:write", "stock", "stock:write", "menu:edit", "audit", "users", "users:write"] },
];

export function permsOf(user: Staff) {
  return user.perms ?? ROLES[user.role].perms;
}

export function can(user: Staff | null, perm: string) {
  if (!user || !user.active) return false;
  return permsOf(user).includes(perm);
}

export const ALL_TABS: [TabId, string][] = [
  ["dash", "Painel"],
  ["pulse", "Pulse"],
  ["tables", "Mesas"],
  ["new", "Novo pedido"],
  ["orders", "Pedidos"],
  ["kds", "Cozinha"],
  ["caixa", "Caixa"],
  ["stock", "Estoque"],
  ["menu", "Cardápio"],
  ["users", "Equipe"],
  ["audit", "Histórico"],
];

export function tabsFor(user: Staff) {
  return ALL_TABS.filter(([id]) => can(user, NEED[id]));
}

export function firstTab(user: Staff): TabId {
  return tabsFor(user)[0]?.[0] ?? "dash";
}

export function primaryFor(user: Staff) {
  const allowed = tabsFor(user).map(([id]) => id);
  const picked = PRIMARY[user.role].filter((id) => allowed.includes(id));
  for (const id of allowed) {
    if (picked.length >= 4) break;
    if (!picked.includes(id)) picked.push(id);
  }
  return picked.slice(0, 4);
}

export function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function mins(t: number, now = Date.now()) {
  return Math.floor((now - t) / MIN);
}

export function emailOk(e: string) {
  return /^\S+@\S+\.\S+$/.test(e);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function who(s: Snapshot, id: string | null) {
  if (!id) return "—";
  return s.users.find((u) => u.id === id)?.name ?? "—";
}

export function linePrice(s: Snapshot, mid: string) {
  return s.menu.find((m) => m.id === mid)?.p ?? 0;
}

export function tot(s: Snapshot, o: Order) {
  return o.items.reduce((sum, i) => sum + i.q * linePrice(s, i.mid), 0);
}

export function openOrders(s: Snapshot, n: number) {
  return s.orders.filter((o) => o.table === n && !o.closed);
}

export function cons(s: Snapshot, n: number) {
  return openOrders(s, n).reduce((sum, o) => sum + tot(s, o), 0);
}

export function paid(s: Snapshot, n: number) {
  return s.pays
    .filter((p) => p.table === n && !p.closed && (p.st === "confirmed" || p.st === "pending"))
    .reduce((sum, p) => sum + p.amount, 0);
}

export type AlertOwner = "kitchen" | "waiter" | "cashier" | "manager";

export interface Alert {
  k: "d" | "w";
  tab?: TabId;
  t: string;
  a: string;
  owner: AlertOwner;
  staffId?: string;
  who?: string;
}

export function blockedBy(stock: StockItem[], item: MenuItem): string | null {
  for (const [sid, qty] of Object.entries(item.rec)) {
    if (!(qty > 0)) continue;
    const row = stock.find((x) => x.id === sid);
    if (!row) continue;
    if (row.q + 1e-6 < qty) return row.name;
  }
  return null;
}

export function canSell(stock: StockItem[], item: MenuItem) {
  return item.ok && !blockedBy(stock, item);
}

export function offNames(menu: MenuItem[], stock: StockItem[]) {
  return menu.filter((m) => m.ok && blockedBy(stock, m)).map((m) => m.name);
}

export function pulse(s: Snapshot, now = Date.now()): Alert[] {
  const alerts: Alert[] = [];
  const c = s.cfg;
  for (const o of s.orders) {
    if (o.closed) continue;
    const waiter = who(s, o.w);
    if (o.st === "preparing" && o.tp && mins(o.tp, now) > c.prep) {
      alerts.push({
        k: "d",
        tab: "kds",
        owner: "kitchen",
        who: "Cozinha",
        t: `Pedido #${o.n} está em preparação há ${mins(o.tp, now)} min. Esperado: ${c.prep} min.`,
        a: "A cozinha precisa tirar esse pedido do fogo ou avisar o salão.",
      });
    }
    if (o.st === "sent" && mins(o.t0, now) > c.wait) {
      alerts.push({
        k: "w",
        tab: "kds",
        owner: "kitchen",
        who: "Cozinha",
        t: `Pedido #${o.n} aguarda a cozinha há ${mins(o.t0, now)} min.`,
        a: "Cozinha deve iniciar o preparo.",
      });
    }
    if (o.st === "ready" && o.tr && mins(o.tr, now) >= c.wait) {
      alerts.push({
        k: "w",
        tab: "orders",
        owner: "waiter",
        staffId: o.w,
        who: waiter,
        t: `Pedido #${o.n} está pronto há ${mins(o.tr, now)} min sem entrega.`,
        a: `${waiter} deve retirar e entregar na mesa ${o.table}.`,
      });
    }
  }
  const queued = s.orders.filter((o) => o.st === "sent" && !o.closed).length;
  if (queued >= 3) {
    alerts.push({
      k: "w",
      tab: "kds",
      owner: "kitchen",
      who: "Cozinha",
      t: `A cozinha tem ${queued} pedidos aguardando preparo.`,
      a: "Reforce a equipe.",
    });
  }
  for (const t of s.tables) {
    if (t.st === "bill" && paid(s, t.n) < cons(s, t.n)) {
      alerts.push({
        k: "w",
        tab: "caixa",
        owner: "cashier",
        who: "Caixa",
        t: `Mesa ${t.n} aguarda fechamento da conta.`,
        a: "Registre o pagamento no Caixa.",
      });
    }
  }
  for (const item of s.stock) {
    if (item.q > item.min) continue;
    const hit = s.menu.filter((m) => m.ok && m.rec[item.id]).map((m) => m.name);
    const gone = s.menu.filter((m) => m.ok && blockedBy(s.stock, m) === item.name).map((m) => m.name);
    alerts.push({
      k: item.q ? "w" : "d",
      tab: "stock",
      owner: "manager",
      who: "Gerência",
      t: `Estoque baixo: ${item.name}. Atual: ${item.q} ${item.u}. Mínimo: ${item.min} ${item.u}.`,
      a: gone.length ? `Fora do salão agora: ${gone.join(", ")}.` : hit.length ? `Pode afetar: ${hit.join(", ")}.` : "Registre uma entrada.",
    });
  }
  return alerts;
}

export function forRole(list: Alert[], user: Staff | null) {
  if (!user) return [];
  if (user.role === "manager") return list;
  if (user.role === "kitchen") return list.filter((a) => a.owner === "kitchen");
  return list.filter((a) => a.owner === "waiter" && (!a.staffId || a.staffId === user.id));
}

export function closeout(s: Snapshot, now = Date.now()) {
  const delivered = s.orders.filter((o) => o.st === "delivered");
  const sold = delivered.reduce((sum, o) => sum + tot(s, o), 0);
  const received = s.pays.filter((p) => p.st === "confirmed").reduce((sum, p) => sum + p.amount, 0);
  const open = s.tables
    .filter((t) => t.st !== "free")
    .reduce((sum, t) => sum + Math.max(0, +(cons(s, t.n) - paid(s, t.n)).toFixed(2)), 0);
  const late: { t: string; who: string }[] = [];
  for (const o of s.orders) {
    if (o.tp && o.tr && (o.tr - o.tp) / MIN > s.cfg.prep) {
      late.push({ t: `Pedido #${o.n} levou ${Math.round((o.tr - o.tp) / MIN)} min no preparo`, who: "Cozinha" });
    } else if (!o.closed && o.st === "preparing" && o.tp && mins(o.tp, now) > s.cfg.prep) {
      late.push({ t: `Pedido #${o.n} ainda no preparo há ${mins(o.tp, now)} min`, who: "Cozinha" });
    }
    if (o.tr && o.td && mins(o.tr, o.td) >= s.cfg.wait) {
      late.push({ t: `Pedido #${o.n} esperou ${mins(o.tr, o.td)} min no passe`, who: who(s, o.w) });
    } else if (!o.closed && o.st === "ready" && o.tr && mins(o.tr, now) >= s.cfg.wait) {
      late.push({ t: `Pedido #${o.n} pronto há ${mins(o.tr, now)} min`, who: who(s, o.w) });
    }
    if (!o.closed && o.st === "sent" && mins(o.t0, now) > s.cfg.wait) {
      late.push({ t: `Pedido #${o.n} sem início há ${mins(o.t0, now)} min`, who: "Cozinha" });
    }
  }
  const nobaixa = s.orders.filter((o) => (o.st === "preparing" || o.st === "ready" || o.st === "delivered") && !o.ded);
  const blocked = s.menu
    .filter((m) => m.ok && blockedBy(s.stock, m))
    .map((m) => ({ name: m.name, why: blockedBy(s.stock, m) ?? "insumo", price: m.p }));
  return { sold, received, open, late, nobaixa, blocked };
}

export function stats(s: Snapshot) {
  const delivered = s.orders.filter((o) => o.st === "delivered");
  const prepared = s.orders.filter((o) => o.tr && o.tp);
  return {
    n: s.orders.length,
    act: s.orders.filter((o) => o.st !== "delivered").length,
    rev: s.pays.filter((p) => p.st === "confirmed" && !p.closed).reduce((sum, p) => sum + p.amount, 0),
    ticket: delivered.length
      ? delivered.reduce((sum, o) => sum + tot(s, o), 0) / delivered.length
      : null,
    avg: prepared.length
      ? Math.round(prepared.reduce((sum, o) => sum + ((o.tr ?? 0) - (o.tp ?? 0)), 0) / prepared.length / MIN)
      : null,
  };
}

export function tabLabel(role: Role, id: TabId) {
  return TABS[role].find(([k]) => k === id)?.[1] ?? id;
}