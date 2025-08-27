import { useState } from "react";
import { saveToken } from "../lib/auth.utils";
import { scanStore } from "@/lib/scanStore";

interface Props {
  onSuccess: () => void;
}

export function SignUpForm({ onSuccess }: Props) {
  const [username, setusername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    // const scanId = getFromLocalStorage("scanId");
    const scanId = scanStore.length > 0 ? scanStore[0] : null;
    console.log("Login scanId:", scanId);

    const res = await fetch("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, scanId }),
    });

    const data = await res.json();
    if (res.ok) {
      saveToken(data.token);
      onSuccess();
    } else {
      alert(data.message || "Signup failed");
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Username"
        className="border p-2 rounded w-full"
        value={username}
        onChange={(e) => setusername(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        className="border p-2 rounded w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 rounded w-full"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleSignup}
        className="w-full bg-robo-gradient text-white py-2 rounded"
      >
        Sign Up
      </button>
    </div>
  );
}
