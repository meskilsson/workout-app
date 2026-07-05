import { Platform } from "react-native";

const API_URL =
  Platform.OS === "web"
    ? process.env.EXPO_PUBLIC_API_URL_WEB
    : process.env.EXPO_PUBLIC_API_URL_NATIVE;

export async function exercisePublicExercisesRequest() {
  console.log("API_URL:", API_URL);
  console.log("Full URL:", `${API_URL}/api/exercises`);

  const response = await fetch(`${API_URL}/api/exercises`, {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch exercises");
  }

  return data;
}
