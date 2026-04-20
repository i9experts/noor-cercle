import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthShell from "@/components/auth/AuthShell";

import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";

function getApiErrorMessage(error: unknown) {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === "string" && message.length > 0 ? message : null;
}

const SignUpPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    // Debug log
    console.log("🔵 Signup attempt:", { fullName, email, passwordLength: password.length });
    
    try {
      const response = await authService.signup({ fullName, email, password });
      
      // Debug log
      console.log("✅ Signup successful:", response);
      
      // toast({
      //   title: "Account created",
      //   description: response.message || "You can now sign in with your credentials.",
      // });
      navigate("/signin");
    } catch (e: unknown) {
      // Debug log
      console.error("❌ Signup failed:", e);
      console.error("Error response:", (e as any)?.response?.data);
      console.error("Error status:", (e as any)?.response?.status);
      
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: getApiErrorMessage(e) || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign Up"
      subtitle="Build your Noor Circle account and start managing your local programme with ease."
    >
      <p className="text-sm text-muted-foreground">Create your account to continue.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium text-nc-dark">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="Your full name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-nc-dark">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-nc-dark">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Create password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" className="h-11 w-full bg-gold text-white hover:bg-gold-dim" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/signin" className="font-semibold text-teal hover:text-teal-dk">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default SignUpPage;
