import { Alert, StyleSheet, Text, View } from "react-native";

import Button from "../components/UI/Button/Button";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
    const { user, logout, refreshUser } = useAuth();

    async function handleLogout() {
        try {
            await logout();
        } catch (error) {
            console.log(error);
            Alert.alert("Logout failed", "Something went wrong while logging out.");
        }
    }

    async function handleRefreshUser() {
        try {
            await refreshUser();
        } catch (error) {
            console.log(error);
            Alert.alert("Refresh failed", "Could not refresh your profile.");
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{user?.name || "Unknown"}</Text>

                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user?.email || "Unknown"}</Text>

                <Text style={styles.label}>Username</Text>
                <Text style={styles.value}>{user?.username || "Unknown"}</Text>

                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>{user?.role || "Unknown"}</Text>
            </View>

            <View style={styles.actions}>
                <Button variant="secondary" onPress={handleRefreshUser}>
                    Refresh profile
                </Button>

                <Button variant="primary" onPress={handleLogout}>
                    Log out
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        gap: 20,
        backgroundColor: "#f3f4f6",
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
    },
    card: {
        gap: 6,
        padding: 20,
        borderRadius: 16,
        backgroundColor: "#ffffff",
    },
    label: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: "700",
        color: "#6b7280",
        textTransform: "uppercase",
    },
    value: {
        fontSize: 18,
        fontWeight: "600",
    },
    actions: {
        gap: 12,
    },
});