import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";

export const C = {
  bg: "#12100e",
  surface: "#1c1916",
  surface2: "#26221e",
  line: "#3a342c",
  fg: "#f4efe6",
  muted: "#b7ab9a",
  faint: "#8a7d6c",
  ember: "#e25b2a",
  ink: "#1a120c",
  gold: "#e2b15a",
  sage: "#8fbf8a",
};

export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Empty({ children }: { children: string }) {
  return <Text style={styles.empty}>{children}</Text>;
}

export function Title({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <View style={styles.titleWrap}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Badge({ tone = "neutral", children }: { tone?: "d" | "w" | "ok" | "neutral"; children: string }) {
  const toneStyle =
    tone === "d" ? styles.badgeD : tone === "w" ? styles.badgeW : tone === "ok" ? styles.badgeOk : styles.badgeN;
  const textStyle = tone === "d" ? styles.badgeDText : tone === "w" ? styles.badgeWText : tone === "ok" ? styles.badgeOkText : styles.badgeNText;
  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={[styles.badgeText, textStyle]}>{children}</Text>
    </View>
  );
}

export function Btn({
  tone = "ghost",
  children,
  onPress,
  disabled,
  style,
}: {
  tone?: "ghost" | "primary" | "danger";
  children: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const toneStyle = tone === "primary" ? styles.btnPrimary : tone === "danger" ? styles.btnDanger : styles.btnGhost;
  const textStyle = tone === "primary" ? styles.btnPrimaryText : tone === "danger" ? styles.btnDangerText : styles.btnGhostText;
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.btn, toneStyle, disabled && styles.disabled, style]}>
      <Text style={[styles.btnText, textStyle]}>{children}</Text>
    </Pressable>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.kicker}>{label}</Text>
      {children}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={C.faint} {...props} style={[styles.input, props.style]} />;
}

export function Chip({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: C.surface, borderColor: C.line, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  empty: { borderColor: C.line, borderRadius: 16, borderStyle: "dashed", borderWidth: 1, color: C.muted, fontSize: 14, lineHeight: 20, padding: 16 },
  titleWrap: { marginBottom: 16 },
  kicker: { color: C.faint, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" },
  title: { color: C.fg, fontSize: 32, fontWeight: "700" },
  section: { color: C.faint, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8, marginTop: 8, textTransform: "uppercase" },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeD: { backgroundColor: "rgba(226,91,42,0.18)" },
  badgeDText: { color: C.ember },
  badgeW: { backgroundColor: "rgba(226,177,90,0.22)" },
  badgeWText: { color: C.gold },
  badgeOk: { backgroundColor: "rgba(143,191,138,0.18)" },
  badgeOkText: { color: C.sage },
  badgeN: { backgroundColor: C.surface2 },
  badgeNText: { color: C.muted },
  btn: { alignItems: "center", borderRadius: 12, height: 48, justifyContent: "center", paddingHorizontal: 14 },
  btnText: { fontSize: 14, fontWeight: "700" },
  btnGhost: { backgroundColor: C.surface2, borderColor: C.line, borderWidth: 1 },
  btnGhostText: { color: C.fg },
  btnPrimary: { backgroundColor: C.ember },
  btnPrimaryText: { color: C.ink },
  btnDanger: { backgroundColor: "rgba(226,91,42,0.12)", borderColor: "rgba(226,91,42,0.4)", borderWidth: 1 },
  btnDangerText: { color: C.ember },
  disabled: { opacity: 0.4 },
  field: { marginBottom: 12 },
  input: { backgroundColor: C.surface2, borderColor: C.line, borderRadius: 12, borderWidth: 1, color: C.fg, fontSize: 16, height: 48, paddingHorizontal: 12 },
  chip: { borderColor: C.line, borderRadius: 999, borderWidth: 1, marginBottom: 8, marginRight: 8, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: C.ember, borderColor: C.ember },
  chipText: { color: C.muted, fontSize: 14, fontWeight: "700" },
  chipTextOn: { color: C.ink },
});
