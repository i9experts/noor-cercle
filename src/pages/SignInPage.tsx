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

// const SignInPage = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setIsSubmitting(true);

//     try {
//       const res = await authService.signin({ email, password });

//       // 🔥 DEBUG (optional but useful)
//       console.log("LOGIN RESPONSE:", res.data);

//       // ✅ TOKEN SAVE
//       localStorage.setItem("accessToken", res.data.accessToken);
//       localStorage.setItem("refreshToken", res.data.refreshToken);

//       // ✅ Success toast
//       toast({
//         title: "Welcome back!",
//         description: res.data.message || "Signed in successfully",
//       });

//       // ✅ Redirect
//       navigate("/");
//     } catch (e: unknown) {
//       toast({
//         variant: "destructive",
//         title: "Sign in failed",
//         description:
//           getApiErrorMessage(e) ||
//           "Please check your credentials and try again.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <AuthShell
//       title="Sign In"
//       subtitle="Welcome back. Sign in to manage students, murabbis, circles and reports for Noor Circle."
//     >
//       <p className="text-sm text-muted-foreground">
//         Continue to your Noor Circle dashboard.
//       </p>

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

//         <div className="space-y-2">
//           <label htmlFor="password" className="text-sm font-medium text-nc-dark">
//             Password
//           </label>
//           <Input
//             id="password"
//             type="password"
//             placeholder="Enter password"
//             required
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             disabled={isSubmitting}
//           />
//         </div>

//         <div className="text-right">
//           <Link
//             to="/forgot-password"
//             className="text-sm font-medium text-teal hover:text-teal-dk"
//           >
//             Forgot password?
//           </Link>
//         </div>

//         <Button
//           type="submit"
//           className="h-11 w-full bg-teal text-white hover:bg-teal-dk"
//           disabled={isSubmitting}
//         >
//           {isSubmitting ? "Signing In..." : "Sign In"}
//         </Button>
//       </form>

//       <p className="text-center text-sm text-muted-foreground">
//         New here?{" "}
//         <Link to="/sign-up" className="font-semibold text-teal hover:text-teal-dk">
//           Create account
//         </Link>
//       </p>
//     </AuthShell>
//   );
// };

// export default SignInPage;


import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import AuthShell  from '@/components/auth/AuthShell';
import { authService, getErrorMessage } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SignInPage = () => {
  const navigate       = useNavigate();
  const { toast }      = useToast();
  const { saveTokens } = useAuth();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await authService.signin({ email, password });

      // Save tokens + user
      saveTokens(data.accessToken, data.refreshToken, data.user);

      toast({ title: `Welcome back, ${data.user.fullName}!`, description: 'Signed in successfully.' });

      // ✅ Role-based redirect
      if (data.user.role === 'admin') {
        navigate('/');        // Admin panel
      } else {
        navigate('/murabbi'); // Murabbi portal
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sign in failed', description: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Sign In" subtitle="Welcome back. Sign in to manage students, murabbis, circles and reports for Noor Circle.">
      <p className="text-sm text-muted-foreground">Continue to your Noor Circle dashboard.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-nc-dark">Email</label>
          <Input type="email" placeholder="you@example.com" required
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-nc-dark">Password</label>
          <Input type="password" placeholder="Enter password" required
            value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} />
        </div>

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-teal hover:text-teal-dk">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal-dk" disabled={submitting}>
          {submitting ? 'Signing In...' : 'Sign In'}
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
