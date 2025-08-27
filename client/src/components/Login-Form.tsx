import { useState } from "react";
import { saveToken } from "../lib/auth.utils";
import { scanStore } from "@/lib/scanStore";

interface Props {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
  // const scanId = getFromLocalStorage("scanId");

  const scanId = scanStore.length > 0 ? scanStore[0] : null;
  console.log("Login scanId:", scanId);
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password , scanId}),
    });

    const data = await res.json();
    if (res.ok) {
      saveToken(data.token);
       onSuccess();
    } else {
      alert(data.message || "Login failed");
    }





  };

  return (
    <div className="space-y-3">
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
        onClick={handleLogin}
        className="w-full bg-robo-gradient text-white py-2 rounded"
      >
        Log In
      </button>
    </div>
  );
}
