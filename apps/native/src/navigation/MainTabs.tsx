import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import ExercisesScreen from "../screens/ExercisesScreen";
import WorkoutsScreen from "../screens/WorkoutsScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,

                tabBarIcon: ({ color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

                    if (route.name === "Home") {
                        iconName = "home-outline";
                    }

                    if (route.name === "Exercises") {
                        iconName = "barbell-outline";
                    }

                    if (route.name === "Workouts") {
                        iconName = "fitness-outline";
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Exercises" component={ExercisesScreen} />
            <Tab.Screen name="Workouts" component={WorkoutsScreen} />
        </Tab.Navigator>
    );
}