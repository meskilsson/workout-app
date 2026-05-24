import { useNavigate } from "react-router-dom";

import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";

import styles from "./CreateTemplatePage.module.css";

export default function CreateTemplatePage() {
    const navigate = useNavigate();

    return (
        <section className={styles.page}>
            <Card className={styles.card}>
                <Button
                    type="button"
                    variant="secondary"
                    style={{ minWidth: "3.25rem", marginBottom: "1rem" }}
                    className={styles.backButton}
                    onClick={() => navigate(-1)}

                >
                    <span className={styles.buttonArrow}>←</span>
                </Button>
                <p className={styles.kicker}>Create workout</p>

                <h1 className={styles.title}>Build a reusable workout</h1>



                <div className={styles.steps}>
                    <div className={styles.step}>
                        <span>1</span>
                        <div>
                            <h2>Choose muscles</h2>
                            <p>Select what this workout should train.</p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <span>2</span>
                        <div>
                            <h2>Pick exercises</h2>
                            <p>Add the exercises that should belong to the workout.</p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <span>3</span>
                        <div>
                            <h2>Save as workout</h2>
                            <p>Name it, choose a category, and save it for later.</p>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate("/templates/my")}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        onClick={() => navigate("/workout-select?purpose=template")}
                    >
                        Start building workout
                    </Button>
                </div>
            </Card>
        </section>
    );
}