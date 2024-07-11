'use client';
import { useEffect, useRef } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function withInactivityHandler(WrappedComponent) {
  return function WithInactivityHandler(props) {
    const inactivityTimeoutRef = useRef(null);

    const logoutDueToInactivity = async () => {
      toast.info('由於長時間未操作，已自動登出。');
      await signOut(auth);
    };

    const resetInactivityTimeout = () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      inactivityTimeoutRef.current = setTimeout(logoutDueToInactivity, 1 * 60 * 1000);
    };

    const handleUserActivity = () => {
      resetInactivityTimeout();
    };

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          resetInactivityTimeout();
          window.addEventListener('keydown', handleUserActivity);
          window.addEventListener('click', handleUserActivity);
        } else {
          clearTimeout(inactivityTimeoutRef.current);
          window.removeEventListener('keydown', handleUserActivity);
          window.removeEventListener('click', handleUserActivity);
        }
      });

      return () => {
        unsubscribe();
        clearTimeout(inactivityTimeoutRef.current);
        window.removeEventListener('keydown', handleUserActivity);
        window.removeEventListener('click', handleUserActivity);
      };
    }, []);

    return (
      <>
        <WrappedComponent {...props} />
        <ToastContainer />
      </>
    );
  };
}
