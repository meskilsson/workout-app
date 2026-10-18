import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "workout_app_auth_token";
const SESSION_KEY = "workout_app_auth_session";
export async function saveAuthCredentials(
  token: string,
  refreshToken: string | null,
) {
  // One secure write prevents a rotated refresh credential being split across two writes.
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify({ token, refreshToken }),
  );
}

export async function saveAuthToken(token: string) {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken() {
  const session = await SecureStore.getItemAsync(SESSION_KEY);
  if (session) {
    try {
      const data = JSON.parse(session);
      return typeof data.token === "string" ? data.token : null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function deleteAuthToken() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync("workout_app_refresh_token");
}
export const saveRefreshToken = (token: string) =>
  SecureStore.setItemAsync("workout_app_refresh_token", token);
export async function getRefreshToken() {
  const session = await SecureStore.getItemAsync(SESSION_KEY);
  if (session) {
    try {
      const data = JSON.parse(session);
      return typeof data.refreshToken === "string" ? data.refreshToken : null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync("workout_app_refresh_token");
}
