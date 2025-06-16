import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      // Update the current user with the display name
      setCurrentUser({
        ...userCredential.user,
        displayName: displayName
      });
      
      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    console.log('🔑 [AuthContext] Login attempt with email:', email);
    try {
      console.log('⏳ [AuthContext] Calling Firebase signInWithEmailAndPassword...');
      const startTime = Date.now();
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log(`✅ [AuthContext] Login successful in ${Date.now() - startTime}ms`);
      console.log('👤 [AuthContext] User data:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        emailVerified: userCredential.user.emailVerified
      });
      
      return userCredential;
    } catch (error) {
      console.error('❌ [AuthContext] Login error:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      throw error;
    }
  };

  // Sign out
  const logout = () => {
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update user profile
  const updateUserProfile = async (profile) => {
    try {
      await updateProfile(auth.currentUser, profile);
      setCurrentUser(prev => ({
        ...prev,
        ...profile
      }));
    } catch (error) {
      throw error;
    }
  };

  // Set up auth state listener
  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AuthContext] Auth state changed:', user ? 'User signed in' : 'No user');
      if (user) {
        // User is signed in
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        console.log('[AuthContext] Setting current user:', userData);
        setCurrentUser(userData);
      } else {
        // User is signed out
        console.log('[AuthContext] User signed out, setting currentUser to null');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading, // Expose loading state
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
