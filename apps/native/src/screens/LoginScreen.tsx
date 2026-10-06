import { useState } from "react";

import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import Button from "../components/UI/Button/Button";

import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");


    async function handleLogin() {
        try {
            setIsSubmitting(true);
            setErrorMessage("");

            await login(email.trim(), password);
        } catch (error) {
            console.log(error);
            setErrorMessage("Login failed. Check your email and password.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.card}>
                <Text style={styles.kicker}>Workout App</Text>
                <Text style={styles.title}>Log in</Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>

                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        placeholder="you@example.com"
                        style={styles.input}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>

                    <View style={styles.passwordInputWrapper}>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            placeholder="Your password"
                            style={styles.passwordInput}
                        />

                        <Pressable
                            onPress={() => setShowPassword((current) => !current)}
                            style={styles.eyeButton}
                            accessibilityRole="button"
                            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={22}
                                color="#6b7280"
                            />
                        </Pressable>
                    </View>
                </View>

                {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

                <Button
                    variant="primary"
                    onPress={handleLogin}
                    disabled={isSubmitting}
                >{isSubmitting ? "Logging in..." : "Log in"}</Button>

                {isSubmitting && <ActivityIndicator />}
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f3f4f6",
    },
    card: {
        gap: 16,
        padding: 24,
        borderRadius: 20,
        backgroundColor: "#ffffff",
    },
    kicker: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2563eb",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        marginBottom: 8,
    },
    field: {
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
    },
    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        backgroundColor: "#ffffff",
    },
    passwordInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 12,
        backgroundColor: "#ffffff",
    },

    passwordInput: {
        flex: 1,
        padding: 14,
        fontSize: 16,
    },

    eyeButton: {
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    error: {
        color: "#dc2626",
        fontWeight: "600",
    },
});