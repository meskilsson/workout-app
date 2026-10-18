import { useState } from "react";
import {
  validateTraining,
  trainingTotalSeconds,
  formatTrainingSeconds,
  type TrainingConfig,
  type CardioCompletion,
} from "@workout-app/shared";
import { Action, Form, Row, Txt, type FormField } from "./ui";
import { t } from "../i18n";

export default function TrainingActivity({
  initial,
  onSave,
  onDirty,
  cardioOnly = false,
}: {
  cardioOnly?: boolean;
  initial?: TrainingConfig;
  building: boolean;
  activeId: string | null;
  exerciseId: string;
  onStart: () => void;
  onSave: (
    training: TrainingConfig,
    completion?: CardioCompletion,
  ) => Promise<void>;
  onDirty: (dirty: boolean) => void;
}) {
  const config = initial ?? { format: "strength" };
  const [format, setFormat] = useState(config.format),
    [unit, setUnit] = useState<"km" | "mi" | "m">(
      config.format === "cardio" ? (config.distanceUnit ?? "km") : "km",
    );
  const work = config.format === "intervals" ? config.workSeconds : 30,
    rest = config.format === "intervals" ? config.restSeconds : 90,
    duration = config.format === "cardio" ? config.durationSeconds : 600;
  function seconds(prefix: string, title: string, value: number): FormField[] {
    return [
      {
        name: `${prefix}Min`,
        title: `${title} · minutes`,
        value: String(Math.floor(value / 60)),
        required: true,
        numeric: true,
        integer: true,
        minValue: 0,
        maxValue: 360,
      },
      {
        name: `${prefix}Sec`,
        title: `${title} · seconds`,
        value: String(value % 60),
        required: true,
        numeric: true,
        integer: true,
        minValue: 0,
        maxValue: 59,
      },
    ];
  }
  return (
    <>
      <Row>
        {(cardioOnly
          ? (["cardio", "intervals"] as const)
          : (["strength", "cardio", "intervals"] as const)
        ).map((value) => (
          <Action
            key={value}
            selected={value === format}
            onPress={() => {
              setFormat(value);
              onDirty(true);
            }}
          >
            {value}
          </Action>
        ))}
      </Row>
      {format === "cardio" && (
        <Row>
          {(["km", "mi", "m"] as const).map((value) => (
            <Action
              key={value}
              selected={unit === value}
              onPress={() => {
                setUnit(value);
                onDirty(true);
              }}
            >
              {value}
            </Action>
          ))}
        </Row>
      )}
      <Form
        key={format}
        fields={
          format === "strength"
            ? []
            : format === "cardio"
              ? [
                  ...seconds("duration", "Duration", duration),
                  {
                    name: "distance",
                    title: "Target distance (optional)",
                    value:
                      config.format === "cardio"
                        ? String(config.targetDistance ?? "")
                        : "",
                    numeric: true,
                    minValue: 0.001,
                    maxValue: 1000000,
                  },
                ]
              : [
                  {
                    name: "rounds",
                    title: "Rounds",
                    value: String(
                      config.format === "intervals" ? config.rounds : 8,
                    ),
                    required: true,
                    numeric: true,
                    integer: true,
                    minValue: 1,
                    maxValue: 100,
                  },
                  ...seconds("work", "Work", work),
                  ...seconds("rest", "Rest", rest),
                ]
        }
        button="Save configuration"
        validate={(values) => {
          const errors: Record<string, string> = {};
          const phase = (prefix: string, min: number) => {
            const value =
              Number(values[`${prefix}Min`]) * 60 +
              Number(values[`${prefix}Sec`]);
            if (Number.isFinite(value) && (value < min || value > 21600))
              errors[`${prefix}Min`] = t(
                "TrainingConfigForm.chooseValuenoMoreThan6Hours",
                { value0: min ? t("common.minimumDuration") : "" },
              );
            return value;
          };
          if (format === "cardio") phase("duration", 1);
          if (format === "intervals") {
            const work = phase("work", 1),
              rest = phase("rest", 0);
            if (
              Number(values.rounds) * work +
                (Number(values.rounds) - 1) * rest >
              86400
            )
              errors.rounds = t(
                "TrainingConfigForm.reduceTheRoundsOrPhaseDurationsToStayWithin",
              );
          }
          return errors;
        }}
        onChange={() => onDirty(true)}
        submit={async (values) => {
          const n = (key: string) => Number(values[key]);
          const candidate = validateTraining(
            format === "strength"
              ? { format }
              : format === "cardio"
                ? {
                    format,
                    durationSeconds: n("durationMin") * 60 + n("durationSec"),
                    ...(values.distance
                      ? { targetDistance: n("distance"), distanceUnit: unit }
                      : {}),
                  }
                : {
                    format,
                    rounds: n("rounds"),
                    workSeconds: n("workMin") * 60 + n("workSec"),
                    restSeconds: n("restMin") * 60 + n("restSec"),
                  },
          );
          await onSave(candidate);
          onDirty(false);
        }}
      />
      <Txt>
        {format === "strength"
          ? ""
          : "Enter whole minutes and seconds; work must be positive. Up to 6 hours per phase and 24 hours total."}
      </Txt>
      {config.format !== "strength" && (
        <Txt>{formatTrainingSeconds(trainingTotalSeconds(config))}</Txt>
      )}
    </>
  );
}
