import { ActivityIndicator, Pressable, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import ExercisesScreen from "../screens/ExercisesScreen";
import TemplatesScreen from "../screens/TemplatesScreen";
import SessionScreen from "../screens/SessionScreen";
import AdminScreen from "../screens/AdminScreen";
import { usePreferences } from "../context/PreferencesContext";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { label } from "../i18n";
import MainTabs from "./MainTabs";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useAuth } from "../context/AuthContext";

type RootStackParamList = {
  AuthLoading: undefined;
  Login: undefined;
  MainTabs: undefined;
  Profile: undefined;
  Exercises: undefined;
  Templates: undefined;
  Session: { sessionId: string };
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthLoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const prefs = usePreferences();

  return (
    <NavigationContainer
      theme={{
        ...(prefs.theme === "dark" ? DarkTheme : DefaultTheme),
        colors: {
          ...(prefs.theme === "dark" ? DarkTheme : DefaultTheme).colors,
          background: prefs.colors.background,
          card: prefs.colors.surface,
          text: prefs.colors.text,
          border: prefs.colors.border,
          primary: prefs.colors.primary,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={({ route }) => ({
          title: label(route.name),
          headerTintColor: prefs.colors.text,
          animation: prefs.reducedMotion ? "none" : "default",
        })}
      >
        {isLoading || !prefs.ready ? (
          <Stack.Screen
            name="AuthLoading"
            component={AuthLoadingScreen}
            options={{ headerShown: false }}
          />
        ) : isAuthenticated ? (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={({ navigation }) => ({
                title: "Workout App",
                headerRight: () => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={label("Your profile")}
                    style={{
                      minWidth: 48,
                      minHeight: 48,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={() => navigation.navigate("Profile")}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={30}
                      color={prefs.colors.text}
                    />
                  </Pressable>
                ),
              })}
            />

            <Stack.Screen
              name="Session"
              component={SessionScreen}
              options={{ title: label("Workout summary") }}
            />
            {user?.role === "admin" && (
              <Stack.Screen name="Admin" component={AdminScreen} />
            )}
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                title: label("Profile"),
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
        <Stack.Group navigationKey={user?._id ?? "guest"}>
          <Stack.Screen
            name="Exercises"
            component={ExercisesScreen}
            options={{ title: label("Exercise library") }}
          />
          <Stack.Screen
            name="Templates"
            component={TemplatesScreen}
            options={{ title: label("Workout templates") }}
          />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
