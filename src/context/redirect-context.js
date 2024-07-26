// @/context/redirect-context.js

'use client';

import { createContext, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';

const IdleRedirectContext = createContext();

export const useIdleRedirect = () => useContext(IdleRedirectContext);

export const IdleRedirectProvider = ({ children, idleTime = 1 * 60 * 1000, redirectPath = '/idle' }) => {
  const router = useRouter();
  let timeoutRef = useRef();

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      router.push(redirectPath);
    }, idleTime);
  };

  useEffect(() => {
    const events = ['load', 'mousemove', 'mousedown', 'click', 'scroll', 'keypress'];

    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer(); // 初始化計時器

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [idleTime, redirectPath]);

  return (
    <IdleRedirectContext.Provider value={{ resetTimer }}>
      {children}
    </IdleRedirectContext.Provider>
  );
};