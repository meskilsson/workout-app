import { Pressable } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import MainTabs from "./MainTabs";
import ProfileScreen from "../screens/ProfileScreen";
import ExercisesScreen from "../screens/ExercisesScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
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

                <Stack.Screen
                    name="Exercises"
                    component={ExercisesScreen}
                    options={{ title: "Exercises" }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}