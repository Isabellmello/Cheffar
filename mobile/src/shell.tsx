import { useEffect, useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audit, Caixa, Dash, MenuAdm, Pulse, Stock, Team } from "./office";
import { Kds, NewOrder, Orders, Tables } from "./floor";
import { NEED, ROLES, brl, can, primaryFor, tabsFor, type TabId } from "./model";
import { NowProvider } from "./now";
import { useCheffar } from "./store";
import { Btn, C, Field, Input } from "./ui";

export function CheffarApp() {
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsub = useCheffar.persist.onFinishHydration(finish);
    if (useCheffar.persist.hasHydrated()) finish();
    else void useCheffar.persist.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, [hydrated]);

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.boot}>
        <Text style={styles.kicker}>Casa Demo</Text>
        <Text style={styles.brand}>Cheffar</Text>
        <Text style={styles.muted}>Abrindo o turno…</Text>
      </SafeAreaView>
    );
  }

  return (
    <NowProvider value={now}>
      <Gate />
    </NowProvider>
  );
}

function Gate() {
  const user = useCheffar((s) => s.user);
  if (!user) return <Login />;
  return <Frame />;
}

function Login() {
  const users = useCheffar((s) => s.users);
  const login = useCheffar((s) => s.login);
  const setModal = useCheffar((s) => s.setModal);
  const modal = useCheffar((s) => s.modal);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (password.length < 4) {
      setError("A senha precisa ter 4 ou mais caracteres.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Cheffar</Text>
        <Text style={styles.muted}>Salão, caixa e cozinha no mesmo turno.</Text>
        <View style={styles.form}>
          <Field label="E-mail">
            <Input autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          </Field>
          <Field label="Senha">
            <View style={styles.passRow}>
              <View style={styles.flex}>
                <Input secureTextEntry={!show} value={password} onChangeText={setPassword} />
              </View>
              <Pressable accessibilityLabel="Mostrar ou ocultar senha" onPress={() => setShow((v) => !v)} style={styles.eye}>
                <Text style={styles.eyeText}>{show ? "Ocultar" : "Ver"}</Text>
              </Pressable>
            </View>
          </Field>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Btn tone="primary" disabled={busy} onPress={() => void submit()}>
            {busy ? "Entrando…" : "Entrar"}
          </Btn>
        </View>
        <Pressable onPress={() => setModal({ k: "forgot" })}>
          <Text style={styles.link}>Esqueci minha senha</Text>
        </Pressable>
        <Text style={styles.kicker}>Entrar como</Text>
        <Text style={styles.muted}>Qualquer senha com 4 ou mais caracteres. A mesa 3 já espera o caixa.</Text>
        {users
          .filter((u) => u.active)
          .map((person) => (
            <Pressable
              key={person.id}
              onPress={() => {
                setEmail(person.email);
                setPassword("demo1234");
                setError("");
              }}
              style={styles.person}
            >
              <View>
                <Text style={styles.strong}>{person.name}</Text>
                <Text style={styles.muted}>{ROLES[person.role].label}</Text>
              </View>
              <Text style={styles.link}>Preencher</Text>
            </Pressable>
          ))}
      </ScrollView>
      {modal?.k === "forgot" ? <Forgot /> : null}
      <Toasts />
    </SafeAreaView>
  );
}

function Forgot() {
  const setModal = useCheffar((s) => s.setModal);
  const ping = useCheffar((s) => s.ping);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  return (
    <Sheet title="Recuperar senha" onClose={() => setModal(null)}>
      <Field label="E-mail">
        <Input autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      </Field>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.muted}>Demonstração: nenhum e-mail é enviado de verdade.</Text>
      <View style={styles.two}>
        <View style={styles.flex}>
          <Btn onPress={() => setModal(null)}>Cancelar</Btn>
        </View>
        <View style={styles.flex}>
          <Btn
            tone="primary"
            onPress={() => {
              if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
                setError("Informe um e-mail válido.");
                return;
              }
              setModal(null);
              ping("Pedido de recuperação registrado (simulado).");
            }}
          >
            Enviar link
          </Btn>
        </View>
      </View>
    </Sheet>
  );
}

function Frame() {
  const user = useCheffar((s) => s.user)!;
  const tab = useCheffar((s) => s.tab);
  const go = useCheffar((s) => s.go);
  const modal = useCheffar((s) => s.modal);
  const logout = useCheffar((s) => s.logout);
  const items = tabsFor(user);
  const primary = primaryFor(user);
  const showMore = items.length > primary.length;
  const allowed = tab ? can(user, NEED[tab]) : false;

  useEffect(() => {
    if (!tab || !can(user, NEED[tab])) {
      const first = tabsFor(user)[0]?.[0];
      if (first && first !== tab) go(first);
    }
  }, [tab, user, go]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.strong} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.muted}>{ROLES[user.role].label}</Text>
        </View>
        <Pressable accessibilityLabel="Sair" onPress={logout}>
          <Text style={styles.link}>Sair</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        {allowed && tab ? <Screen tab={tab} /> : <Text style={styles.brand}>Acesso negado</Text>}
      </ScrollView>
      {primary.length > 1 ? (
        <SafeAreaView edges={["bottom"]} style={styles.tabbar}>
          {primary.map((id) => {
            const label = items.find(([k]) => k === id)?.[1] ?? id;
            return (
              <Pressable key={id} onPress={() => go(id)} style={styles.tab}>
                <Text style={tab === id ? styles.tabOn : styles.tabOff} numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
          {showMore ? (
            <Pressable onPress={() => useCheffar.getState().setModal({ k: "more" })} style={styles.tab}>
              <Text style={styles.tabOff}>Mais</Text>
            </Pressable>
          ) : null}
        </SafeAreaView>
      ) : null}
      {modal?.k === "more" ? <More extra={items.filter(([id]) => !primary.includes(id))} /> : null}
      {modal?.k === "review" ? <Review /> : null}
      {modal?.k === "rel" ? <Release /> : null}
      <Toasts />
    </SafeAreaView>
  );
}

function Screen({ tab }: { tab: TabId }) {
  switch (tab) {
    case "dash":
      return <Dash />;
    case "pulse":
      return <Pulse />;
    case "caixa":
      return <Caixa />;
    case "stock":
      return <Stock />;
    case "menu":
      return <MenuAdm />;
    case "users":
      return <Team />;
    case "audit":
      return <Audit />;
    case "tables":
      return <Tables />;
    case "new":
      return <NewOrder />;
    case "orders":
      return <Orders />;
    case "kds":
      return <Kds />;
    default:
      return <Text style={styles.muted}>Acesso negado</Text>;
  }
}

function More({ extra }: { extra: [TabId, string][] }) {
  const go = useCheffar((s) => s.go);
  const setModal = useCheffar((s) => s.setModal);
  const resetDemo = useCheffar((s) => s.resetDemo);
  const logout = useCheffar((s) => s.logout);
  return (
    <Sheet title="Mais" onClose={() => setModal(null)}>
      {extra.map(([id, label]) => (
        <View key={id} style={styles.moreBtn}>
          <Btn onPress={() => go(id)}>{label}</Btn>
        </View>
      ))}
      <View style={styles.moreBtn}>
        <Btn onPress={resetDemo}>Reiniciar demonstração</Btn>
      </View>
      <Btn onPress={logout}>Sair</Btn>
    </Sheet>
  );
}

function Review() {
  const snap = useCheffar();
  const sendOrder = useCheffar((s) => s.sendOrder);
  const setModal = useCheffar((s) => s.setModal);
  const total = snap.cart.reduce((sum, item) => sum + item.q * item.p, 0);
  return (
    <Sheet title={`Mesa ${snap.selTable}`} onClose={() => setModal(null)}>
      {snap.cart.map((item, index) => (
        <Text key={index} style={styles.body}>
          {item.q}× {item.name}
          {item.note ? ` (${item.note})` : ""}
        </Text>
      ))}
      <Text style={styles.total}>{brl(total)}</Text>
      <View style={styles.two}>
        <View style={styles.flex}>
          <Btn onPress={() => setModal(null)}>Voltar</Btn>
        </View>
        <View style={styles.flex}>
          <Btn tone="primary" onPress={sendOrder}>
            Enviar à cozinha
          </Btn>
        </View>
      </View>
    </Sheet>
  );
}

function Release() {
  const table = useCheffar((s) => s.selTable);
  const setModal = useCheffar((s) => s.setModal);
  const releaseTable = useCheffar((s) => s.releaseTable);
  return (
    <Sheet title={`Liberar mesa ${table}?`} onClose={() => setModal(null)}>
      <Text style={styles.muted}>A conta está quitada. A mesa volta a ficar livre e o consumo vai para o histórico.</Text>
      <View style={styles.two}>
        <View style={styles.flex}>
          <Btn onPress={() => setModal(null)}>Cancelar</Btn>
        </View>
        <View style={styles.flex}>
          <Btn tone="danger" onPress={releaseTable}>
            Liberar
          </Btn>
        </View>
      </View>
    </Sheet>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{title}</Text>
        {children}
      </View>
    </Modal>
  );
}

function Toasts() {
  const toast = useCheffar((s) => s.toast);
  if (!toast) return null;
  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{toast}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, flex: 1 },
  boot: { alignItems: "center", backgroundColor: C.bg, flex: 1, justifyContent: "center" },
  pad: { padding: 16, paddingBottom: 32 },
  brand: { color: C.fg, fontSize: 42, fontWeight: "700" },
  kicker: { color: C.faint, fontSize: 12, fontWeight: "700", letterSpacing: 0.8, marginTop: 20, textTransform: "uppercase" },
  muted: { color: C.muted, fontSize: 14, marginTop: 6 },
  form: { marginTop: 24 },
  passRow: { flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  eye: { alignItems: "center", borderColor: C.line, borderRadius: 12, borderWidth: 1, height: 48, justifyContent: "center", width: 72 },
  eyeText: { color: C.fg, fontSize: 13, fontWeight: "700" },
  error: { color: C.ember, fontSize: 14, marginBottom: 8 },
  link: { color: C.ember, fontSize: 14, fontWeight: "700", marginVertical: 12 },
  person: { alignItems: "center", backgroundColor: C.surface, borderColor: C.line, borderRadius: 16, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 8, padding: 14 },
  strong: { color: C.fg, fontSize: 15, fontWeight: "700" },
  header: { alignItems: "center", borderBottomColor: C.line, borderBottomWidth: 1, flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10 },
  tabbar: { backgroundColor: C.surface, borderTopColor: C.line, borderTopWidth: 1, flexDirection: "row" },
  tab: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 52, paddingHorizontal: 2 },
  tabOn: { color: C.ember, fontSize: 12, fontWeight: "700" },
  tabOff: { color: C.muted, fontSize: 12, fontWeight: "600" },
  backdrop: { backgroundColor: "rgba(18,16,14,0.7)", flex: 1 },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetTitle: { color: C.fg, fontSize: 28, fontWeight: "700", marginBottom: 12 },
  body: { color: C.fg, fontSize: 15, marginBottom: 6 },
  total: { color: C.fg, fontSize: 32, fontWeight: "700", marginVertical: 10 },
  two: { flexDirection: "row", gap: 8, marginTop: 12 },
  moreBtn: { marginBottom: 8 },
  toast: { alignSelf: "center", backgroundColor: C.fg, borderRadius: 16, bottom: 88, left: 16, padding: 12, position: "absolute", right: 16 },
  toastText: { color: C.ink, fontWeight: "700", textAlign: "center" },
});
