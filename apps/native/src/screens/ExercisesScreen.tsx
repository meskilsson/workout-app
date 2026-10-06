import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import Card from "../components/UI/Cards/Card";
import { exercisePublicExercisesRequest, type Exercise } from "../services/exerciseApi";
import createGlobalStyles from "../styles/globalStyles";
import { darkTheme, lightTheme } from "../styles/themes";
import { useColorScheme } from "react-native";


export default function ExercisesScreen() {
    const [exercises, setExercises] = useState<Exercise[]>([]);

    const colorScheme = useColorScheme();
    const theme = colorScheme === "dark" ? darkTheme : lightTheme;
    const styles = createGlobalStyles(theme);

    useEffect(() => {
        async function getExercises() {
            try {
                const result = await exercisePublicExercisesRequest();
                setExercises(result.exercises);
            } catch (error) {
                console.log("Failed to fetch exercises:", error);
            }
        }

        getExercises();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Exercises</Text>

            <Card title="Public exercises">
                {exercises.map((exercise) => (
                    <View key={exercise._id}>
                        <Text style={styles.subtitle}>{exercise.name}</Text>
                        <Text style={styles.subtitle}>{exercise.exerciseType}</Text>
                        <Text style={styles.subtitle}>
                            {exercise.primaryMuscles?.join(", ")}
                        </Text>
                        <Text style={styles.subtitle}>
                            {exercise.secondaryMuscles?.join(", ")}
                        </Text>
                    </View>
                ))}
            </Card>
        </View>
    );
}