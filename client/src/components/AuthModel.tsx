import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { SignUpForm } from "./Signup-Form";
import { LoginForm } from "./Login-Form";

interface AuthModalProps {
  onSuccess: () => void;
}

export function AuthModal({ onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(false);

  return (
    <Dialog.Root open={true}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md transform -translate-x-1/2 -translate-y-1/2">
          <h2 className="text-lg font-semibold mb-4 text-center">
            {isLogin ? "Log In" : "Sign Up"} to view your report
          </h2>

          {isLogin ? (
            <LoginForm onSuccess={onSuccess} />
          ) : (
            <SignUpForm onSuccess={onSuccess} />
          )}

          <p className="text-sm mt-4 text-center">
            {isLogin ? "Don’t have an account?" : "Already have an account?"}
            <button
              className="ml-2 text-blue-600 underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
