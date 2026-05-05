// import { FormEvent, useEffect, useState, useCallback } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import AuthShell from "@/components/auth/AuthShell";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { authService } from "@/services/auth.service";
// import { useToast } from "@/hooks/use-toast";

// function getApiErrorMessage(error: unknown) {
//   const message = (error as { response?: { data?: { message?: unknown } } })
//     ?.response?.data?.message;
//   return typeof message === "string" && message.length > 0 ? message : null;
// }

// const OTP_TIMER_SECONDS = 120; // 2 minute

// const VerifyOtpPage = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const [otp, setOtp] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isResending, setIsResending] = useState(false);

//   // ── Timer state ──────────────────────────────────────────────
//   const [timeLeft, setTimeLeft] = useState(OTP_TIMER_SECONDS);
//   const [timerActive, setTimerActive] = useState(true);

//   // ── Timer logic ──────────────────────────────────────────────
//   useEffect(() => {
//     if (!timerActive) return;
//     if (timeLeft <= 0) {
//       setTimerActive(false);
//       return;
//     }

//     const interval = setInterval(() => {
//       setTimeLeft((prev) => prev - 1);
//     }, 1000);

//     return () => clearInterval(interval); // cleanup
//   }, [timeLeft, timerActive]);

//   // ── Timer format: 1:45 ───────────────────────────────────────
//   const formatTime = (seconds: number) => {
//     const m = Math.floor(seconds / 60);
//     const s = seconds % 60;
//     return `${m}:${s.toString().padStart(2, '0')}`;
//   };

//   // ── OTP Submit ───────────────────────────────────────────────
//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setIsSubmitting(true);
//     try {
//       const res = await authService.verifyOtp(otp);
//       localStorage.setItem("resetToken", res.data.resetToken);
//       navigate("/reset-password");
//     } catch (e: unknown) {
//       toast({
//         variant: "destructive",
//         title: "OTP verify nahi hua",
//         description: getApiErrorMessage(e) || "Code check karo aur dobara try karo.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // ── Resend OTP ───────────────────────────────────────────────
//   const handleResend = useCallback(async () => {
//     setIsResending(true);
//     try {
//       await authService.resendOtp();

//       // Timer reset karo
//       setTimeLeft(OTP_TIMER_SECONDS);
//       setTimerActive(true);
//       setOtp(""); // field clear karo

//       toast({
//         title: "OTP dobara bhej diya!",
//         description: "Email check karo — naya code aa gaya hoga.",
//       });
//     } catch (e: unknown) {
//       toast({
//         variant: "destructive",
//         title: "Resend nahi hua",
//         description: getApiErrorMessage(e) || "Dobara koshish karo.",
//       });
//     } finally {
//       setIsResending(false);
//     }
//   }, [toast]);

//   return (
//     <AuthShell
//       title="Verify OTP"
//       subtitle="Tumhare email pe 6 digit code bheja hai. Neeche enter karo."
//     >
//       <p className="text-sm text-muted-foreground">
//         Inbox check karo aur OTP enter karo.
//       </p>

//       <form onSubmit={handleSubmit} className="space-y-4">

//         {/* Sirf OTP field */}
//         <div className="space-y-2">
//           <label htmlFor="otp" className="text-sm font-medium text-nc-dark">
//             OTP Code
//           </label>
//           <Input
//             id="otp"
//             type="text"
//             inputMode="numeric"
//             placeholder="• • • • • •"
//             maxLength={6}
//             required
//             value={otp}
//             onChange={(e) => {
//               // Sirf numbers allow karo
//               const val = e.target.value.replace(/\D/g, '');
//               setOtp(val);
//             }}
//             disabled={isSubmitting}
//             className="text-center text-xl tracking-widest"
//           />
//         </div>

//         {/* Timer */}
//         <div className="text-center">
//           {timerActive ? (
//             <p className="text-sm text-muted-foreground">
//               Code expire hoga:{" "}
//               <span className={`font-semibold ${timeLeft <= 30 ? "text-red-500" : "text-teal"}`}>
//                 {formatTime(timeLeft)}
//               </span>
//             </p>
//           ) : (
//             <p className="text-sm text-red-500 font-medium">
//               Code expire ho gaya — resend karo
//             </p>
//           )}
//         </div>

//         {/* Submit Button */}
//         <Button
//           type="submit"
//           className="h-11 w-full bg-teal text-white hover:bg-teal-dk"
//           disabled={isSubmitting || otp.length !== 6}
//         >
//           {isSubmitting ? "Verify ho raha hai..." : "Verify OTP"}
//         </Button>

//         {/* Resend Button — timer khatam hone pe active hoga */}
//         <Button
//           type="button"
//           variant="outline"
//           className="h-11 w-full"
//           onClick={handleResend}
//           disabled={timerActive || isResending}
//         >
//           {isResending
//             ? "Bhej raha hai..."
//             : timerActive
//             ? `Resend OTP (${formatTime(timeLeft)})`
//             : "Resend OTP"}
//         </Button>

//       </form>

//       <p className="text-center text-sm text-muted-foreground">
//         Email yaad aa gaya?{" "}
//         <Link to="/forgot-password" className="font-semibold text-teal hover:text-teal-dk">
//           Back
//         </Link>
//       </p>
//     </AuthShell>
//   );
// };

// export default VerifyOtpPage;



import { FormEvent, useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { authService, getErrorMessage } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';

const OTP_SECONDS = 120;

const VerifyOtpPage = () => {
  const navigate      = useNavigate();
  const { toast }     = useToast();

  const [otp,         setOtp]         = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [resending,   setResending]   = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(OTP_SECONDS);
  const [timerActive, setTimerActive] = useState(true);

  const email = localStorage.getItem('resetEmail') || '';

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) { setTimerActive(false); return; }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, timerActive]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await authService.verifyOtp({ email, otp });
      localStorage.setItem('resetToken', data.resetToken);
      navigate('/reset-password');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Verification failed', description: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = useCallback(async () => {
    setResending(true);
    try {
      await authService.resendOtp(email, 'reset');
      setOtp('');
      setTimeLeft(OTP_SECONDS);
      setTimerActive(true);
      toast({ title: 'OTP Resent', description: 'A new code has been sent to your email.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Resend failed', description: getErrorMessage(err) });
    } finally {
      setResending(false);
    }
  }, [email, toast]);

  return (
    <AuthShell title="Verify OTP" subtitle="Enter the 6-digit code sent to your email to reset your password.">
      <p className="text-sm text-muted-foreground">
        Code sent to <strong>{email || 'your email'}</strong>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="text-center text-sm">
          {timerActive
            ? <span className="text-muted-foreground">Expires in <span className={`font-semibold ${timeLeft <= 30 ? 'text-red-500' : 'text-teal'}`}>{formatTime(timeLeft)}</span></span>
            : <span className="text-red-500 font-medium">OTP expired — please resend</span>}
        </div>

        <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal-dk"
          disabled={submitting || otp.length !== 6}>
          {submitting ? 'Verifying...' : 'Verify OTP'}
        </Button>

        <Button type="button" variant="outline" className="h-11 w-full"
          onClick={handleResend} disabled={timerActive || resending}>
          {resending ? 'Sending...' : timerActive ? `Resend OTP (${formatTime(timeLeft)})` : 'Resend OTP'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/forgot-password" className="font-semibold text-teal hover:text-teal-dk">← Back</Link>
      </p>
    </AuthShell>
  );
};

export default VerifyOtpPage;
