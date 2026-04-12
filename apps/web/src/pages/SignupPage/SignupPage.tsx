import Card from "../../components/ui/cards/Card";
import Box from "../../components/ui/box/Box";
import Button from "../../components/ui/button/Button";

import { useState } from "react";
import { useNavigate } from "react-router";
import { signupRequest } from "../../services/authApi";

export default function SignupPage() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);


    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await signupRequest({
                name,
                email,
                username,
                password
            });

            navigate("/login");
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
            <Card
                title="Sign up"
            >
                <form
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="name">Name</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="name..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="123@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="oogabooga"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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

                    <Button
                        type="submit"
                        disabled={isLoading}
                    >{isLoading ? "Creating account..." : "Sign up"}</Button>
                </form>
            </Card>
        </Box>
    );
}