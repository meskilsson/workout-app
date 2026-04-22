import { useNavigate } from "react-router-dom";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/cards/Card";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <Box>
            <Card title="Workout App">
                <p>Welcome to the workout app.</p>
                <p>Guests can browse. Logged-in users can save and create workouts.</p>

                <Button onClick={() => navigate("/login")}>Login</Button>
                <Button onClick={() => navigate("/signup")}>Sign Up</Button>
                <Button onClick={() => navigate("/templates")}>Browse Templates</Button>
            </Card>
        </Box>
    );
}