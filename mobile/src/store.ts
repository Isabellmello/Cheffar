import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  can,
  companyFromSlug,
  firstTab,
  seed,
  seedFor,
  sleep,
  type CartLine,
  type ModalKind,
  type OrderStatus,
  type PayStatus,
  type Role,
  type Snapshot,
  type TabId,
} from "./model";

export interface Cheffar extends Snapshot {
  toast: string;
  modal: ModalKind;
  payKey: string;
  companySlug: string | null;
  companyName: string;
  setCompany: (slug: string) => Promise<void>;
  login: (email: string) => Promise<void>;
  logout: () => void;
  go: (tab: TabId) => void;
  ping: (message: string) => void;
  setModal: (modal: ModalKind) => void;
  setCat: (cat: string) => void;
  selectTable: (n: number) => void;
  addToCart: (mid: string) => void;
  changeQty: (index: number, delta: number) => void;
  setNote: (index: number, note: string) => void;
  sendOrder: () => void;
  requestBill: () => void;
  askRelease: (n?: number) => void;
  releaseTable: () => void;
  setOrderStatus: (id: string, st: OrderStatus) => Promise<void>;
  registerPayment: (table: number, method: string, raw: string) => Promise<void>;
  setPrice: (id: string, price: number) => void;
  toggleMenu: (id: string) => void;
  adjustStock: (id: string, dir: -1 | 1) => void;
  saveCfg: (prep: number, wait: number) => void;
  toggleUser: (id: string) => void;
  invite: (name: string, email: string, role: Role, perms: string[]) => string | null;
  setUserPerms: (id: string, perms: string[]) => void;
  resetDemo: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

function stamp(s: Snapshot, a: string) {
  return [{ t: Date.now(), u: s.user?.name || "sistema", a }, ...s.audit].slice(0, 80);
}

export const useCheffar = create<Cheffar>()(
  persist(
    (set, get) => {
      const ping = (message: string) => {
        clearTimeout(toastTimer);
        set({ toast: message });
        toastTimer = setTimeout(() => set({ toast: "" }), 2600);
      };
      const guard = (perm: string) => {
        if (can(get().user, perm)) return true;
        ping("Acesso negado.");
        return false;
      };
      return {
        ...seed(),
        toast: "",
        modal: null,
        payKey: `${Date.now()}`,
        companySlug: null,
        companyName: "Cheffar",
        ping,
        setModal: (modal) => set({ modal }),
        go: (tab) => set({ tab, modal: null }),
        setCat: (cat) => set({ cat }),
        selectTable: (n) => set({ selTable: n }),
        setCompany: async (slug: string) => {
          const info = companyFromSlug(slug);
          const storageName = `cheffar-${info.slug}-v1`;

          useCheffar.persist.setOptions({ name: storageName });
          await useCheffar.persist.rehydrate();

          const current = get();
          if (current.rid !== info.rid) {
            const seeded = seedFor(info.slug);
            set({
              ...seeded,
              companySlug: info.slug,
              companyName: info.name,
              user: null,
              toast: "",
              modal: null,
              payKey: `${Date.now()}`,
            });
          } else {
            set({
              companySlug: info.slug,
              companyName: info.name,
            });
          }
        },
        logout: () => set({ user: null, cart: [], modal: null, tab: null, toast: "" }),
        login: async (email) => {
          await sleep(400);
          const user = get().users.find((x) => x.email === email.trim().toLowerCase());
          if (!user) throw new Error("E-mail não encontrado.");
          if (!user.active) throw new Error("Conta desativada. Fale com a gerência.");
          set((s) => ({
            user,
            tab: firstTab(user),
            modal: null,
            audit: stamp({ ...s, user }, "Login"),
          }));
        },
        addToCart: (mid) => {
          const item = get().menu.find((m) => m.id === mid);
          if (!item?.ok) return;
          set((s) => {
            const idx = s.cart.findIndex((c) => c.mid === item.id && !c.note);
            if (idx >= 0) {
              const cart = s.cart.map((c, i) => (i === idx ? { ...c, q: c.q + 1 } : c));
              return { cart };
            }
            const line: CartLine = { mid: item.id, name: item.name, p: item.p, q: 1, note: "" };
            return { cart: [...s.cart, line] };
          });
        },
        changeQty: (index, delta) =>
          set((s) => {
            const current = s.cart[index];
            if (!current) return {};
            const q = current.q + delta;
            const cart = s.cart.flatMap((c, i) => {
              if (i !== index) return [c];
              if (q < 1) return [];
              return [{ ...c, q }];
            });
            return { cart };
          }),
        setNote: (index, note) =>
          set((s) => ({
            cart: s.cart.map((c, i) => (i === index ? { ...c, note } : c)),
          })),
        sendOrder: () => {
          const s = get();
          if (!s.cart.length) return;
          const n = s.seq + 1;
          const order = {
            id: `o${n}`,
            n,
            table: s.selTable,
            w: s.user?.id || "",
            st: "sent" as const,
            t0: Date.now(),
            items: s.cart.map((c) => ({ name: c.name, q: c.q, note: c.note, mid: c.mid })),
          };
          set({
            seq: n,
            orders: [order, ...s.orders],
            cart: [],
            tables: s.tables.map((t) => (t.n === s.selTable ? { ...t, st: "occ" as const, w: s.user?.id || null } : t)),
            audit: stamp(s, `Pedido #${n} enviado (mesa ${s.selTable})`),
          });
          ping(`Pedido #${n} enviado.`);
        },
        requestBill: () => {
          const s = get();
          const n = s.selTable;
          set({
            tables: s.tables.map((t) => (t.n === n ? { ...t, st: "bill" as const } : t)),
            audit: stamp(s, `Conta solicitada (mesa ${n})`),
          });
          ping("Conta solicitada.");
        },
        askRelease: (n) => {
          if (n != null) set({ selTable: n });
          set({ modal: { k: "rel" } });
        },
        releaseTable: () => {
          const s = get();
          const n = s.selTable;
          set({
            orders: s.orders.map((o) => (o.table === n ? { ...o, closed: true } : o)),
            pays: s.pays.map((p) => (p.table === n ? { ...p, closed: true } : p)),
            tables: s.tables.map((t) => (t.n === n ? { ...t, st: "free" as const, w: null } : t)),
            modal: null,
            audit: stamp(s, `Mesa ${n} liberada`),
          });
          ping(`Mesa ${n} liberada.`);
        },
        setOrderStatus: async (id, st) => {
          const perm = st === "preparing" ? "order:prepare" : st === "ready" ? "order:ready" : "order:deliver";
          if (!guard(perm)) return;
          const s = get();
          const order = s.orders.find((o) => o.id === id);
          if (!order) return;
          const now = Date.now();
          let audit = stamp(s, `Pedido #${order.n}: ${st}`);
          let stock = s.stock;
          if (st === "preparing" && !order.ded) {
            stock = s.stock.map((item) => ({ ...item }));
            for (const line of order.items) {
              const recipe = s.menu.find((m) => m.id === line.mid)?.rec ?? {};
              for (const [sid, qty] of Object.entries(recipe)) {
                const item = stock.find((x) => x.id === sid);
                if (!item) continue;
                const delta = +(qty * line.q).toFixed(2);
                item.q = Math.max(0, +(item.q - delta).toFixed(2));
                audit = [{ t: now, u: s.user?.name || "sistema", a: `Estoque: ${item.name} −${delta} ${item.u} (pedido #${order.n})` }, ...audit].slice(0, 80);
              }
            }
          }
          set({
            stock,
            audit,
            orders: s.orders.map((o) =>
              o.id !== id
                ? o
                : {
                    ...o,
                    st,
                    ded: st === "preparing" ? true : o.ded,
                    ...(st === "preparing" ? { tp: now } : {}),
                    ...(st === "ready" ? { tr: now } : {}),
                    ...(st === "delivered" ? { td: now } : {}),
                  },
            ),
          });
          if (st === "ready") ping("Marcado como pronto. O garçom foi avisado.");
          if (st === "delivered") ping("Entrega confirmada.");
        },
        registerPayment: async (table, method, raw) => {
          if (!guard("pay:write")) return;
          const s = get();
          const open = s.orders.filter((o) => o.table === table && !o.closed);
          const due = open.reduce(
            (sum, o) => sum + o.items.reduce((line, i) => line + i.q * (s.menu.find((m) => m.id === i.mid)?.p ?? 0), 0),
            0,
          );
          const got = s.pays
            .filter((p) => p.table === table && !p.closed && (p.st === "confirmed" || p.st === "pending"))
            .reduce((sum, p) => sum + p.amount, 0);
          const rest = +((due - got).toFixed(2));
          const amount = raw.trim() === "" ? rest : +raw;
          if (!(amount > 0) || amount > rest + 0.001) {
            ping(`Valor inválido. Máximo: ${rest.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
            return;
          }
          if (open.some((o) => o.st !== "delivered")) {
            ping("Há pedidos não entregues nesta mesa.");
            return;
          }
          if (s.pays.some((p) => p.key === s.payKey)) {
            ping("Pagamento já registrado.");
            return;
          }
          const payment = {
            id: `p${s.pays.length + 1}`,
            key: s.payKey,
            table,
            amount,
            method,
            st: "pending" as PayStatus,
            t: Date.now(),
          };
          set({ pays: [...s.pays, payment], payKey: `${Date.now()}` });
          try {
            await sleep(900);
            const ref = `SIM-${payment.id}`;
            set((cur) => ({
              pays: cur.pays.map((p) => (p.id === payment.id ? { ...p, st: "confirmed" as const, ref } : p)),
              audit: stamp(get(), `Pagamento ${amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${method}) mesa ${table}, ref ${ref}`),
            }));
            ping("Confirmado pelo servidor (simulado).");
          } catch {
            set((cur) => ({
              pays: cur.pays.map((p) => (p.id === payment.id ? { ...p, st: "failed" as const } : p)),
            }));
            ping("Falha ao confirmar. Nada foi cobrado.");
          }
        },
        setPrice: (id, price) => {
          if (!guard("menu:edit")) return;
          const item = get().menu.find((m) => m.id === id);
          if (!item || !(price > 0) || price === item.p) return;
          const before = item.p;
          set((s) => ({
            menu: s.menu.map((m) => (m.id === id ? { ...m, p: price } : m)),
            audit: stamp(
              s,
              `Preço de ${item.name}: ${before.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} → ${price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
            ),
          }));
          ping("Preço atualizado.");
        },
        toggleMenu: (id) => {
          if (!guard("menu:edit")) return;
          const item = get().menu.find((m) => m.id === id);
          if (!item) return;
          set((s) => ({
            menu: s.menu.map((m) => (m.id === id ? { ...m, ok: !m.ok } : m)),
            audit: stamp(s, `${item.name} ${item.ok ? "desativado" : "ativado"}`),
          }));
        },
        adjustStock: (id, dir) => {
          if (!guard("stock:write")) return;
          const item = get().stock.find((x) => x.id === id);
          if (!item) return;
          const next = +(item.q + dir * item.step).toFixed(2);
          if (next < 0) return;
          set((s) => ({
            stock: s.stock.map((x) => (x.id === id ? { ...x, q: next } : x)),
            audit: stamp(s, `Estoque: ${item.name} ${dir > 0 ? "+" : "−"}${item.step} ${item.u}`),
          }));
        },
        saveCfg: (prep, wait) => {
          if (!guard("cfg:write")) return;
          if (!(prep > 0) || !(wait > 0)) {
            ping("Informe tempos válidos.");
            return;
          }
          set((s) => ({
            cfg: { prep, wait },
            audit: stamp(s, `Metas: preparo ${prep} min, espera ${wait} min`),
          }));
          ping("Metas salvas.");
        },
        toggleUser: (id) => {
          if (!guard("users:write")) return;
          const person = get().users.find((u) => u.id === id);
          if (!person) return;
          set((s) => ({
            users: s.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)),
            audit: stamp(s, `${person.name} ${person.active ? "desativado" : "ativado"}`),
          }));
        },
        invite: (name, email, role, perms) => {
          if (!guard("users:write")) return "Acesso negado.";
          const s = get();
          const clean = email.trim().toLowerCase();
          if (name.trim().length < 3) return "Informe o nome completo.";
          if (!/^\S+@\S+\.\S+$/.test(clean)) return "Informe um e-mail válido.";
          if (s.users.some((u) => u.email === clean)) return "Este e-mail já está cadastrado.";
          if (!perms.length) return "Marque ao menos uma permissão.";
          const person = {
            id: `u${Date.now()}`,
            name: name.trim(),
            email: clean,
            role,
            active: true,
            perms: [...perms],
          };
          set({
            users: [...s.users, person],
            audit: stamp(s, `Cadastro: ${person.name} (${role})`),
          });
          ping("Funcionário cadastrado.");
          return null;
        },
        setUserPerms: (id, perms) => {
          if (!guard("users:write")) return;
          if (!perms.length) {
            ping("Marque ao menos uma permissão.");
            return;
          }
          const person = get().users.find((u) => u.id === id);
          if (!person) return;
          const next = id === get().user?.id ? Array.from(new Set([...perms, "users", "users:write"])) : [...perms];
          set((s) => ({
            users: s.users.map((u) => (u.id === id ? { ...u, perms: next } : u)),
            user: s.user?.id === id ? { ...s.user, perms: next } : s.user,
            audit: stamp(s, `Permissões de ${person.name} atualizadas`),
          }));
          ping("Permissões atualizadas.");
        },
        resetDemo: () => {
          const email = get().user?.email;
          const slug = get().companySlug ?? "demo";
          const next = seedFor(slug);
          const user = next.users.find((u) => u.email === email) ?? null;
          set({
            ...next,
            companySlug: slug,
            companyName: get().companyName,
            user,
            tab: user ? firstTab(user) : null,
            toast: "",
            modal: null,
            payKey: `${Date.now()}`,
          });
          ping("Demonstração reiniciada.");
        },
      };
    },
    {
      name: "cheffar-demo-v1",
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: (s) => ({
        rid: s.rid,
        cfg: s.cfg,
        cart: s.cart,
        selTable: s.selTable,
        cat: s.cat,
        tab: s.tab,
        user: s.user,
        seq: s.seq,
        users: s.users,
        tables: s.tables,
        stock: s.stock,
        menu: s.menu,
        orders: s.orders,
        pays: s.pays,
        audit: s.audit,
        payKey: s.payKey,
        companySlug: s.companySlug,
        companyName: s.companyName,
      }),
    },
  ),
);