import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import Button from './src/components/Button/Button'

export default function App() {
    return (
        <View style={styles.container}>
            <Text style={styles.kicker}>Workout App</Text>

            <Text style={styles.title}>
                Native app is running.
            </Text>

            <Text style={styles.subtitle}>
                This is now the clean starting point for the mobile version.
            </Text>

            <StatusBar style="light" />

            <Button
                variant="primary"
                onPress={() => console.log("pressed")}
            >
                Press me
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#101010",
    },
    kicker: {
        marginBottom: 8,
        color: "#f97316",
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: 1.4,
        textTransform: "uppercase",
    },
    title: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "900",
        textAlign: "center",
    },
    subtitle: {
        marginTop: 12,
        maxWidth: 320,
        color: "#a3a3a3",
        fontSize: 16,
        lineHeight: 22,
        textAlign: "center",
    },
    button: {
        color: "blue",
        borderWidth: 2,
        borderColor: "blue",
        borderRadius: 8,
        padding: 12,
    },
    buttonPressed: {
        borderColor: "red",
    },
    buttonText: {
        color: "white",
    }
});