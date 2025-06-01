import React, { useState } from "react";
import { auth, googleProvider } from "../src/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate("/");
    return null;
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (error) {
      setErr(error.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleEmailAuth}
        className="bg-white p-8 rounded shadow w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4">
          {isLogin ? "Login" : "Sign Up"}
        </h2>
        {err && <div className="text-red-500 mb-2">{err}</div>}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="w-full bg-green-600 text-white py-2 rounded mb-2"
          type="submit"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>
        <button
          type="button"
          className="w-full bg-blue-600 text-white py-2 rounded mb-2"
          onClick={handleGoogle}
        >
          Continue with Google
        </button>
        <div className="text-sm text-center mt-2">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                className="text-green-600"
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-green-600"
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default AuthPage;
