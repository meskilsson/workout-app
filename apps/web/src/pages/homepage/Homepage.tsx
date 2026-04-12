import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";
import Card from "../../components/ui/cards/Card";
import "./Homepage.css";
import "../../components/ui/cards/card.css";
import dumbellImage from "../../components/ui/cards/cardimages/dumbell-chalk.webp";

export default function Homepage() {

  const { logout } = useAuth();

  const navigate = useNavigate();

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
  }

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

      <Button
        onClick={handleLogout}
      >Logout</Button>
    </Box>
  );
}