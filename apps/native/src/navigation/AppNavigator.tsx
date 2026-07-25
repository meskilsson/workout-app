import { ActivityIndicator, Pressable, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import MainTabs from "./MainTabs";
import LoginScreen from "../screens/LoginScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useAuth } from "../context/AuthContext";

type RootStackParamList = {
    AuthLoading: undefined;
    Login: undefined;
    MainTabs: undefined;
    Profile: undefined;
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
    const { isLoading, isAuthenticated } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {isLoading ? (
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
                                    <Pressable onPress={() => navigation.navigate("Profile")}>
                                        <Ionicons name="person-circle-outline" size={30} />
                                    </Pressable>
                                ),
                            })}
                        />

                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{
                                title: "Profile",
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
            </Stack.Navigator>
        </NavigationContainer>
    );
}