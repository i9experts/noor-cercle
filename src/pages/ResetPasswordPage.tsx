// import { FormEvent, useState } from "react";
// import { Link } from "react-router-dom";
// import { useNavigate } from "react-router-dom";
// import AuthShell from "@/components/auth/AuthShell";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// import { authService } from "@/services/auth.service";
// import { useToast } from "@/hooks/use-toast";

// function getApiErrorMessage(error: unknown) {
//   const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
//   return typeof message === "string" && message.length > 0 ? message : null;
// }

// const ResetPasswordPage = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();

//     if (newPassword !== confirmPassword) {
//       toast({
//         variant: "destructive",
//         title: "Passwords do not match",
//         description: "Please make sure both passwords are the same.",
//       });
//       return;
//     }

//     const resetToken = localStorage.getItem("resetToken") || "";
//     if (!resetToken) {
//       toast({
//         variant: "destructive",
//         title: "Reset session missing",
//         description: "Please request a new OTP and try again.",
//       });
//       navigate("/forgot-password");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       await authService.resetPassword(newPassword, resetToken);
//       localStorage.removeItem("resetToken");
//       localStorage.removeItem("resetEmail");

//       navigate("/reset-success");
//     } catch (e: unknown) {
//       toast({
//         variant: "destructive",
//         title: "Password reset nahi hua",
//         description: getApiErrorMessage(e) || "Dobara koshish karo.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <AuthShell
//       title="Reset Password"
//       subtitle="Create a strong new password for your Noor Circle account and keep your profile secure."
//     >
//       <p className="text-sm text-muted-foreground">Your new password must be at least 8 characters.</p>

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div className="space-y-2">
//           <label htmlFor="newPassword" className="text-sm font-medium text-nc-dark">
//             New Password
//           </label>
//           <Input
//             id="newPassword"
//             type="password"
//             placeholder="Enter new password"
//             required
//             value={newPassword}
//             onChange={(e) => setNewPassword(e.target.value)}
//             disabled={isSubmitting}
//           />
//         </div>

//         <div className="space-y-2">
//           <label htmlFor="confirmPassword" className="text-sm font-medium text-nc-dark">
//             Confirm Password
//           </label>
//           <Input
//             id="confirmPassword"
//             type="password"
//             placeholder="Confirm new password"
//             required
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             disabled={isSubmitting}
//           />
//         </div>

//         <Button type="submit" className="h-11 w-full bg-gold text-white hover:bg-gold-dim" disabled={isSubmitting}>
//           {isSubmitting ? "Updating..." : "Update Password"}
//         </Button>
//       </form>

//       <p className="text-center text-sm text-muted-foreground">
//         Remembered your password?{" "}
//         <Link to="/signin" className="font-semibold text-teal hover:text-teal-dk">
//           Sign In
//         </Link>
//       </p>
//     </AuthShell>
//   );
// };

// export default ResetPasswordPage;



import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { authService, getErrorMessage } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';

const ResetPasswordPage = () => {
  const navigate      = useNavigate();
  const { toast }     = useToast();
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting,      setSubmitting]      = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match', description: 'Please make sure both fields are the same.' });
      return;
    }

    const resetToken = localStorage.getItem('resetToken') || '';
    if (!resetToken) {
      toast({ variant: 'destructive', title: 'Session expired', description: 'Please request a new OTP.' });
      navigate('/forgot-password');
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPassword(newPassword, resetToken);
      localStorage.removeItem('resetToken');
      localStorage.removeItem('resetEmail');
      navigate('/reset-success');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Reset failed', description: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Reset Password" subtitle="Create a strong new password for your Noor Circle account.">
      <p className="text-sm text-muted-foreground">Your new password must be at least 8 characters.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-nc-dark">New Password</label>
          <Input type="password" placeholder="Enter new password" required
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={submitting} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-nc-dark">Confirm Password</label>
          <Input type="password" placeholder="Confirm new password" required
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={submitting} />
        </div>

        <Button type="submit" className="h-11 w-full bg-gold text-white hover:bg-gold-dim" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update Password'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/signin" className="font-semibold text-teal hover:text-teal-dk">← Sign In</Link>
      </p>
    </AuthShell>
  );
};

export default ResetPasswordPage;
