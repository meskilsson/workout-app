import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import WorkoutsScreen from "../screens/WorkoutsScreen";
import StartWorkoutScreen from "../screens/StartWorkoutScreen";

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

                    if (route.name === "Workouts") {
                        iconName = "fitness-outline";
                    }

                    if (route.name === "Train") {
                        iconName = "barbell-sharp"
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Train" component={StartWorkoutScreen} />
            <Tab.Screen name="Workouts" component={WorkoutsScreen} />
        </Tab.Navigator>
    );
}