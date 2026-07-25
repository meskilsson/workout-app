import { Text, View } from "react-native";
import createGlobalStyles from "../styles/globalStyles";
import { darkTheme, lightTheme } from "../styles/themes";
import { useColorScheme } from "react-native";

export default function HomeScreen({ navigation }: any) {
    const colorScheme = useColorScheme();
    const theme = colorScheme === "dark" ? darkTheme : lightTheme;
    const styles = createGlobalStyles(theme);

    return (
        <View style={styles.container}>
            <Text style={styles.kicker}>Workout App</Text>

            <Text style={styles.title}>Native app is running.</Text>

            <Text style={styles.subtitle}>
                This is now the clean starting point for the mobile version.
            </Text>
        </View>
    );
}