import { FormEvent, useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell     from '@/components/auth/AuthShell';
import { Button }    from '@/components/ui/button';
import { Input }     from '@/components/ui/input';
import PasswordInput from '@/components/shared/PasswordInput';
import { PasswordRules, isPasswordValid } from '@/components/shared/PasswordRules';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';

function getApiError(error: unknown): string | null {
  const msg = (error as any)?.response?.data?.message;
  return typeof msg === 'string' && msg.length > 0 ? msg : null;
}

const OTP_SECONDS = 120;

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const flow = (searchParams.get('flow') as 'signup' | 'reset') || 'reset';
  const emailFromStorage =
    flow === 'signup'
      ? localStorage.getItem('pendingEmail') || ''
      : localStorage.getItem('resetEmail')   || '';

  const [otp,             setOtp]             = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwTouched,       setPwTouched]       = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [isResending,     setIsResending]     = useState(false);
  const [timeLeft,        setTimeLeft]        = useState(OTP_SECONDS);
  const [timerActive,     setTimerActive]     = useState(true);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) { setTimerActive(false); return; }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, timerActive]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (flow === 'reset') {
      setPwTouched(true);
      if (!isPasswordValid(newPassword)) {
        toast({ variant: 'destructive', title: 'Password too weak', description: 'Please meet all password requirements.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Passwords do not match' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (flow === 'signup') {
        const res = await authService.signupVerifyOtp({ email: emailFromStorage, otp });
        const responseData = res.data?.data || res.data;
        const { accessToken, refreshToken, user } = responseData;
        localStorage.removeItem('pendingEmail');

        // New sign-ups wait for an admin to approve them — no session yet.
        if (!accessToken) {
          toast({
            title      : 'Email verified! 🌙',
            description: 'Your account is awaiting admin approval. You can sign in once it is approved.',
          });
          navigate('/signin');
          return;
        }

        localStorage.setItem('accessToken',  accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user',         JSON.stringify(user));

        toast({ title: 'Email verified! Welcome to Noor Circle 🌙' });
        navigate(user?.role === 'admin' ? '/' : '/murabbi');

      } else {
        // Step 1: Verify OTP → get resetToken
        const verifyRes = await authService.verifyResetOtp({ email: emailFromStorage, otp });
        const verifyData = verifyRes.data?.data || verifyRes.data;
        const { resetToken } = verifyData;

        // Step 2: Use resetToken to reset password
        await authService.resetPassword(resetToken, newPassword);

        localStorage.removeItem('resetEmail');
        toast({
          title      : 'Password updated!',
          description: 'Please sign in with your new password.',
        });
        navigate('/signin');
      }
    } catch (e: unknown) {
      toast({
        variant    : 'destructive',
        title      : flow === 'signup' ? 'Verification failed' : 'Reset failed',
        description: getApiError(e) || 'Please check the code and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = useCallback(async () => {
    setIsResending(true);
    try {
      await authService.resendOtp(emailFromStorage, flow);
      setTimeLeft(OTP_SECONDS);
      setTimerActive(true);
      setOtp('');
      toast({ title: 'New OTP sent!', description: 'Check your email — expires in 2 minutes.' });
    } catch (e: unknown) {
      toast({ variant: 'destructive', title: 'Resend failed', description: getApiError(e) || 'Try again.' });
    } finally {
      setIsResending(false);
    }
  }, [emailFromStorage, flow, toast]);

  const isSignup = flow === 'signup';

  return (
    <AuthShell
      title={isSignup ? 'Verify Your Email' : 'Reset Password'}
      subtitle={
        isSignup
          ? 'Enter the 6-digit code we sent to your email to activate your account.'
          : 'Enter the 6-digit code from your email along with your new password.'
      }
    >
      <p className="text-sm text-muted-foreground">
        Code sent to: <strong>{emailFromStorage || 'your email'}</strong>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="otp" className="text-sm font-medium text-nc-dark">6-Digit Code</label>
          <Input
            id="otp" type="text" inputMode="numeric" placeholder="• • • • • •"
            maxLength={6} required value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            disabled={isSubmitting}
            className="text-center text-xl tracking-widest"
          />
        </div>

        {!isSignup && (
          <>
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-nc-dark">New Password</label>
              <PasswordInput id="newPassword" placeholder="Min 8 chars, 1 uppercase, 1 number" required
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPwTouched(true); }}
                disabled={isSubmitting} />
              {pwTouched && <PasswordRules password={newPassword} />}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-nc-dark">Confirm Password</label>
              <PasswordInput id="confirmPassword" placeholder="Repeat new password" required
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isSubmitting} />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[12px] font-medium text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
          </>
        )}

        <div className="text-center">
          {timerActive ? (
            <p className="text-sm text-muted-foreground">
              Code expires in:{' '}
              <span className={`font-semibold ${timeLeft <= 30 ? 'text-red-500' : 'text-teal'}`}>
                {fmt(timeLeft)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-red-500 font-medium">Code expired — please resend</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full bg-teal text-white hover:bg-teal-dk"
          disabled={isSubmitting || otp.length !== 6}
        >
          {isSubmitting
            ? 'Verifying...'
            : isSignup
            ? 'Verify & Activate'
            : 'Verify & Reset Password'}
        </Button>

        <Button
          type="button" variant="outline" className="h-11 w-full"
          onClick={handleResend}
          disabled={timerActive || isResending}
        >
          {isResending ? 'Sending...' : timerActive ? `Resend OTP (${fmt(timeLeft)})` : 'Resend OTP'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          to={isSignup ? '/sign-up' : '/forgot-password'}
          className="font-semibold text-teal hover:text-teal-dk"
        >
          ← Back
        </Link>
      </p>
    </AuthShell>
  );
};

export default VerifyOtpPage;
