import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/cards/Card";
import "./Homepage.css";
import "../../components/ui/cards/card.css";
import dumbellImage from "../../components/ui/cards/cardimages/dumbell-chalk.webp";
import { useNavigate } from "react-router-dom";


export default function Homepage() {
  const navigate = useNavigate();

  return (
    <Box className="homepage-container">
      <Card title="Workout-Card">
        <div>
          <img src={dumbellImage} alt="Dumbbell with chalk" />
        </div>
        <Button onClick={() => navigate("/workout-select")}>
          Start Workout
        </Button>
      </Card>
    </Box>
  );
}
