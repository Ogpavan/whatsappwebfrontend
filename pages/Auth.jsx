import React, { useState, useEffect } from "react";
import { PiEyeBold, PiEyeClosed } from "react-icons/pi";
import { auth, googleProvider } from "../src/firebase";
import {
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loadingBtn, setLoadingBtn] = useState(false); // <-- loading for button
  const [showPassword, setShowPassword] = useState(false); // <-- toggle for password
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.emailVerified) {
        navigate("/");
      } else {
        auth.signOut();
      }
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const validate = () => {
    if (!email.trim()) return "Email is required.";
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email))
      return "Enter a valid email.";
    if (!password) return "Password is required.";
    if (isSignUp) {
      if (!name.trim()) return "Name is required for signup.";
      if (password.length < 6) return "Password must be at least 6 characters.";
    }
    return "";
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErr("");
    setLoadingBtn(true); // <-- start loading
    const validationError = validate();
    if (validationError) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: validationError,
      });
      setLoadingBtn(false); // <-- stop loading
      return;
    }

    try {
      if (isSignUp) {
        const signInMethods = await fetchSignInMethodsForEmail(
          auth,
          email.trim()
        );
        if (signInMethods.length > 0) {
          Swal.fire({
            icon: "warning",
            title: "Email Already Exists",
            text: "This email is already registered. Please use a different email or sign in.",
          });
          setLoadingBtn(false); // <-- stop loading
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await updateProfile(userCredential.user, {
          displayName: name.trim(),
        });
        await sendEmailVerification(userCredential.user);
        await auth.signOut();

        await Swal.fire({
          icon: "success",
          title: "Account Created Successfully!",
          html: `
            <p>A verification email has been sent to <strong>${email}</strong></p>
            <p class="mt-2">Please verify your email before signing in.</p>
          `,
          confirmButtonColor: "#1a4947",
          confirmButtonText: "Go to Sign In",
          allowOutsideClick: false,
        }).then(() => {
          setEmail("");
          setPassword("");
          setName("");
          setIsSignUp(false);
        });
        setLoadingBtn(false); // <-- stop loading
        return;
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        if (!userCredential.user.emailVerified) {
          await sendEmailVerification(userCredential.user);
          await auth.signOut();
          Swal.fire({
            icon: "warning",
            title: "Email Not Verified",
            text: "Please check your email to verify your account. We've sent a new verification link.",
            confirmButtonColor: "#1a4947",
            confirmButtonText: "OK",
          });
          setLoadingBtn(false); // <-- stop loading
          return;
        }
        Swal.fire({
          icon: "success",
          title: "Welcome Back!",
          text: "You have successfully logged in.",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/");
      }
    } catch (error) {
      let errorMessage;
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage =
            "This email is already registered. Please sign in instead.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/operation-not-allowed":
          errorMessage =
            "Email/password accounts are not enabled. Please contact support.";
          break;
        case "auth/weak-password":
          errorMessage = "Please choose a stronger password.";
          break;
        default:
          errorMessage = "An error occurred. Please try again.";
      }
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: errorMessage,
      });
    }
    setLoadingBtn(false); // <-- stop loading
  };

  const handleGoogle = async () => {
    setLoadingBtn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: error.message
          .replace(/^Firebase: /, "")
          .replace(/\(auth\/.*\)\.?/, ""),
      });
    }
    setLoadingBtn(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErr("Please enter your email to reset password.");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setErr("");
      Swal.fire({
        icon: "success",
        title: "Reset Email Sent",
        text: "Check your inbox for a password reset link.",
      });
    } catch (error) {
      setErr("Failed to send reset email. Please check your email address.");
    }
    setResetLoading(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setName("");
    setErr("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <img
        src="/background.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-10"
      />
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl min-h-[600px] relative">
        {/* Sliding Green Panel */}
        <div
          className={`absolute top-0 w-1/2 h-full flex flex-col justify-center items-center text-center text-white overflow-hidden transition-all duration-700 ease-in-out z-10 ${
            isSignUp ? "left-1/2" : "left-0"
          }`}
          style={{
            background: "linear-gradient(135deg, #1a4947 0%, #1a4947 100%)",
          }}
        >
          {/* Floating Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-32 right-16 w-12 h-12 bg-white rounded-full animate-bounce"></div>
            <div className="absolute bottom-20 left-20 w-16 h-16 bg-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-32 right-10 w-8 h-8 bg-white rounded-full animate-ping"></div>
          </div>
          <div className="relative z-10 p-12">
            <h2 className="text-4xl font-bold mb-6">
              {isSignUp ? "Welcome Back!" : "Hello, Friend!"}
            </h2>
            <p className="text-lg mb-8 opacity-90 leading-relaxed">
              {isSignUp
                ? "To keep connected with us please login with your personal info"
                : "Enter your personal details and start journey with us"}
            </p>
            <button
              onClick={toggleMode}
              className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold tracking-wide hover:bg-white hover:text-[#1a4947] transition-all duration-300 transform hover:scale-105"
            >
              {isSignUp ? "SIGN IN" : "SIGN UP"}
            </button>
          </div>
        </div>

        {/* Login/Signup Form Panel */}
        <div
          className={`absolute top-0 w-1/2 h-full flex flex-col justify-center transition-all duration-700 ease-in-out ${
            isSignUp ? "left-0" : "left-1/2"
          }`}
        >
          <form
            className="max-w-sm mx-auto w-full px-12"
            onSubmit={handleEmailAuth}
          >
            <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              {isSignUp ? "Sign up for MSGen" : "Sign in to MSGen"}
            </h3>
            {/* Social Login Buttons */}
            <div className="flex justify-center space-x-4 mb-8">
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-full py-2 px-4 font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                disabled={loadingBtn}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
                {loadingBtn && (
                  <svg
                    className="animate-spin ml-2 h-4 w-4 text-gray-500"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-center text-gray-500 mb-6 ">
              {isSignUp
                ? "or use your email for registration"
                : "or use your email account"}
            </div>
            {/* Error Message */}
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                {err}
              </div>
            )}
            {/* Signup Name Field */}
            {isSignUp && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4947] transition-all"
                  required
                />
              </div>
            )}
            {/* Email Field */}
            <div className="relative mt-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4947] transition-all"
                required
              />
            </div>
            {/* Password Field with toggle */}
            <div className="relative mt-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4947] transition-all pr-12"
                required
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <PiEyeClosed /> : <PiEyeBold />}
              </button>
            </div>
            {/* Forgot Password */}
            {!isSignUp && (
              <div className="text-center mt-2">
                <button
                  type="button"
                  className="text-gray-500 text-sm hover:text-[#1a4947] transition-colors"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Forgot your password?"}
                </button>
              </div>
            )}
            {/* Submit Button with loading */}
            <button
              type="submit"
              className="w-full bg-[#1a4947] text-white py-3 rounded-full font-semibold tracking-wide hover:bg-[#163d3c] transition-all duration-300 transform hover:scale-105 shadow-lg mt-6 flex items-center justify-center"
              disabled={loadingBtn}
            >
              {loadingBtn ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  {isSignUp ? "Signing Up..." : "Signing In..."}
                </>
              ) : isSignUp ? (
                "SIGN UP"
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>
        </div>

        {/* WhatsApp-style background shapes */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Animated WhatsApp-style chat bubble */}
          <svg
            className="absolute left-10 top-10 animate-bounce-slow"
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
          >
            <ellipse
              cx="40"
              cy="40"
              rx="36"
              ry="30"
              fill="#1a4947"
              opacity="0.12"
            />
            <ellipse
              cx="60"
              cy="60"
              rx="10"
              ry="8"
              fill="#1a4947"
              opacity="0.18"
            />
          </svg>
          {/* Animated double tick */}
          <svg
            className="absolute right-16 top-32 animate-pulse"
            width="48"
            height="24"
            viewBox="0 0 48 24"
            fill="none"
          >
            <path
              d="M2 12l8 8 12-16"
              stroke="#1a4947"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
            />
            <path
              d="M18 16l8 8 18-22"
              stroke="#1a4947"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
          </svg>
          {/* Animated circle */}
          <div className="absolute bottom-20 left-24 w-16 h-16 bg-[#1a4947] rounded-full opacity-10 animate-pulse"></div>
          {/* Small chat bubble */}
          <svg
            className="absolute bottom-10 right-10 animate-bounce"
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
          >
            <ellipse
              cx="20"
              cy="20"
              rx="16"
              ry="12"
              fill="#1a4947"
              opacity="0.15"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
