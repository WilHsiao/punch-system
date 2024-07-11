// src/config/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDIWnNGitvnJSmiLkAkIF5lBgISZxwCK-M",
  authDomain: "time-clock-system-da745.firebaseapp.com",
  databaseURL: "https://time-clock-system-da745-default-rtdb.firebaseio.com",
  projectId: "time-clock-system-da745",
  storageBucket: "time-clock-system-da745.appspot.com",
  messagingSenderId: "92296278614",
  appId: "1:92296278614:web:84cdc7664cf3e6ece081f7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, database, auth };
