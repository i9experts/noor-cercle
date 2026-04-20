import { Link } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";

const ResetSuccessPage = () => {
  return (
    <AuthShell
      title="Password Updated"
      subtitle="Your password has been reset successfully. You can now sign in with your new credentials."
    >
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Great! Your account is secure again. Continue to login.
        </p>

        <Link to="/signin" className="block">
          <Button className="h-11 w-full bg-teal text-white hover:bg-teal-dk">Go to Sign In</Button>
        </Link>
      </div>
    </AuthShell>
  );
};

export default ResetSuccessPage;
