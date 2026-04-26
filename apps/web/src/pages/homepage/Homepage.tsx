import { useNavigate } from "react-router-dom";
import Box from "../../components/ui/box/Box";

import Card from "../../components/ui/cards/Card";
import "./Homepage.css";
import "../../components/ui/cards/card.css";
import dumbellImage from "../../components/ui/cards/cardimages/dumbell-chalk.webp";

export default function Homepage() {

  const navigate = useNavigate();



  return (
    <Box className="homepage-container">
      <Card
        variant="image"
        className="homepage-workout-card"
        onClick={() => navigate("/workout-select")}
      >
        <div className="card__image-wrapper">
          <img
            src={dumbellImage}
            alt="Dumbbell with chalk"
            className="card__image"
          />
        </div>

        <div className="card__content homepage-workout-card__content">
          <h2 className="homepage-workout-card__title">Start Workout</h2>
          <p className="homepage-workout-card__text">
            Choose muscle groups and build your next session.
          </p>
        </div>
      </Card>

    </Box>
  );
}