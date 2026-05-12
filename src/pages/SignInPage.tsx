/**
 * FIX: SignInPage.tsx
 *
 * BUGS FIXED:
 * 1. Was destructuring { accessToken, refreshToken, data } from res.data
 *    → backend now returns { success, message, data: { accessToken, refreshToken, user } }
 * 2. Was checking status 403 for "not verified" → backend returns 401
 * 3. Was saving data?.user?.role but it's now at data.user.role directly
 */

import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import AuthShell  from '@/components/auth/AuthShell';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';

function getApiError(error: unknown): string | null {
  const msg = (error as any)?.response?.data?.message;
  return typeof msg === 'string' && msg.length > 0 ? msg : null;
}

const SignInPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authService.signin({ email, password });

      // FIX: Backend wraps response → { success, message, data: { accessToken, refreshToken, user } }
      const responseData = res.data?.data || res.data;
      const { accessToken, refreshToken, user } = responseData;

      localStorage.setItem('accessToken',  accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user',         JSON.stringify(user));

      toast({ title: 'Welcome back!', description: 'Signed in successfully.' });

      navigate(user?.role === 'admin' ? '/' : '/murabbi');
    } catch (e: unknown) {
      const errMsg = getApiError(e);

      // FIX: Backend returns 401 for unverified email (not 403)
      if (errMsg?.toLowerCase().includes('not verified')) {
        localStorage.setItem('pendingEmail', email);
        toast({
          title      : 'Email not verified',
          description: 'Please verify your email first.',
        });
        navigate('/verify-otp?flow=signup');
        return;
      }

      toast({
        variant    : 'destructive',
        title      : 'Sign in failed',
        description: errMsg || 'Invalid email or password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign In"
      subtitle="Welcome back. Sign in to manage students, murabbis, circles and reports for Noor Circle."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-nc-dark">Email</label>
          <Input id="email" type="email" placeholder="you@example.com" required
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-nc-dark">Password</label>
          <Input id="password" type="password" placeholder="Enter password" required
            value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-teal hover:text-teal-dk">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal-dk" disabled={isSubmitting}>
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link to="/sign-up" className="font-semibold text-teal hover:text-teal-dk">Create account</Link>
      </p>
    </AuthShell>
  );
};

export default SignInPage;
