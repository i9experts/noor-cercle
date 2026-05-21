import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button }    from '@/components/ui/button';
import { Input }     from '@/components/ui/input';
import AuthShell     from '@/components/auth/AuthShell';
import PasswordInput from '@/components/shared/PasswordInput';
import { PasswordRules, isPasswordValid } from '@/components/shared/PasswordRules';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';

function getApiError(error: unknown): string | null {
  const msg = (error as any)?.response?.data?.message;
  return typeof msg === 'string' && msg.length > 0 ? msg : null;
}

const SignUpPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName,      setFullName]      = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [pwTouched,     setPwTouched]     = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwTouched(true);

    if (!isPasswordValid(password)) {
      toast({
        variant    : 'destructive',
        title      : 'Password too weak',
        description: 'Please meet all password requirements before continuing.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.signupRequestOtp({ fullName, email, password });
      localStorage.setItem('pendingEmail', email);
      toast({
        title      : 'OTP Sent!',
        description: 'Check your email for a 6-digit verification code. Expires in 2 minutes.',
      });
      navigate('/verify-otp?flow=signup');
    } catch (e: unknown) {
      toast({
        variant    : 'destructive',
        title      : 'Sign up failed',
        description: getApiError(e) || 'Please try again.',
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
          <label htmlFor="fullName" className="text-sm font-medium text-nc-dark">Full Name</label>
          <Input id="fullName" type="text" placeholder="Your full name" required
            value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isSubmitting} />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-nc-dark">Email</label>
          <Input id="email" type="email" placeholder="you@example.com" required
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-nc-dark">Password</label>
          <PasswordInput
            id="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            required
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPwTouched(true); }}
            disabled={isSubmitting}
          />
          {pwTouched && <PasswordRules password={password} />}
        </div>

        <Button
          type="submit"
          className="h-11 w-full bg-gold text-white hover:bg-gold-dim"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending OTP...' : 'Create Account'}
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