import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from '@/components/navigation';
import { AuthProvider } from '@/context/auth-context';
import { EventProvider } from '@/context/event-context';


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "簡易ERP系統",
  description: "簡易ERP系統",
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
      <footer className="w-full flex items-center justify-center py-4 bg-gray-200">
    © 2024 Yu.
  </footer>
    </html>
  );
}
