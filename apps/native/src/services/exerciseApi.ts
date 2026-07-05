const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function exercisePublicExercisesRequest() {
  console.log("API_URL:", API_URL);
  console.log("Full URL:", `${API_URL}/api/exercises`);
  const response = await fetch(`${API_URL}/api/exercises`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch exercise");
  }

  return data;
}
