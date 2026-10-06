import {
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewProps,
    ViewStyle,
} from "react-native";
import type { ReactNode } from "react";

type CardVariant = "default" | "primary" | "timer" | "image";

type CardProps = ViewProps & {
    title?: string;
    children?: ReactNode;
    variant?: CardVariant;
    style?: StyleProp<ViewStyle>;
};

export default function Card({
    title,
    children,
    variant = "default",
    style,
    ...rest
}: CardProps) {
    return (
        <View
            style={[styles.card, styles[variant], style]}
            {...rest}
        >
            {title && (
                <Text style={styles.title}>
                    {title}
                </Text>
            )}

            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 12,
    },

    default: {
        backgroundColor: "#222222",
    },

    primary: {
        backgroundColor: "#2563eb",
    },

    timer: {
        backgroundColor: "#111827",
        alignItems: "center",
    },

    image: {
        padding: 0,
        overflow: "hidden",
    },

    title: {
        marginBottom: 8,
        fontSize: 20,
        fontWeight: "bold",
        color: "#ffffff",
    },
});