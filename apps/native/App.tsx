import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { PreferencesProvider } from "./src/context/PreferencesContext";
import { WorkoutProvider } from "./src/context/WorkoutContext";
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PreferencesProvider>
          <WorkoutProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </WorkoutProvider>
        </PreferencesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
