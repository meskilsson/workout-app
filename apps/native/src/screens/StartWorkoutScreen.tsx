import { View, Text, StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import type { Muscle } from "../services/workoutDraftApi";

const MUSCLES: Muscle[] = [
  "chest"
]


export default function StartWorkoutScreen() {


  const [selectedMuscles, setSelectedMuscles] = useState<Muscle[]>([]);

  function toggleMuscle(muscle: Muscle) {

    const isAlreadySelected = selectedMuscles.includes(muscle);

    if(!isAlreadySelected) {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }

    if(isAlreadySelected) {
      setSelectedMuscles(selectedMuscles.filter((selectedMuscle) => selectedMuscle !== muscle));
    }


  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start your workout</Text>

      <Text style={styles.description}>
        Choose the muscle groups you want to train.
      </Text>

      <Text>Selected: {selectedMuscles.length}</Text>

      {MUSCLES.map((muscle) => {
        return (
            <Pressable
            key={muscle}
            style={styles.muscleButton}
            onPress={() => toggleMuscle(muscle)}
            >
              <Text style={styles.muscleButtonText}>{muscle}</Text>
            </Pressable>
        )
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    fontSize: 16,
    marginTop: 12,
  },

  muscleButton: {
    padding: 12,
    borderWidth: 2,
    borderRadius: 3,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  muscleButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  muscleButtonSelected: {
  backgroundColor: "#dbeafe",
  borderColor: "#2563eb",

  }
});
