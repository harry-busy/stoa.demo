import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginPage from "@/components/ui/animated-characters-login-page";
import { useSEO } from "@/lib/seo";
import { useAuth } from "@/lib/auth-context";

const Login = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useSEO({ title: "Login — Stoa", description: "Sign in to your Stoa account to access the AI agent marketplace." });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  return <LoginPage />;
};

export default Login;
