import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { bodyFront } from "../assets/body/bodyFront";
import { bodyBack } from "../assets/body/bodyBack";
import { bodyFemaleFront } from "../assets/body/bodyFemaleFront";
import { bodyFemaleBack } from "../assets/body/bodyFemaleBack";
import { usePreferences } from "../context/PreferencesContext";
import { Txt, Row } from "./ui";

const slugs: Record<string, string[]> = {
  chest: ["chest"],
  back: ["upper-back", "lower-back", "trapezius"],
  shoulders: ["deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  quads: ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes: ["gluteal"],
  calves: ["calves"],
  core: ["abs"],
  forearms: ["forearm"],
};
export default function MusclePreview({
  primary = [],
  secondary = [],
}: {
  primary?: string[];
  secondary?: string[];
}) {
  const prefs = usePreferences();
  const first = primary.flatMap((m) => slugs[m.trim().toLowerCase()] ?? []),
    second = secondary.flatMap((m) => slugs[m.trim().toLowerCase()] ?? []);
  const female = prefs.bodyModel === "female";
  return (
    <View
      accessible
      accessibilityLabel={`Primary: ${primary.join(", ")}. Secondary: ${secondary.join(", ")}.`}
    >
      <Row>
        {[
          female ? bodyFemaleFront : bodyFront,
          female ? bodyFemaleBack : bodyBack,
        ].map((parts, index) => (
          <View key={index} style={{ flex: 1, minWidth: 100 }}>
            <Txt>{index ? "Back" : "Front"}</Txt>
            <Svg
              width="100%"
              height={260}
              viewBox={
                female
                  ? index
                    ? "756 0 774 1448"
                    : "-50 -40 734 1538"
                  : index
                    ? "724 0 724 1448"
                    : "0 0 724 1448"
              }
            >
              {parts.flatMap((part, i) =>
                Object.values(part.path ?? {})
                  .flatMap((paths) => paths ?? [])
                  .map((path, j) => (
                    <Path
                      key={`${i}:${j}`}
                      d={path}
                      fill={
                        first.includes(part.slug ?? "")
                          ? "#3E5B50"
                          : second.includes(part.slug ?? "")
                            ? "#BAC0E3"
                            : prefs.theme === "dark"
                              ? "#6F7B85"
                              : "#DBD8D8"
                      }
                    />
                  )),
              )}
            </Svg>
          </View>
        ))}
      </Row>
    </View>
  );
}
