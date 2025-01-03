"use client";

import { useEffect, useState } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/firebase";

const Login = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("❌ Google Sign-In Failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("❌ Sign-Out Failed:", error);
    }
  };

  return (
    <div>
      {user ? (
        <div className="flex items-center gap-4">
          <img src={user.photoURL} alt="User Avatar" className="w-10 h-10 rounded-full" />
          <span className="text-black">{user.displayName}</span>
          <button
            onClick={handleSignOut}
            className=" bg-white-500 text-blue-500 px-4 py-1 rounded border-2 border-blue-400 hover:bg-blue-600 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
};

export default Login;
