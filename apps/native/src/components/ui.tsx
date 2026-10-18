import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  AccessibilityInfo,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePreferences } from "../context/PreferencesContext";
import { label, errorLabel, t } from "../i18n";
import { ApiError } from "../services/apiClient";
const ScrollContext = createContext<
  (input: Pick<TextInput, "measureInWindow"> | null) => void
>(() => {});

export function Page({
  children,
  safeTop = false,
}: {
  children: ReactNode;
  safeTop?: boolean;
}) {
  const { colors } = usePreferences();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null),
    offset = useRef(0);
  function reveal(input: Pick<TextInput, "measureInWindow"> | null) {
    setTimeout(() => {
      input?.measureInWindow((_x, y, _width, height) => {
        scroll.current
          ?.getNativeScrollRef()
          ?.measureInWindow((_sx, sy, _sw, sh) => {
            if (y < sy + 16 || y + height > sy + sh - 16)
              scroll.current?.scrollTo({
                y: Math.max(0, offset.current + y - sy - 20),
                animated: false,
              });
          });
      });
    }, 100);
  }
  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", () =>
      reveal(TextInput.State.currentlyFocusedInput()),
    );
    return () => subscription.remove();
  }, []);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scroll}
        onScroll={(event) => {
          offset.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 18,
          paddingTop: safeTop ? insets.top + 18 : 18,
          paddingBottom: insets.bottom + 32,
          gap: 16,
          flexGrow: 1,
        }}
      >
        <View
          style={{ width: "100%", maxWidth: 760, alignSelf: "center", gap: 16 }}
        >
          <ScrollContext.Provider value={reveal}>
            {children}
          </ScrollContext.Provider>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Txt({
  children,
  title = false,
  error = false,
  literal = false,
  live = false,
}: {
  children: ReactNode;
  title?: boolean;
  error?: boolean;
  literal?: boolean;
  live?: boolean;
}) {
  const { colors } = usePreferences();
  const announcement =
    typeof children === "string"
      ? literal
        ? children
        : error
          ? errorLabel(children)
          : label(children)
      : "";
  useEffect(() => {
    if ((live || error) && announcement)
      AccessibilityInfo.announceForAccessibility(announcement);
  }, [live, error, announcement]);
  return (
    <Text
      accessibilityLiveRegion={live || error ? "polite" : undefined}
      accessibilityRole={error ? "alert" : title ? "header" : undefined}
      style={{
        color: error ? colors.danger : colors.text,
        fontSize: title ? 26 : 16,
        fontWeight: title ? "700" : "400",
        lineHeight: title ? 34 : 24,
      }}
    >
      {typeof children === "string" && !literal
        ? error
          ? errorLabel(children)
          : label(children)
        : children}
    </Text>
  );
}
export function Card({ children }: { children: ReactNode }) {
  const { colors } = usePreferences();
  return (
    <View
      style={{
        padding: 18,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}
export function Row({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
    </View>
  );
}
export function Action({
  children,
  onPress,
  disabled = false,
  selected = false,
  literal = false,
}: {
  children: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  literal?: boolean;
}) {
  const { colors } = usePreferences();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: selected || pressed ? colors.accent : colors.surface,
        opacity: disabled ? 0.45 : 1,
        justifyContent: "center",
      })}
    >
      <Text
        style={{
          color: selected ? "#142F26" : colors.text,
          fontSize: 16,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {literal ? children : label(children)}
      </Text>
    </Pressable>
  );
}
export function Field({
  title,
  error,
  focus,
  focusRequest,
  ...props
}: TextInputProps & {
  title: string;
  error?: string;
  focus?: boolean;
  focusRequest?: unknown;
}) {
  const { colors } = usePreferences();
  const input = useRef<TextInput>(null);
  const reveal = useContext(ScrollContext);
  useEffect(() => {
    if (focus) input.current?.focus();
  }, [focus, focusRequest]);
  return (
    <View style={{ gap: 5 }}>
      <Txt>{title}</Txt>
      <TextInput
        ref={input}
        onFocus={() => reveal(input.current)}
        accessibilityLabel={label(title)}
        accessibilityHint={error}
        placeholderTextColor={colors.textMuted}
        {...props}
        style={[
          {
            minHeight: 48,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.textMuted,
            padding: 12,
            borderRadius: 12,
            color: colors.text,
            backgroundColor: colors.surface,
            fontSize: 16,
          },
          props.style,
        ]}
      />
      {error ? <Txt error>{error}</Txt> : null}
    </View>
  );
}
export function Busy() {
  return <ActivityIndicator accessibilityLabel={t("common.loading")} />;
}
export function confirm(title: string, action: () => void) {
  Alert.alert(label(title), "", [
    { text: t("common.cancel"), style: "cancel" },
    { text: label(title), style: "destructive", onPress: action },
  ]);
}

export type FormField = {
  name: string;
  title: string;
  value?: string;
  required?: boolean;
  min?: number;
  max?: number;
  password?: boolean;
  email?: boolean;
  pattern?: RegExp;
  multiline?: boolean;
  numeric?: boolean;
  integer?: boolean;
  minValue?: number;
  maxValue?: number;
};
export function Form({
  fields,
  submit,
  button = "Save",
  onCancel,
  onChange,
  onValuesChange,
  validate,
  onFieldErrors,
}: {
  fields: FormField[];
  submit: (values: Record<string, string>) => Promise<void>;
  button?: string;
  onCancel?: () => void;
  onChange?: () => void;
  onValuesChange?: (values: Record<string, string>) => void;
  validate?: (values: Record<string, string>) => Record<string, string>;
  onFieldErrors?: (
    errors: Record<string, string>,
    focusAllowed: boolean,
  ) => boolean;
}) {
  const [values, setValues] = useState(() =>
      Object.fromEntries(fields.map((f) => [f.name, f.value ?? ""])),
    ),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const inputs = useRef<Record<string, TextInput | null>>({});
  const reveal = useContext(ScrollContext);
  const guard = useRef(false);
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  function focus(next: Record<string, string>) {
    const first = fields.find((f) => next[f.name]);
    if (first) inputs.current[first.name]?.focus();
  }
  async function save() {
    if (guard.current) return;
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = f.password ? values[f.name] : values[f.name].trim();
      if (f.required && !v)
        next[f.name] = t("formValidation.valueIsRequired", {
          value0: label(f.title),
        });
      else if (v && f.min && v.length < f.min)
        next[f.name] = t("formValidation.useAtLeastValueCharacters", {
          value0: f.min,
        });
      else if (f.max && v.length > f.max)
        next[f.name] = t("formValidation.useNoMoreThanValueCharacters", {
          value0: f.max,
        });
      else if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        next[f.name] = t(
          "formValidation.enterAValidEmailAddressSuchAsNameExample",
        );
      else if (f.pattern && !f.pattern.test(v))
        next[f.name] = t("common.requestedFormat");
      else if (f.numeric && v && !Number.isFinite(Number(v.replace(",", "."))))
        next[f.name] = t("formValidation.enterAValidNumber");
      else if (f.numeric && f.integer && v && !Number.isInteger(Number(v)))
        next[f.name] = t("formValidation.enterAWholeNumber");
      else if (
        f.numeric &&
        v &&
        f.minValue !== undefined &&
        Number(v) < f.minValue
      )
        next[f.name] = t("formValidation.enterAValueOfValueOrMore", {
          value0: f.minValue,
        });
      else if (
        f.numeric &&
        v &&
        f.maxValue !== undefined &&
        Number(v) > f.maxValue
      )
        next[f.name] = t("formValidation.enterAValueOfValueOrLess", {
          value0: f.maxValue,
        });
    }
    if (
      "confirmPassword" in values &&
      values.confirmPassword !== values.newPassword
    )
      next.confirmPassword = t(
        "formValidation.newPasswordsDoNotMatchEnterTheSamePassword",
      );
    Object.assign(next, validate?.(values) ?? {});
    setErrors(next);
    setMessage("");
    if (Object.keys(next).length) {
      focus(next);
      return;
    }
    guard.current = true;
    setBusy(true);
    try {
      await submit(
        Object.fromEntries(
          fields.map((f) => [
            f.name,
            f.password
              ? values[f.name]
              : f.numeric
                ? values[f.name].trim().replace(",", ".")
                : values[f.name].trim(),
          ]),
        ),
      );
    } catch (error) {
      const server = error instanceof ApiError ? error.fields : {};
      setErrors(server);
      const ownField = Object.keys(server).some((key) =>
        fields.some((f) => f.name === key),
      );
      const handled = onFieldErrors?.(server, !ownField) ?? false;
      if (ownField) focus(server);
      else if (!handled)
        setMessage(
          error instanceof Error
            ? label(error.message)
            : t("formValidation.somethingWentWrongPleaseTryAgain"),
        );
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  const { colors } = usePreferences();
  return (
    <View style={{ gap: 14 }}>
      {fields.map((f) => (
        <View key={f.name} style={{ gap: 5 }}>
          <Txt>{f.title}</Txt>
          <TextInput
            onFocus={() => reveal(inputs.current[f.name])}
            ref={(input) => {
              inputs.current[f.name] = input;
            }}
            accessibilityLabel={label(f.title)}
            accessibilityHint={errors[f.name]}
            secureTextEntry={f.password && !visiblePasswords[f.name]}
            autoCapitalize={
              f.password || f.email || f.name === "username"
                ? "none"
                : "sentences"
            }
            keyboardType={
              f.email ? "email-address" : f.numeric ? "decimal-pad" : "default"
            }
            multiline={f.multiline}
            editable={!busy}
            value={values[f.name]}
            onChangeText={(v) => {
              onChange?.();
              const next = { ...values, [f.name]: v };
              setValues(next);
              onValuesChange?.(next);
            }}
            style={{
              minHeight: 48,
              borderWidth: 1,
              borderColor: errors[f.name] ? colors.danger : colors.textMuted,
              borderRadius: 12,
              padding: 12,
              color: colors.text,
              fontSize: 16,
            }}
          />
          {f.password && (
            <Action
              onPress={() =>
                setVisiblePasswords((previous) => ({
                  ...previous,
                  [f.name]: !previous[f.name],
                }))
              }
            >
              {visiblePasswords[f.name] ? "Hide password" : "Show password"}
            </Action>
          )}
          {errors[f.name] ? <Txt error>{errors[f.name]}</Txt> : null}
        </View>
      ))}
      {message ? <Txt error>{message}</Txt> : null}
      <Action selected disabled={busy} onPress={() => void save()}>
        {busy ? t("common.saving") : button}
      </Action>
      {onCancel && (
        <Action disabled={busy} onPress={onCancel}>
          Cancel
        </Action>
      )}
    </View>
  );
}
