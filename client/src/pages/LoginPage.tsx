import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

const LoginPage = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  console.log("Current user in LoginPage:", user);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("User logged in, redirecting to home:", user);
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSuccess = () => {
    console.log("Login successful, redirecting to home");
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm onSuccess={handleSuccess} />
    </div>
  );
};

export default LoginPage;
