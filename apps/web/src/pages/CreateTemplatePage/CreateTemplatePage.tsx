import { ArrowRight, ArrowLeft } from "lucide-react";
import Icon from "../../components/ui/icon/Icon";
import { useNavigate } from "../../routes/navigationHooks";

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
                    iconOnly
                        className={styles.backButton}
                    aria-label="Go back"
                    onClick={() => navigate(-1)}

                >
                    <Icon icon={ArrowLeft} />
                </Button>
                <p className={styles.kicker}>Workout template</p>

                <h1 className={styles.title}>Create a template</h1>



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
                            <p>Choose your exercises and their order.</p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <span>3</span>
                        <div>
                            <h2>Save your template</h2>
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

                    <Button icon={ArrowRight}
                        type="button"
                        onClick={() => navigate("/workout-select?purpose=template")}
                    >
                        Choose muscles
                    </Button>
                </div>
            </Card>
        </section>
    );
}
