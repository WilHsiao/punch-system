// @/context/event-logout-context

'use client';

import { createContext, useEffect, useRef, useContext } from 'react';
import { useAuth } from '@/context/auth-context';

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

export const EventProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const timeoutRef = useRef();

  useEffect(() => {
    const IDLE_TIMEOUT = 60 * 1000; // 1 minute

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (user) {
          logout();
          alert('因閒置時間過長，已自動登出。');
        }
      }, IDLE_TIMEOUT);
    };

    const events = ['load', 'mousemove', 'mousedown', 'click', 'scroll', 'keypress'];

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // 初始化計時器

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user, logout]);

  return (
    <EventContext.Provider value={{}}>
      {children}
    </EventContext.Provider>
  );
};