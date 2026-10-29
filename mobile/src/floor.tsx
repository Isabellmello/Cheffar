import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ST, TS, blockedBy, brl, can, cons, forRole, mins, pulse, tot, who, type OrderStatus } from "./model";
import { useNow } from "./now";
import { useCheffar } from "./store";
import { Badge, Btn, C, Chip, Empty, Input, Panel, Title } from "./ui";

export function Tables() {
  const snap = useCheffar();
  const go = useCheffar((s) => s.go);
  const selectTable = useCheffar((s) => s.selectTable);
  const requestBill = useCheffar((s) => s.requestBill);
  const askRelease = useCheffar((s) => s.askRelease);
  const ready = snap.orders.filter((o) => o.st === "ready" && !o.closed).length;
  const table = snap.tables.find((t) => t.n === snap.selTable);
  return (
    <View>
      <Title kicker="Salão" title="Mesas" />
      {ready > 0 ? (
        <Panel style={styles.rowBetween}>
          <Text style={styles.body}>
            {ready} pronto(s) para entregar
          </Text>
          {can(snap.user, "orders:view") ? <Btn onPress={() => go("orders")}>Ver</Btn> : null}
        </Panel>
      ) : null}
      <View style={styles.grid}>
        {snap.tables.map((item) => {
          const selected = snap.selTable === item.n;
          return (
            <Pressable
              key={item.n}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Mesa ${item.n}, ${TS[item.st]}`}
              onPress={() => selectTable(item.n)}
              style={[styles.table, selected && styles.tableOn]}
            >
              <Text style={styles.tableN}>{item.n}</Text>
              <Badge tone={item.st === "free" ? "ok" : item.st === "bill" ? "w" : "d"}>{TS[item.st]}</Badge>
              <Text style={styles.meta}>{item.w ? who(snap, item.w) : `${item.seats} lugares`}</Text>
              <Text style={styles.meta}>{item.st !== "free" ? brl(cons(snap, item.n)) : "—"}</Text>
            </Pressable>
          );
        })}
      </View>
      {table ? (
        <View style={styles.actions}>
          <Text style={styles.kicker}>Mesa {table.n}</Text>
          {can(snap.user, "order:create") ? (
            <Btn tone="primary" onPress={() => go("new")}>
              Novo pedido
            </Btn>
          ) : null}
          {can(snap.user, "table:bill") ? <Btn onPress={requestBill}>Pedir conta</Btn> : null}
          {can(snap.user, "table:release") ? (
            <Btn tone="danger" onPress={() => askRelease(table.n)}>
              Liberar mesa
            </Btn>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function NewOrder() {
  const snap = useCheffar();
  const setCat = useCheffar((s) => s.setCat);
  const addToCart = useCheffar((s) => s.addToCart);
  const changeQty = useCheffar((s) => s.changeQty);
  const setNote = useCheffar((s) => s.setNote);
  const setModal = useCheffar((s) => s.setModal);
  const cats = ["Todos", ...new Set(snap.menu.map((m) => m.cat))];
  const total = snap.cart.reduce((sum, item) => sum + item.q * item.p, 0);
  const visible = snap.menu.filter((m) => snap.cat === "Todos" || m.cat === snap.cat);
  return (
    <View>
      <Title kicker={`Mesa ${snap.selTable}`} title="Pedido" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {cats.map((cat) => (
          <Chip key={cat} label={cat} on={snap.cat === cat} onPress={() => setCat(cat)} />
        ))}
      </ScrollView>
      {visible.map((item) => {
        const why = item.ok ? blockedBy(snap.stock, item) : null;
        const sell = item.ok && !why;
        return (
          <Panel key={item.id} style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.strong}>{item.name}</Text>
              <Text style={styles.meta}>
                {brl(item.p)}
                {why ? ` · Sem ${why}` : item.ok ? "" : " · Indisponível"}
              </Text>
            </View>
            <Btn tone="primary" disabled={!sell} onPress={() => addToCart(item.id)}>
              Adicionar
            </Btn>
          </Panel>
        );
      })}
      <Text style={styles.kicker}>Carrinho</Text>
      {snap.cart.length ? (
        snap.cart.map((item, index) => (
          <Panel key={`${item.mid}-${index}`}>
            <View style={styles.rowBetween}>
              <Text style={[styles.strong, styles.flex]}>{item.name}</Text>
              <Pressable accessibilityLabel="Diminuir" onPress={() => changeQty(index, -1)} style={styles.qty}>
                <Text style={styles.qtyText}>−</Text>
              </Pressable>
              <Text style={styles.qtyNum}>{item.q}</Text>
              <Pressable accessibilityLabel="Aumentar" onPress={() => changeQty(index, 1)} style={styles.qty}>
                <Text style={styles.qtyText}>+</Text>
              </Pressable>
            </View>
            <Input
              placeholder="Observação (ex.: sem cebola)"
              accessibilityLabel={`Observação de ${item.name}`}
              value={item.note}
              onChangeText={(note) => setNote(index, note)}
              style={styles.note}
            />
          </Panel>
        ))
      ) : (
        <Empty>Carrinho vazio. Adicione itens do cardápio.</Empty>
      )}
      <View style={styles.actions}>
        <Text style={styles.total}>{brl(total)}</Text>
        <Btn tone="primary" disabled={!snap.cart.length} onPress={() => setModal({ k: "review" })}>
          Conferir e enviar
        </Btn>
      </View>
    </View>
  );
}

export function Orders() {
  const snap = useCheffar();
  const now = useNow();
  const setOrderStatus = useCheffar((s) => s.setOrderStatus);
  const list = snap.orders.filter((o) => snap.user?.role === "manager" || o.w === snap.user?.id);
  const mine = forRole(pulse(snap, now), snap.user);
  return (
    <View>
      <Title kicker="Salão" title="Pedidos" />
      {mine.slice(0, 2).map((alert) => (
        <Panel key={alert.t}>
          <Badge tone={alert.k === "d" ? "d" : "w"}>{alert.who ?? "Você"}</Badge>
          <Text style={styles.body}>{alert.t}</Text>
        </Panel>
      ))}
      {list.length ? (
        list
          .slice()
          .reverse()
          .map((order) => (
            <Panel key={order.id}>
              <View style={styles.rowBetween}>
                <Text style={styles.strong}>
                  #{order.n} · Mesa {order.table}
                </Text>
                <Badge tone={ST[order.st][1] === "wait" ? "w" : ST[order.st][1] === "ok" ? "ok" : "neutral"}>
                  {ST[order.st][0]}
                </Badge>
              </View>
              <Text style={styles.meta}>{mins(order.t0, now)} min</Text>
              {order.items.map((item, index) => (
                <Text key={index} style={styles.meta}>
                  {item.q}× {item.name}
                  {item.note ? ` · ${item.note}` : ""}
                </Text>
              ))}
              <Text style={styles.body}>{brl(tot(snap, order))}</Text>
              {order.st === "ready" && can(snap.user, "order:deliver") ? (
                <Btn tone="primary" onPress={() => void setOrderStatus(order.id, "delivered")}>
                  Confirmar entrega
                </Btn>
              ) : null}
            </Panel>
          ))
      ) : (
        <Empty>Nenhum pedido ainda.</Empty>
      )}
    </View>
  );
}

const COLS: { st: OrderStatus; title: string }[] = [
  { st: "sent", title: "Recebidos" },
  { st: "preparing", title: "Preparo" },
  { st: "ready", title: "Prontos" },
];

export function Kds() {
  const snap = useCheffar();
  const now = useNow();
  const setOrderStatus = useCheffar((s) => s.setOrderStatus);
  const [col, setCol] = useState<OrderStatus>("sent");
  const list = snap.orders.filter((o) => o.st === col && !o.closed);
  const mine = forRole(pulse(snap, now), snap.user);
  return (
    <View>
      <Title kicker="Pass" title="Cozinha" />
      {mine.slice(0, 2).map((alert) => (
        <Panel key={alert.t} style={styles.late}>
          <Badge tone="d">Seu atraso</Badge>
          <Text style={styles.body}>{alert.t}</Text>
        </Panel>
      ))}
      <View style={styles.cols}>
        {COLS.map((column) => {
          const count = snap.orders.filter((o) => o.st === column.st && !o.closed).length;
          return <Chip key={column.st} label={`${column.title} ${count}`} on={col === column.st} onPress={() => setCol(column.st)} />;
        })}
      </View>
      {list.length ? (
        list.map((order) => {
          const mark = col === "preparing" ? order.tp ?? order.t0 : order.t0;
          const late = col === "preparing" ? mins(mark, now) > snap.cfg.prep : col === "sent" && mins(order.t0, now) > snap.cfg.wait;
          return (
            <Panel key={order.id} style={late ? styles.late : undefined}>
              <View style={styles.rowBetween}>
                <Text style={styles.tableN}>#{order.n}</Text>
                <Text style={styles.strong}>{mins(mark, now)} min</Text>
              </View>
              <Text style={styles.meta}>Mesa {order.table}</Text>
              {late ? <Badge tone="d">Atrasado</Badge> : null}
              {order.items.map((item, index) => (
                <Text key={index} style={styles.body}>
                  {item.q}× {item.name}
                  {item.note ? `\nObs: ${item.note}` : ""}
                </Text>
              ))}
              {col === "sent" && can(snap.user, "order:prepare") ? (
                <Btn tone="primary" onPress={() => void setOrderStatus(order.id, "preparing")}>
                  Iniciar preparo
                </Btn>
              ) : null}
              {col === "preparing" && can(snap.user, "order:ready") ? (
                <Btn tone="primary" onPress={() => void setOrderStatus(order.id, "ready")}>
                  Marcar pronto
                </Btn>
              ) : null}
              {col === "ready" ? <Text style={styles.meta}>Aguardando o garçom</Text> : null}
            </Panel>
          );
        })
      ) : (
        <Empty>Nenhum pedido.</Empty>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  flex: { flex: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  table: { backgroundColor: C.surface, borderColor: C.line, borderRadius: 16, borderWidth: 1, padding: 12, width: "48%" },
  tableOn: { borderColor: C.ember },
  tableN: { color: C.fg, fontSize: 28, fontWeight: "700", marginBottom: 8 },
  meta: { color: C.muted, fontSize: 12, marginTop: 4 },
  body: { color: C.fg, fontSize: 14, marginTop: 6 },
  strong: { color: C.fg, fontSize: 15, fontWeight: "700" },
  kicker: { color: C.faint, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" },
  actions: { gap: 8, marginTop: 12 },
  chips: { marginBottom: 12 },
  note: { marginTop: 10 },
  total: { color: C.fg, fontSize: 28, fontWeight: "700" },
  qty: { alignItems: "center", borderColor: C.line, borderRadius: 22, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  qtyText: { color: C.fg, fontSize: 20 },
  qtyNum: { color: C.fg, fontWeight: "700", textAlign: "center", width: 24 },
  cols: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  late: { borderColor: "rgba(226,91,42,0.5)" },
});