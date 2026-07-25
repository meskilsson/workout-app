import { View, Text, StyleSheet } from "react-native";

export default function ProfileScreen() {
    return (
        <View
            style={styles.container}
        >
            <Text style={styles.title}>Profile</Text>
            <Text>Here we will later show the logged-in user</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 12,
    },
});

