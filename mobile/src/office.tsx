import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  NEED,
  PERM_GROUPS,
  PERM_LABEL,
  ROLES,
  brl,
  can,
  cons,
  openOrders,
  paid,
  permsOf,
  pulse,
  stats,
  type Alert,
  type Role,
} from "./model";
import { useNow } from "./now";
import { useCheffar } from "./store";
import { Badge, Btn, C, Chip, Empty, Field, Input, Panel, SectionLabel, Title } from "./ui";

export function Alerts({ list }: { list: Alert[] }) {
  const go = useCheffar((s) => s.go);
  const user = useCheffar((s) => s.user);
  if (!list.length) return <Empty>Nenhum alerta. A operação está dentro das metas.</Empty>;
  return (
    <View>
      {list.map((alert, i) => (
        <Panel key={`${alert.t}-${i}`}>
          <Badge tone={alert.k === "d" ? "d" : "w"}>{alert.k === "d" ? "Crítico" : "Atenção"}</Badge>
          <Text style={styles.body}>{alert.t}</Text>
          <Text style={styles.meta}>{alert.a}</Text>
          {alert.tab && can(user, NEED[alert.tab]) ? (
            <View style={styles.gap}>
              <Btn onPress={() => go(alert.tab!)}>Abrir</Btn>
            </View>
          ) : null}
        </Panel>
      ))}
    </View>
  );
}

export function Dash() {
  const snap = useCheffar();
  const now = useNow();
  const s = stats(snap);
  const alerts = pulse(snap, now);
  const busy = snap.tables.filter((t) => t.st !== "free").length;
  return (
    <View>
      <Title kicker="Casa Demo" title="Painel" />
      <View style={styles.grid}>
        <Kpi value={String(s.act)} label="Pedidos em andamento" />
        <Kpi value={`${busy}/${snap.tables.length}`} label="Mesas ocupadas" />
        <Kpi value={s.ticket == null ? "—" : brl(s.ticket)} label="Ticket médio entregue" />
        <Kpi value={String(alerts.length)} label="Alertas ativos" />
      </View>
      <SectionLabel>Atenção agora</SectionLabel>
      <Alerts list={alerts.slice(0, 3)} />
    </View>
  );
}

function Kpi({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.meta}>{label}</Text>
    </View>
  );
}

export function Pulse() {
  const snap = useCheffar();
  const now = useNow();
  const saveCfg = useCheffar((s) => s.saveCfg);
  const s = stats(snap);
  const low = snap.stock.filter((x) => x.q <= x.min).length;
  const [prep, setPrep] = useState(String(snap.cfg.prep));
  const [wait, setWait] = useState(String(snap.cfg.wait));
  return (
    <View>
      <Title kicker="Turno" title="Pulse" />
      <Panel>
        <View style={styles.grid}>
          <Stat k="Pedidos" v={String(s.n)} />
          <Stat k="Pendentes" v={String(s.act)} />
          <Stat k="Confirmado" v={brl(s.rev)} />
          <Stat k="Preparo médio" v={s.avg == null ? "sem dados" : `${s.avg} min`} />
          <Stat k="Estoque baixo" v={String(low)} />
        </View>
      </Panel>
      <SectionLabel>Alertas</SectionLabel>
      <Alerts list={pulse(snap, now)} />
      <SectionLabel>Movimento</SectionLabel>
      <Empty>Ainda não há histórico suficiente para prever horários de pico. O Pulse precisa acumular pedidos de vários dias.</Empty>
      <SectionLabel>Metas de tempo</SectionLabel>
      <Panel>
        <Field label="Preparo esperado (min)">
          <Input keyboardType="number-pad" value={prep} onChangeText={setPrep} />
        </Field>
        <Field label="Espera máxima por etapa (min)">
          <Input keyboardType="number-pad" value={wait} onChangeText={setWait} />
        </Field>
        <Btn tone="primary" onPress={() => saveCfg(+prep, +wait)}>
          Salvar metas
        </Btn>
      </Panel>
    </View>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.meta}>{k}</Text>
      <Text style={styles.statValue}>{v}</Text>
    </View>
  );
}

export function Caixa() {
  const snap = useCheffar();
  const registerPayment = useCheffar((s) => s.registerPayment);
  const askRelease = useCheffar((s) => s.askRelease);
  const user = snap.user;
  const busy = snap.tables.filter((t) => t.st !== "free");
  const [table, setTable] = useState<number | null>(busy.find((t) => t.st === "bill")?.n ?? null);
  const [method, setMethod] = useState("Pix");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const rest = table == null ? 0 : +(cons(snap, table) - paid(snap, table)).toFixed(2);
  const pending = table != null && openOrders(snap, table).some((o) => o.st !== "delivered");
  const pay = async () => {
    if (table == null || sending) return;
    setSending(true);
    try {
      await registerPayment(table, method, amount);
      setAmount("");
    } finally {
      setSending(false);
    }
  };
  return (
    <View>
      <Title kicker="Fechamento" title="Caixa" />
      <View style={styles.wrap}>
        {busy.map((t) => (
          <Chip
            key={t.n}
            label={`Mesa ${t.n}`}
            on={table === t.n}
            onPress={() => {
              setTable(t.n);
              setAmount("");
            }}
          />
        ))}
      </View>
      {table == null ? (
        <Empty>Escolha uma mesa ocupada para ver o consumo.</Empty>
      ) : (
        <Panel>
          {openOrders(snap, table).flatMap((o) =>
            o.items.map((item, index) => (
              <View key={`${o.id}-${index}`} style={styles.line}>
                <Text style={styles.body}>
                  {item.q}× {item.name}
                </Text>
                <Text style={styles.meta}>{brl(item.q * (snap.menu.find((m) => m.id === item.mid)?.p ?? 0))}</Text>
              </View>
            )),
          )}
          <Sum label="Consumo" value={brl(cons(snap, table))} strong />
          <Sum label="Pago ou em confirmação" value={brl(paid(snap, table))} />
          <Sum label="Restante" value={brl(rest)} strong />
          {pending ? <Text style={styles.gold}>Ainda há pedidos não entregues nesta mesa.</Text> : null}
        </Panel>
      )}
      {table != null && rest > 0 ? (
        <Panel>
          <Text style={styles.kicker}>Forma de pagamento</Text>
          <View style={styles.wrap}>
            {["Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito"].map((name) => (
              <Chip key={name} label={name} on={method === name} onPress={() => setMethod(name)} />
            ))}
          </View>
          <Field label="Valor (vazio = restante)">
            <Input keyboardType="decimal-pad" placeholder={brl(rest)} value={amount} onChangeText={setAmount} />
          </Field>
          <Btn tone="primary" disabled={sending} onPress={() => void pay()}>
            {sending ? "Confirmando…" : "Registrar pagamento"}
          </Btn>
          <Text style={styles.hint}>Cada pagamento só vale após a confirmação. Nesta demonstração a confirmação é simulada.</Text>
        </Panel>
      ) : null}
      {table != null && rest <= 0 ? (
        <Panel>
          <Badge tone="ok">Conta quitada</Badge>
          <Text style={styles.meta}>A mesa pode voltar ao salão.</Text>
          {can(user, "table:release") ? (
            <View style={styles.gap}>
              <Btn tone="danger" onPress={() => askRelease(table)}>
                {`Liberar mesa ${table}`}
              </Btn>
            </View>
          ) : (
            <Text style={styles.meta}>A gerência libera a mesa.</Text>
          )}
        </Panel>
      ) : null}
      <SectionLabel>Pagamentos</SectionLabel>
      {snap.pays.length ? (
        snap.pays
          .slice()
          .reverse()
          .map((p) => (
            <Panel key={p.id} style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.strong}>
                  Mesa {p.table} · {p.method}
                </Text>
                <Text style={styles.meta}>{brl(p.amount)}</Text>
              </View>
              <Badge tone={p.st === "confirmed" ? "ok" : p.st === "pending" ? "w" : "d"}>
                {p.st === "confirmed" ? "Confirmado" : p.st === "pending" ? "Aguardando" : "Falhou"}
              </Badge>
            </Panel>
          ))
      ) : (
        <Empty>Nenhum pagamento registrado.</Empty>
      )}
    </View>
  );
}

function Sum({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={strong ? styles.strong : styles.meta}>{label}</Text>
      <Text style={strong ? styles.strong : styles.meta}>{value}</Text>
    </View>
  );
}

export function Stock() {
  const stock = useCheffar((s) => s.stock);
  const adjust = useCheffar((s) => s.adjustStock);
  const canWrite = useCheffar((s) => can(s.user, "stock:write"));
  return (
    <View>
      <Title kicker="Insumos" title="Estoque" />
      {stock.map((item) => {
        const pct = Math.min(100, (item.q / (item.min * 2)) * 100);
        const low = item.q <= item.min;
        return (
          <Panel key={item.id}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.strong}>{item.name}</Text>
                <Text style={styles.meta}>
                  Mínimo {item.min} {item.u}
                </Text>
              </View>
              <Text style={styles.statValue}>
                {item.q} {item.u}
              </Text>
            </View>
            {item.q === 0 ? <Badge tone="d">Sem estoque</Badge> : low ? <Badge tone="w">Baixo</Badge> : null}
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${pct}%` }, low ? styles.barLow : styles.barOk]} />
            </View>
            {canWrite ? (
              <View style={styles.two}>
                <View style={styles.flex}>
                  <Btn onPress={() => adjust(item.id, -1)}>{`− ${item.step}`}</Btn>
                </View>
                <View style={styles.flex}>
                  <Btn tone="primary" onPress={() => adjust(item.id, 1)}>{`+ ${item.step}`}</Btn>
                </View>
              </View>
            ) : null}
          </Panel>
        );
      })}
      <Text style={styles.hint}>Itens com ficha técnica baixam estoque uma única vez, quando a cozinha inicia o preparo.</Text>
    </View>
  );
}

export function MenuAdm() {
  const menu = useCheffar((s) => s.menu);
  const setPrice = useCheffar((s) => s.setPrice);
  const toggleMenu = useCheffar((s) => s.toggleMenu);
  const ping = useCheffar((s) => s.ping);
  return (
    <View>
      <Title kicker="Casa Demo" title="Cardápio" />
      {menu.map((item) => (
        <Panel key={item.id}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.strong}>{item.name}</Text>
              <Text style={styles.meta}>{item.cat}</Text>
            </View>
            <Badge tone={item.ok ? "ok" : "d"}>{item.ok ? "No salão" : "Fora"}</Badge>
          </View>
          <Field label="Preço">
            <Input
              keyboardType="decimal-pad"
              accessibilityLabel={`Preço de ${item.name}`}
              defaultValue={String(item.p)}
              key={`${item.id}-${item.p}`}
              onEndEditing={(e) => {
                const v = +e.nativeEvent.text;
                if (!(v > 0)) {
                  ping("Preço deve ser maior que zero.");
                  return;
                }
                setPrice(item.id, v);
              }}
            />
          </Field>
          <Btn tone={item.ok ? "ghost" : "primary"} onPress={() => toggleMenu(item.id)}>
            {item.ok ? "Marcar indisponível" : "Marcar disponível"}
          </Btn>
        </Panel>
      ))}
    </View>
  );
}

export function Team() {
  const users = useCheffar((s) => s.users);
  const me = useCheffar((s) => s.user);
  const toggleUser = useCheffar((s) => s.toggleUser);
  const invite = useCheffar((s) => s.invite);
  const setUserPerms = useCheffar((s) => s.setUserPerms);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("waiter");
  const [perms, setPerms] = useState<string[]>(ROLES.waiter.perms);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const toggle = (list: string[], perm: string, set: (next: string[]) => void) => {
    set(list.includes(perm) ? list.filter((item) => item !== perm) : [...list, perm]);
  };
  return (
    <View>
      <Title kicker="Administração" title="Equipe" />
      <SectionLabel>Cadastrar funcionário</SectionLabel>
      <Panel>
        <Field label="Nome completo">
          <Input value={name} onChangeText={setName} />
        </Field>
        <Field label="E-mail">
          <Input autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        </Field>
        <Text style={styles.kicker}>Cargo</Text>
        <View style={styles.wrap}>
          {(Object.entries(ROLES) as [Role, { label: string }][]).map(([key, value]) => (
            <Chip
              key={key}
              label={value.label}
              on={role === key}
              onPress={() => {
                setRole(key);
                setPerms([...ROLES[key].perms]);
              }}
            />
          ))}
        </View>
        <Text style={styles.meta}>O cargo só sugere o pacote. Marque o que essa pessoa pode fazer.</Text>
        <PermGrid value={perms} onToggle={(perm) => toggle(perms, perm, setPerms)} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Btn
          tone="primary"
          onPress={() => {
            const err = invite(name, email, role, perms);
            setError(err ?? "");
            if (!err) {
              setName("");
              setEmail("");
              setRole("waiter");
              setPerms([...ROLES.waiter.perms]);
            }
          }}
        >
          Cadastrar funcionário
        </Btn>
        <Text style={styles.hint}>A pessoa entra com o e-mail cadastrado e qualquer senha de 4 ou mais caracteres.</Text>
      </Panel>
      <SectionLabel>Funcionários</SectionLabel>
      {users.map((person) => {
        const own = person.id === me?.id;
        const open = openId === person.id;
        const granted = permsOf(person);
        return (
          <Panel key={person.id}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.strong}>{person.name}</Text>
                <Text style={styles.meta}>{person.email}</Text>
              </View>
              <Badge>{ROLES[person.role].label}</Badge>
            </View>
            <Text style={styles.meta}>
              {granted.length} {granted.length === 1 ? "permissão" : "permissões"}
            </Text>
            {!person.active ? <Badge tone="d">Desativada</Badge> : <Text style={styles.ok}>Ativa</Text>}
            {own ? (
              <Text style={styles.meta}>Você</Text>
            ) : (
              <View style={styles.two}>
                <View style={styles.flex}>
                  <Btn
                    onPress={() => {
                      if (open) {
                        setOpenId(null);
                        return;
                      }
                      setOpenId(person.id);
                      setDraft(permsOf(person));
                    }}
                  >
                    {open ? "Fechar" : "Permissões"}
                  </Btn>
                </View>
                <View style={styles.flex}>
                  <Btn onPress={() => toggleUser(person.id)}>{person.active ? "Desativar" : "Ativar"}</Btn>
                </View>
              </View>
            )}
            {open && !own ? (
              <View>
                <PermGrid value={draft} onToggle={(perm) => toggle(draft, perm, setDraft)} />
                <Btn tone="primary" onPress={() => setUserPerms(person.id, draft)}>
                  Salvar permissões
                </Btn>
              </View>
            ) : null}
          </Panel>
        );
      })}
    </View>
  );
}

function PermGrid({ value, onToggle }: { value: string[]; onToggle: (perm: string) => void }) {
  return (
    <View style={styles.gap}>
      {PERM_GROUPS.map((group) => (
        <View key={group.title}>
          <Text style={styles.kicker}>{group.title}</Text>
          <View style={styles.wrap}>
            {group.perms.map((perm) => (
              <Chip key={perm} label={PERM_LABEL[perm] ?? perm} on={value.includes(perm)} onPress={() => onToggle(perm)} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export function Audit() {
  const audit = useCheffar((s) => s.audit);
  return (
    <View>
      <Title kicker="Turno" title="Histórico" />
      <Text style={styles.meta}>Registro local de demonstração. Auditoria confiável depende do servidor.</Text>
      {audit.slice(0, 40).map((entry, i) => (
        <Panel key={`${entry.t}-${i}`}>
          <Text style={styles.strong}>{entry.a}</Text>
          <Text style={styles.meta}>
            {entry.u} ·{" "}
            {new Date(entry.t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
          </Text>
        </Panel>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  kpi: { backgroundColor: C.surface, borderColor: C.line, borderRadius: 16, borderWidth: 1, padding: 14, width: "48%" },
  kpiValue: { color: C.fg, fontSize: 26, fontWeight: "700" },
  meta: { color: C.muted, fontSize: 13, marginTop: 4 },
  body: { color: C.fg, fontSize: 14, marginTop: 8 },
  strong: { color: C.fg, fontSize: 15, fontWeight: "700" },
  stat: { width: "48%" },
  statValue: { color: C.fg, fontSize: 22, fontWeight: "700", marginTop: 4 },
  wrap: { flexDirection: "row", flexWrap: "wrap" },
  line: { flexDirection: "row", justifyContent: "space-between", marginVertical: 3 },
  row: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  flex: { flex: 1 },
  gold: { color: C.gold, fontSize: 14, marginTop: 8 },
  kicker: { color: C.faint, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" },
  hint: { color: C.faint, fontSize: 12, lineHeight: 18, marginTop: 10 },
  error: { color: C.ember, fontSize: 14, marginBottom: 8 },
  gap: { marginTop: 10 },
  bar: { backgroundColor: C.surface2, borderRadius: 99, height: 6, marginVertical: 10, overflow: "hidden" },
  barFill: { height: 6 },
  barLow: { backgroundColor: C.ember },
  barOk: { backgroundColor: C.sage },
  two: { flexDirection: "row", gap: 8, marginTop: 8 },
  ok: { color: C.sage, fontSize: 13, marginVertical: 6 },
});
