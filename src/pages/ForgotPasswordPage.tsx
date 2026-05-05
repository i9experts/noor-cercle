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

// const ForgotPasswordPage = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const [email, setEmail] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setIsSubmitting(true);
//     try {
//       await authService.forgotPassword({ email });
//       localStorage.setItem("resetEmail", email); // ← YEH LINE HAI?
//       toast({
//         title: "OTP sent",
//         description: "If the email exists, we sent a 6-digit code. Please check your inbox.",
//       });
//       navigate("/verify-otp");
//     } catch (e: unknown) {
//       toast({
//         variant: "destructive",
//         title: "Could not send OTP",
//         description: getApiErrorMessage(e) || "Please try again.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <AuthShell
//       title="Forgot Password"
//       subtitle="No worries. Enter your email and we will send an OTP to reset your password securely."
//     >
//       <p className="text-sm text-muted-foreground">Enter your registered email address.</p>

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div className="space-y-2">
//           <label htmlFor="email" className="text-sm font-medium text-nc-dark">
//             Email
//           </label>
//           <Input
//             id="email"
//             type="email"
//             placeholder="you@example.com"
//             required
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             disabled={isSubmitting}
//           />
//         </div>

//         <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal-dk" disabled={isSubmitting}>
//           {isSubmitting ? "Sending..." : "Send OTP"}
//         </Button>
//       </form>

//       <p className="text-center text-sm text-muted-foreground">
//         Back to{" "}
//         <Link to="/signin" className="font-semibold text-teal hover:text-teal-dk">
//           Sign In
//         </Link>
//       </p>
//     </AuthShell>
//   );
// };

// export default ForgotPasswordPage;


import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { authService, getErrorMessage } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';

const ForgotPasswordPage = () => {
  const navigate      = useNavigate();
  const { toast }     = useToast();
  const [email,       setEmail]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authService.forgotPassword({ email });
      localStorage.setItem('resetEmail', email);
      toast({ title: 'OTP Sent', description: 'Check your inbox for the 6-digit code.' });
      navigate('/verify-otp');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not send OTP', description: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Forgot Password" subtitle="No worries. Enter your email and we will send an OTP to reset your password securely.">
      <p className="text-sm text-muted-foreground">Enter your registered email address.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-nc-dark">Email</label>
          <Input type="email" placeholder="you@example.com" required
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
        </div>
        <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal-dk" disabled={submitting}>
          {submitting ? 'Sending OTP...' : 'Send OTP'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Back to{' '}
        <Link to="/signin" className="font-semibold text-teal hover:text-teal-dk">Sign In</Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
