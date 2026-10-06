import { StyleSheet } from "react-native";

export default function createGlobalStyles(theme: any) {
    return StyleSheet.create({
        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            backgroundColor: theme.colors.background,
        },

        screen: {
            flex: 1,
            backgroundColor: theme.colors.background,
            padding: 24,
        },

        center: {
            alignItems: "center",
            justifyContent: "center",
        },

        title: {
            color: theme.colors.text,
            fontSize: 28,
            fontWeight: "900",
            textAlign: "center",
        },

        subtitle: {
            marginTop: 12,
            maxWidth: 320,
            color: theme.colors.textMuted,
            fontSize: 16,
            lineHeight: 22,
            textAlign: "center",
        },

        kicker: {
            marginBottom: 8,
            color: theme.colors.primary,
            fontSize: 13,
            fontWeight: "800",
            letterSpacing: 1.4,
            textTransform: "uppercase",
        },

        card: {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
        },

        button: {
            borderWidth: 2,
            borderColor: theme.colors.primary,
            borderRadius: 8,
            padding: 12,
        },

        buttonPressed: {
            borderColor: theme.colors.danger ?? "red",
        },

        buttonText: {
            color: theme.colors.text,
        },
    });
}