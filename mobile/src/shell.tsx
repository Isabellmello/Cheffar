import { useEffect, useState, type ReactNode } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const match = window.location.pathname.match(/\/empresa\/([^/?#]+)/);
    if (match) {
      const slug = decodeURIComponent(match[1]);
      void useCheffar.getState().setCompany(slug);
    }
  }, []);

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.boot}>
        <Text style={styles.kicker}>Cheffar</Text>
        <Text style={styles.brand}>Abrindo o turno…</Text>
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
  const companySlug = useCheffar((s) => s.companySlug);
  const user = useCheffar((s) => s.user);

  if (!companySlug) return <CompanySelector />;
  if (!user) return <Login />;
  return <Frame />;
}

function CompanySelector() {
  const setCompany = useCheffar((s) => s.setCompany);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const slug = code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (slug.length < 2) {
      setError("Informe um código válido (ex.: sabor-da-casa).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await setCompany(slug);
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.history.pushState({}, "", `/empresa/${slug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir a empresa.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>Cheffar</Text>
        <Text style={styles.brand}>Qual restaurante?</Text>
        <Text style={styles.muted}>Informe o código da empresa</Text>

        <View style={styles.form}>
          <Field label="Código da empresa">
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="sabor-da-casa"
              value={code}
              onChangeText={setCode}
            />
          </Field>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Btn tone="primary" onPress={submit} disabled={busy}>
            {busy ? "Abrindo…" : "Entrar na empresa"}
          </Btn>
        </View>

        <Text style={[styles.muted, { marginTop: 24 }]}>
          Exemplos: sabor-da-casa, demo, burger-demo
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Login() {
  const users = useCheffar((s) => s.users);
  const login = useCheffar((s) => s.login);
  const setModal = useCheffar((s) => s.setModal);
  const modal = useCheffar((s) => s.modal);
  const companyName = useCheffar((s) => s.companyName);
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
        <Text style={styles.kicker}>{companyName}</Text>
        <Text style={styles.brand}>Cheffar</Text>
        <Text style={styles.muted}>Entre com sua conta</Text>

        <View style={styles.form}>
          <Field label="E-mail">
            <Input autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          </Field>
          <Field label="Senha">
            <View style={styles.passRow}>
              <View style={styles.flex}>
                <Input secureTextEntry={!show} value={password} onChangeText={setPassword} />
              </View>
              <Pressable style={styles.eye} onPress={() => setShow((v) => !v)}>
                <Text style={styles.eyeText}>{show ? "Ocultar" : "Mostrar"}</Text>
              </Pressable>
            </View>
          </Field>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Btn tone="primary" onPress={submit} disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </Btn>
          <Pressable onPress={() => setModal({ k: "forgot" })}>
            <Text style={styles.link}>Esqueci a senha</Text>
          </Pressable>
        </View>

        <Text style={[styles.muted, { marginTop: 28 }]}>Contas de demonstração</Text>
        {users.map((person) => (
          <Pressable
            key={person.id}
            style={styles.person}
            onPress={() => {
              setEmail(person.email);
              setPassword("1234");
            }}
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
  const companyName = useCheffar((s) => s.companyName);
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
          <Text style={styles.muted}>
            {ROLES[user.role].label} · {companyName}
          </Text>
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
      <View style={styles.moreBtn}>
        <Btn onPress={logout}>Sair</Btn>
      </View>
    </Sheet>
  );
}

function Review() {
  const setModal = useCheffar((s) => s.setModal);
  const cart = useCheffar((s) => s.cart);
  const changeQty = useCheffar((s) => s.changeQty);
  const setNote = useCheffar((s) => s.setNote);
  const sendOrder = useCheffar((s) => s.sendOrder);
  const total = cart.reduce((sum, c) => sum + c.p * c.q, 0);
  return (
    <Sheet title="Revisar pedido" onClose={() => setModal(null)}>
      {cart.map((line, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <View style={styles.two}>
            <Text style={[styles.body, styles.flex]}>{line.name}</Text>
            <Text style={styles.body}>{brl(line.p * line.q)}</Text>
          </View>
          <View style={styles.two}>
            <Btn onPress={() => changeQty(i, -1)}>−</Btn>
            <Text style={[styles.body, { marginTop: 10 }]}>{line.q}</Text>
            <Btn onPress={() => changeQty(i, 1)}>+</Btn>
          </View>
          <Field label="Observação">
            <Input value={line.note} onChangeText={(v) => setNote(i, v)} />
          </Field>
        </View>
      ))}
      <Text style={styles.total}>{brl(total)}</Text>
      <Btn
        tone="primary"
        onPress={() => {
          sendOrder();
          setModal(null);
        }}
      >
        Enviar pedido
      </Btn>
    </Sheet>
  );
}

function Release() {
  const setModal = useCheffar((s) => s.setModal);
  const releaseTable = useCheffar((s) => s.releaseTable);
  const selTable = useCheffar((s) => s.selTable);
  return (
    <Sheet title={`Liberar mesa ${selTable}?`} onClose={() => setModal(null)}>
      <Text style={styles.body}>Os pedidos e pagamentos desta mesa serão encerrados.</Text>
      <View style={styles.two}>
        <View style={styles.flex}>
          <Btn onPress={() => setModal(null)}>Cancelar</Btn>
        </View>
        <View style={styles.flex}>
          <Btn tone="primary" onPress={releaseTable}>
            Liberar
          </Btn>
        </View>
      </View>
    </Sheet>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
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