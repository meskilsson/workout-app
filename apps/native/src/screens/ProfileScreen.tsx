import { useState } from "react";
import { Linking } from "react-native";
import {
  Page,
  Card,
  Txt,
  Form,
  Action,
  Row,
  Field,
  confirm,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { apiFetch } from "../services/apiClient";
import { prepareNotifications } from "../services/nativeAlerts";
import * as Notifications from "expo-notifications";

export default function ProfileScreen() {
  const { user, token, refreshUser, logout } = useAuth();
  const prefs = usePreferences();
  const [message, setMessage] = useState("");
  const [rest, setRest] = useState(String(prefs.restSeconds));
  if (!user) return null;
  async function remove() {
    try {
      await apiFetch(`/api/users/${user!._id}`, { method: "DELETE", token });
      await logout();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed");
    }
  }
  return (
    <Page>
      <Txt title>Your profile</Txt>
      <Card>
        <Form
          fields={[
            {
              name: "name",
              title: "Name",
              value: user.name,
              required: true,
              min: 2,
              max: 50,
            },
            {
              name: "username",
              title: "Username",
              value: user.username,
              required: true,
              min: 3,
              max: 20,
              pattern: /^[a-zA-Z0-9_]+$/,
            },
            {
              name: "email",
              title: "Email",
              value: user.email,
              required: true,
              email: true,
            },
          ]}
          submit={async (values) => {
            await apiFetch(`/api/users/${user._id}`, {
              method: "PATCH",
              token,
              body: JSON.stringify(values),
            });
            await refreshUser();
            setMessage("Saved");
          }}
        />
      </Card>
      <Card>
        <Txt title>Change password</Txt>
        <Form
          fields={[
            {
              name: "currentPassword",
              title: "Current password",
              required: true,
              password: true,
            },
            {
              name: "newPassword",
              title: "New password",
              required: true,
              password: true,
              min: 8,
              max: 100,
            },
            {
              name: "confirmPassword",
              title: "Confirm password",
              required: true,
              password: true,
            },
          ]}
          submit={async ({ currentPassword, newPassword }) => {
            await apiFetch(`/api/users/${user._id}/password`, {
              method: "PATCH",
              token,
              body: JSON.stringify({ currentPassword, newPassword }),
            });
            setMessage("Saved");
          }}
        />
      </Card>
      <Card>
        <Txt title>Preferences</Txt>
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
        <Row>
          {(["light", "dark"] as const).map((theme) => (
            <Action
              key={theme}
              selected={prefs.theme === theme}
              onPress={() => prefs.update({ theme })}
            >
              {theme === "light" ? "Light" : "Dark"}
            </Action>
          ))}
        </Row>
        <Row>
          {(["male", "female"] as const).map((bodyModel) => (
            <Action
              key={bodyModel}
              selected={prefs.bodyModel === bodyModel}
              onPress={() => prefs.update({ bodyModel })}
            >
              {bodyModel}
            </Action>
          ))}
        </Row>
        <Action
          selected={prefs.keepAwake}
          onPress={() => prefs.update({ keepAwake: !prefs.keepAwake })}
        >
          Keep screen awake
        </Action>
        <Action
          selected={prefs.sound}
          onPress={() => prefs.update({ sound: !prefs.sound })}
        >
          Sound
        </Action>
        <Action
          selected={prefs.vibration}
          onPress={() => prefs.update({ vibration: !prefs.vibration })}
        >
          Vibration
        </Action>
        <Action
          selected={prefs.notifications}
          onPress={() => {
            void (async () => {
              if (prefs.notifications) {
                prefs.update({ notifications: false });
                return;
              }
              await prepareNotifications(prefs);
              const result = await Notifications.requestPermissionsAsync();
              prefs.update({ notifications: result.granted });
              if (!result.granted)
                setMessage("Notifications are disabled in system settings.");
            })();
          }}
        >
          Notifications
        </Action>
        <Action onPress={() => void Linking.openSettings()}>
          Open system settings
        </Action>
        <Field
          title="Rest duration (seconds)"
          keyboardType="number-pad"
          value={rest}
          onChangeText={setRest}
        />
        <Action
          disabled={
            !/^\d+$/.test(rest) || Number(rest) < 1 || Number(rest) > 86400
          }
          onPress={() => prefs.update({ restSeconds: Number(rest) })}
        >
          Save rest duration
        </Action>
      </Card>
      {message ? <Txt>{message}</Txt> : null}
      <Action onPress={() => void logout()}>Log out</Action>
      <Action onPress={() => confirm("Delete account", () => void remove())}>
        Delete account
      </Action>
    </Page>
  );
}
