type SignupInput = {
    name: string;
    email: string;
    username: string;
    password: string;
};

type LoginInput = {
    email: string;
    password: string;
};

export async function signupRequest(signupData: SignupInput) {
    const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Signup failed");
    }

    return data;
}

export async function loginRequest(loginData: LoginInput) {
    const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Login failed");
    }

    return data;
}