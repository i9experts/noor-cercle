import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";

function getApiError(error: unknown) {
  const msg = (error as any)?.response?.data?.message;
  return typeof msg === "string" && msg.length > 0 ? msg : null;
}

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ email });
      localStorage.setItem("resetEmail", email);
      toast({
        title: "OTP Sent!",
        description: "Check your email for a 6-digit code. It expires in 2 minutes.",
      });
      // Go to unified OTP page with reset flow
      navigate("/verify-otp?flow=reset");
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Could not send OTP",
        description: getApiError(e) || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your email and we will send you a 6-digit code to reset your password."
    >
      <p className="text-sm text-muted-foreground">Enter your registered email address.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-nc-dark">Email</label>
          <Input id="email" type="email" placeholder="you@example.com" required
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
        </div>
        <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal-dk" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send OTP"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Back to{" "}
        <Link to="/signin" className="font-semibold text-teal hover:text-teal-dk">Sign In</Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
