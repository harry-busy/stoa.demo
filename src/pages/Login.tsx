import LoginPage from "@/components/ui/animated-characters-login-page";
import { useSEO } from "@/lib/seo";

const Login = () => {
  useSEO({ title: "Login — Stoa", description: "Sign in to your Stoa account to access the AI agent marketplace." });

  return <LoginPage />;
};

export default Login;
