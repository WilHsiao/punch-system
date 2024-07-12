import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from '@/components/navigation';
import { AuthProvider } from '@/context/auth-context';
import { EventProvider } from '@/context/event-context';


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "打卡系統 v.2",
  description: "簡易打卡系統",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <EventProvider>
            <Navigation />
            {children}
          </EventProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
