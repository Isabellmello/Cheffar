import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CheffarApp } from "./src/shell";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <CheffarApp />
    </SafeAreaProvider>
  );
}
