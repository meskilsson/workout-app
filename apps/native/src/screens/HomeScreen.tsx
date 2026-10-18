import { Page, Card, Txt, Action } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useWorkout } from "../context/WorkoutContext";
export default function HomeScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { draft } = useWorkout();
  return (
    <Page>
      <Txt title literal>
        {user?.name ?? "Workout App"}
      </Txt>
      <Card>
        <Txt title>Ready for your next workout?</Txt>
        <Action onPress={() => navigation.navigate("Train")}>
          {draft ? "Resume workout" : "Start workout"}
        </Action>
      </Card>
      <Action onPress={() => navigation.navigate("Exercises")}>
        Exercise library
      </Action>
      <Action onPress={() => navigation.navigate("Templates")}>
        Workout templates
      </Action>
      <Action onPress={() => navigation.navigate("Workouts")}>
        Workout history
      </Action>
      <Action onPress={() => navigation.navigate("Profile")}>
        Your profile
      </Action>
      {user?.role === "admin" && (
        <Action onPress={() => navigation.navigate("Admin")}>
          Administration
        </Action>
      )}
    </Page>
  );
}
