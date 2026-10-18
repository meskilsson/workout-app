import { useCallback, useState } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Page, Card, Txt, Form, Action, Row } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { apiFetch } from "../services/apiClient";

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { login, retrySession, sessionError } = useAuth();
  const prefs = usePreferences();
  const [signup, setSignup] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (!signup) return false;
          setSignup(false);
          return true;
        },
      );
      return () => subscription.remove();
    }, [signup]),
  );
  return (
    <Page safeTop>
      <Row>
        {(["en", "sv"] as const).map((language) => (
          <Action
            key={language}
            selected={prefs.language === language}
            onPress={() => prefs.update({ language })}
          >
            {language === "en" ? "English" : "Svenska"}
          </Action>
        ))}
      </Row>
      <Card>
        <Txt title>{signup ? "Create account" : "Log in"}</Txt>
        <Form
          key={String(signup)}
          fields={[
            ...(signup
              ? [
                  {
                    name: "name",
                    title: "Name",
                    required: true,
                    min: 2,
                    max: 50,
                  },
                  {
                    name: "username",
                    title: "Username",
                    required: true,
                    min: 3,
                    max: 20,
                    pattern: /^[a-zA-Z0-9_]+$/,
                  },
                ]
              : []),
            { name: "email", title: "Email", required: true, email: true },
            {
              name: "password",
              title: "Password",
              required: true,
              password: true,
              min: signup ? 8 : 1,
              max: signup ? 100 : undefined,
            },
          ]}
          button={signup ? "Create account" : "Log in"}
          submit={async (values) => {
            if (signup)
              await apiFetch("/api/users", {
                method: "POST",
                body: JSON.stringify(values),
              });
            if (signup) setSignup(false);
            else await login(values.email, values.password);
          }}
        />
        <Action onPress={() => setSignup(!signup)}>
          {signup ? "Log in" : "Create account"}
        </Action>
      </Card>
      {sessionError && (
        <>
          <Txt error>{sessionError}</Txt>
          <Action onPress={retrySession}>Try again</Action>
        </>
      )}
      <Action onPress={() => navigation.navigate("Exercises")}>
        Exercise library
      </Action>
      <Action onPress={() => navigation.navigate("Templates")}>
        Workout templates
      </Action>
    </Page>
  );
}
