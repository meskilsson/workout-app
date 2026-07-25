import type { ReactNode } from "react";
import {
    Text,
    Pressable,
    StyleSheet,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from "react-native";

type ButtonProps = {
    children: ReactNode;
    variant?: "primary" | "secondary" | "ghost";
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    accessibilityLabel?: string;
};

export default function Button({
    children,
    variant = "primary",
    onPress,
    disabled = false,
    loading = false,
    style,
    textStyle,
    accessibilityLabel,
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.button,
                styles[variant],
                pressed && styles.pressed,
                disabled && styles.disabled,
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    variant === "secondary" && styles.secondaryText,
                    variant === "ghost" && styles.ghostText,
                    isDisabled && styles.disabledText,
                    textStyle,
                ]}
            >
                {loading ? "Loading..." : children}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
    },

    primary: {
        backgroundColor: "#2563eb",
        borderWidth: 1,
        borderColor: "#2563eb",
    },

    secondary: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#2563eb",
    },

    ghost: {
        backgroundColor: "transparent",
        borderWidth: 0,
    },

    text: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },

    secondaryText: {
        color: "#2563eb",
    },

    ghostText: {
        color: "#2563eb",
    },

    disabled: {
        opacity: 0.5,
    },

    disabledText: {
        color: "gray",
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    }
});