// import { FormEvent, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import AuthShell from "@/components/auth/AuthShell";

// import { authService } from "@/services/auth.service";
// import { useToast } from "@/hooks/use-toast";

// function getApiErrorMessage(error: unknown) {
//   const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
//   return typeof message === "string" && message.length > 0 ? message : null;
// }

// const SignUpPage = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setIsSubmitting(true);
    
//     // Debug log
//     console.log("🔵 Signup attempt:", { fullName, email, passwordLength: password.length });
    
//     try {
//       const response = await authService.signup({ fullName, email, password });
      
//       // Debug log
//       console.log("✅ Signup successful:", response);
      
//       // toast({
//       //   title: "Account created",
//       //   description: response.message || "You can now sign in with your credentials.",
//       // });
//       navigate("/signin");
//     } catch (e: unknown) {
//       // Debug log
//       console.error("❌ Signup failed:", e);
//       const err = e as { response?: { data?: unknown; status?: number } };
//       console.error("Error response:", err?.response?.data);
//       console.error("Error status:", err?.response?.status);
      
//       toast({
//         variant: "destructive",
//         title: "Sign up failed",
//         description: getApiErrorMessage(e) || "Please try again.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <AuthShell
//       title="Sign Up"
//       subtitle="Build your Noor Circle account and start managing your local programme with ease."
//     >
//       <p className="text-sm text-muted-foreground">Create your account to continue.</p>

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div className="space-y-2">
//           <label htmlFor="fullName" className="text-sm font-medium text-nc-dark">
//             Full Name
//           </label>
//           <Input
//             id="fullName"
//             type="text"
//             placeholder="Your full name"
//             required
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//             disabled={isSubmitting}
//           />
//         </div>

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

//         <div className="space-y-2">
//           <label htmlFor="password" className="text-sm font-medium text-nc-dark">
//             Password
//           </label>
//           <Input
//             id="password"
//             type="password"
//             placeholder="Create password"
//             required
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             disabled={isSubmitting}
//           />
//         </div>

//         <Button type="submit" className="h-11 w-full bg-gold text-white hover:bg-gold-dim" disabled={isSubmitting}>
//           {isSubmitting ? "Creating..." : "Create Account"}
//         </Button>
//       </form>

//       <p className="text-center text-sm text-muted-foreground">
//         Already have an account?{" "}
//         <Link to="/signin" className="font-semibold text-teal hover:text-teal-dk">
//           Sign in
//         </Link>
//       </p>
//     </AuthShell>
//   );
// };

// export default SignUpPage;

import { FormEvent, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import AuthShell  from '@/components/auth/AuthShell';
import { authService, getErrorMessage } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const OTP_SECONDS = 120;

type Step = 'form' | 'otp';

const SignUpPage = () => {
  const navigate   = useNavigate();
  const { toast }  = useToast();
  const { saveTokens } = useAuth();

  const [step,        setStep]        = useState<Step>('form');
  const [fullName,    setFullName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [otp,         setOtp]         = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [resending,   setResending]   = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(OTP_SECONDS);
  const [timerActive, setTimerActive] = useState(false);

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) { setTimerActive(false); return; }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, timerActive]);

  const startTimer = () => { setTimeLeft(OTP_SECONDS); setTimerActive(true); };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authService.signupRequestOtp({ fullName, email, password });
      localStorage.setItem('signupEmail', email);
      setStep('otp');
      startTimer();
      toast({ title: 'OTP Sent', description: 'Check your email for the 6-digit code.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sign up failed', description: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2: Verify OTP → Account Created ─────────────────────────────────
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await authService.signupVerifyOtp({ email, otp });
      saveTokens(data.accessToken, data.refreshToken, data.user);
      localStorage.removeItem('signupEmail');
      toast({ title: 'Account Created!', description: `Welcome, ${data.user.fullName}!` });
      // Murabbi portal → user ke naam ke sath
      navigate('/murabbi');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Verification failed', description: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    setResending(true);
    try {
      await authService.resendOtp(email, 'signup');
      setOtp('');
      startTimer();
      toast({ title: 'OTP Resent', description: 'A new code has been sent to your email.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Resend failed', description: getErrorMessage(err) });
    } finally {
      setResending(false);
    }
  }, [email, toast]);

  // ── OTP Step UI ───────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <AuthShell title="Verify Email" subtitle="Enter the 6-digit OTP sent to your email to complete registration.">
        <p className="text-sm text-muted-foreground">Code sent to <strong>{email}</strong></p>

        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-nc-dark">OTP Code</label>
            <Input
              type="text" inputMode="numeric" placeholder="• • • • • •"
              maxLength={6} required value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={submitting}
              className="text-center text-xl tracking-widest"
            />
          </div>

          {/* Timer */}
          <div className="text-center text-sm">
            {timerActive
              ? <span className="text-muted-foreground">Expires in <span className={`font-semibold ${timeLeft <= 30 ? 'text-red-500' : 'text-teal'}`}>{formatTime(timeLeft)}</span></span>
              : <span className="text-red-500 font-medium">OTP expired — please resend</span>}
          </div>

          <Button type="submit" className="h-11 w-full bg-gold text-white hover:bg-gold-dim" disabled={submitting || otp.length !== 6}>
            {submitting ? 'Verifying...' : 'Verify & Create Account'}
          </Button>

          <Button type="button" variant="outline" className="h-11 w-full"
            onClick={handleResend} disabled={timerActive || resending}>
            {resending ? 'Sending...' : timerActive ? `Resend OTP (${formatTime(timeLeft)})` : 'Resend OTP'}
          </Button>
        </form>

        <button onClick={() => setStep('form')} className="text-sm text-teal hover:text-teal-dk">← Back</button>
      </AuthShell>
    );
  }

  // ── Form Step UI ──────────────────────────────────────────────────────────
  return (
    <AuthShell title="Sign Up" subtitle="Build your Noor Circle account and start managing your local programme with ease.">
      <p className="text-sm text-muted-foreground">Create your account to continue.</p>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-nc-dark">Full Name</label>
          <Input type="text" placeholder="Your full name" required value={fullName}
            onChange={(e) => setFullName(e.target.value)} disabled={submitting} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-nc-dark">Email</label>
          <Input type="email" placeholder="you@example.com" required value={email}
            onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-nc-dark">Password</label>
          <Input type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" required
            value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} />
        </div>

        <Button type="submit" className="h-11 w-full bg-gold text-white hover:bg-gold-dim" disabled={submitting}>
          {submitting ? 'Sending OTP...' : 'Continue'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/signin" className="font-semibold text-teal hover:text-teal-dk">Sign in</Link>
      </p>
    </AuthShell>
  );
};

export default SignUpPage;
