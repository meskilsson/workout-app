import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Box from "../../components/ui/box/Box";
import Card from "../../components/ui/cards/Card";
import Button from "../../components/ui/button/Button";
import { loginRequest } from "../../services/authApi";

export default function LoginPage() {

    const { login } = useAuth();

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {

            const user = await loginRequest({
                email, password
            });
            login(user);
            navigate("/homepage");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Something went wrong");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Box>
            <Card title="Login">
                <form onSubmit={handleSubmit}>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="123@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="*******"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && <p>{error}</p>}

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Login"}
                    </Button>
                </form>
            </Card>
            <Button
                onClick={() => navigate("/signup")}
            >Signup</Button>
        </Box>
    );
}