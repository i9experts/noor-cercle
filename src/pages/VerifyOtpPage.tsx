import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";

function getApiErrorMessage(error: unknown) {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === "string" && message.length > 0 ? message : null;
}

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("resetEmail") || "";
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await authService.verifyOtp({ email, otp });
      toast({
        title: "OTP verified",
        description: "You can now reset your password.",
      });
      navigate("/reset-password");
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: getApiErrorMessage(e) || "Please check the code and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Verify OTP"
      subtitle="We have sent a 6-digit code to your email. Enter it below to continue password reset."
    >
      <p className="text-sm text-muted-foreground">Please check your inbox and enter the OTP.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="otp" className="text-sm font-medium text-nc-dark">
            OTP Code
          </label>
          <Input
            id="otp"
            type="text"
            placeholder="123456"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal-dk" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Did not receive code?{" "}
        <Link to="/forgot-password" className="font-semibold text-teal hover:text-teal-dk">
          Resend OTP
        </Link>
      </p>
    </AuthShell>
  );
};

export default VerifyOtpPage;
