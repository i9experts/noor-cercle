import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/verify-otp?flow=reset", { replace: true }); }, [navigate]);
  return null;
}