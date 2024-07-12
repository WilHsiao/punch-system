// src/context/event-context

'use client';

import { createContext, useEffect, useContext } from 'react';
import { useAuth } from './auth-context';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const { user, logout } = useAuth();
  let timeout;

  useEffect(() => {
    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (user) {
          logout();
          alert('因閒置時間過長，已自動登出。');
        }
      }, 15 * 60 * 1000);
    };

    const events = ['load', 'mousemove', 'mousedown', 'click', 'scroll', 'keypress'];

    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer(); // 初始化計時器

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeout) clearTimeout(timeout);
    };
  }, [user, logout]);

  return (
    <EventContext.Provider value={{}}>
      {children}
    </EventContext.Provider>
  );
};
