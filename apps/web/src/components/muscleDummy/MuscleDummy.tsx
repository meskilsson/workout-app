import {
    mapMusclesToDummyRegions,
    type DummyRegion,
} from "@workout-app/shared";
import styles from "./MuscleDummy.module.css";

type MuscleDummyProps = {
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    variant?: "full" | "mini";
};

function getRegionClass(
    region: DummyRegion,
    primaryRegions: DummyRegion[],
    secondaryRegions: DummyRegion[],
) {
    if (primaryRegions.includes(region)) {
        return `${styles.region} ${styles.primaryActive}`;
    }

    if (secondaryRegions.includes(region)) {
        return `${styles.region} ${styles.secondaryActive}`;
    }

    return styles.region;
}

export default function MuscleDummy({
    primaryMuscles = [],
    secondaryMuscles = [],
    variant = "full",
}: MuscleDummyProps) {
    const primaryRegions = mapMusclesToDummyRegions(primaryMuscles);
    const secondaryRegions = mapMusclesToDummyRegions(secondaryMuscles);

    return (
        <div
            className={`${styles.wrapper} ${variant === "mini" ? styles.miniWrapper : ""
                }`}
        >
            <div className={styles.figureBlock}>
                <p className={styles.label}>Front</p>

                <svg
                    viewBox="0 0 180 360"
                    className={styles.dummy}
                    aria-label="Front muscle view"
                    role="img"
                >
                    <circle cx="90" cy="36" r="20" className={styles.baseBody} />

                    <rect
                        x="70"
                        y="58"
                        width="40"
                        height="54"
                        rx="18"
                        className={styles.baseBody}
                    />

                    <rect
                        x="73"
                        y="110"
                        width="34"
                        height="52"
                        rx="12"
                        className={styles.baseBody}
                    />

                    <rect
                        x="48"
                        y="60"
                        width="18"
                        height="72"
                        rx="10"
                        className={styles.baseBody}
                    />

                    <rect
                        x="114"
                        y="60"
                        width="18"
                        height="72"
                        rx="10"
                        className={styles.baseBody}
                    />

                    <rect
                        x="51"
                        y="132"
                        width="14"
                        height="64"
                        rx="8"
                        className={styles.baseBody}
                    />

                    <rect
                        x="115"
                        y="132"
                        width="14"
                        height="64"
                        rx="8"
                        className={styles.baseBody}
                    />

                    <rect
                        x="68"
                        y="164"
                        width="18"
                        height="92"
                        rx="10"
                        className={styles.baseBody}
                    />

                    <rect
                        x="94"
                        y="164"
                        width="18"
                        height="92"
                        rx="10"
                        className={styles.baseBody}
                    />

                    <rect
                        x="69"
                        y="256"
                        width="16"
                        height="72"
                        rx="8"
                        className={styles.baseBody}
                    />

                    <rect
                        x="95"
                        y="256"
                        width="16"
                        height="72"
                        rx="8"
                        className={styles.baseBody}
                    />

                    <ellipse
                        cx="76"
                        cy="78"
                        rx="12"
                        ry="10"
                        className={getRegionClass(
                            "frontShoulders",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="104"
                        cy="78"
                        rx="12"
                        ry="10"
                        className={getRegionClass(
                            "frontShoulders",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="90"
                        cy="84"
                        rx="18"
                        ry="14"
                        className={getRegionClass(
                            "chest",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <rect
                        x="77"
                        y="112"
                        width="26"
                        height="42"
                        rx="10"
                        className={getRegionClass(
                            "core",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="57"
                        cy="104"
                        rx="9"
                        ry="18"
                        className={getRegionClass(
                            "biceps",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="123"
                        cy="104"
                        rx="9"
                        ry="18"
                        className={getRegionClass(
                            "biceps",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="58"
                        cy="160"
                        rx="7"
                        ry="18"
                        className={getRegionClass(
                            "forearms",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="122"
                        cy="160"
                        rx="7"
                        ry="18"
                        className={getRegionClass(
                            "forearms",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="78"
                        cy="210"
                        rx="12"
                        ry="34"
                        className={getRegionClass(
                            "frontQuads",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="102"
                        cy="210"
                        rx="12"
                        ry="34"
                        className={getRegionClass(
                            "frontQuads",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="77"
                        cy="288"
                        rx="9"
                        ry="22"
                        className={getRegionClass(
                            "calves",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="103"
                        cy="288"
                        rx="9"
                        ry="22"
                        className={getRegionClass(
                            "calves",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />
                </svg>
            </div>

            <div className={styles.figureBlock}>
                <p className={styles.label}>Back</p>

                <svg
                    viewBox="0 0 180 360"
                    className={styles.dummy}
                    aria-label="Back muscle view"
                    role="img"
                >
                    <circle cx="90" cy="36" r="20" className={styles.baseBody} />

                    <rect
                        x="70"
                        y="58"
                        width="40"
                        height="54"
                        rx="18"
                        className={styles.baseBody}
                    />

                    <rect
                        x="73"
                        y="110"
                        width="34"
                        height="52"
                        rx="12"
                        className={styles.baseBody}
                    />

                    <rect
                        x="48"
                        y="60"
                        width="18"
                        height="72"
                        rx="10"
                        className={styles.baseBody}
                    />

                    <rect
                        x="114"
                        y="60"
                        width="18"
                        height="72"
                        rx="10"
                        className={styles.baseBody}
                    />

                    <rect
                        x="51"
                        y="132"
                        width="14"
                        height="64"
                        rx="8"
                        className={styles.baseBody}
                    />

                    <rect
                        x="115"
                        y="132"
                        width="14"
                        height="64"
                        rx="8"
                        className={styles.baseBody}
                    />

                    <rect
                        x="68"
                        y="164"
                        width="18"
                        height="92"
                        rx="10"
                        className={styles.baseBody}
                    />

                    <rect
                        x="94"
                        y="164"
                        width="18"
                        height="92"
                        rx="10"
                        className={styles.baseBody}
                    />

                    <rect
                        x="69"
                        y="256"
                        width="16"
                        height="72"
                        rx="8"
                        className={styles.baseBody}
                    />

                    <rect
                        x="95"
                        y="256"
                        width="16"
                        height="72"
                        rx="8"
                        className={styles.baseBody}
                    />

                    <ellipse
                        cx="76"
                        cy="78"
                        rx="12"
                        ry="10"
                        className={getRegionClass(
                            "rearShoulders",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="104"
                        cy="78"
                        rx="12"
                        ry="10"
                        className={getRegionClass(
                            "rearShoulders",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="82"
                        cy="96"
                        rx="13"
                        ry="30"
                        className={getRegionClass(
                            "lats",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="98"
                        cy="96"
                        rx="13"
                        ry="30"
                        className={getRegionClass(
                            "lats",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="90"
                        cy="86"
                        rx="16"
                        ry="20"
                        className={getRegionClass(
                            "upperBack",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="57"
                        cy="104"
                        rx="9"
                        ry="18"
                        className={getRegionClass(
                            "triceps",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="123"
                        cy="104"
                        rx="9"
                        ry="18"
                        className={getRegionClass(
                            "triceps",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="58"
                        cy="160"
                        rx="7"
                        ry="18"
                        className={getRegionClass(
                            "forearms",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="122"
                        cy="160"
                        rx="7"
                        ry="18"
                        className={getRegionClass(
                            "forearms",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="90"
                        cy="176"
                        rx="18"
                        ry="16"
                        className={getRegionClass(
                            "glutes",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="78"
                        cy="210"
                        rx="12"
                        ry="32"
                        className={getRegionClass(
                            "hamstrings",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="102"
                        cy="210"
                        rx="12"
                        ry="32"
                        className={getRegionClass(
                            "hamstrings",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="77"
                        cy="288"
                        rx="9"
                        ry="22"
                        className={getRegionClass(
                            "calves",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />

                    <ellipse
                        cx="103"
                        cy="288"
                        rx="9"
                        ry="22"
                        className={getRegionClass(
                            "calves",
                            primaryRegions,
                            secondaryRegions,
                        )}
                    />
                </svg>
            </div>
        </div>
    );
}