import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthDebug from "@/components/AuthDebug";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CES High School Chapter",
  description: "Official website of the Cleveland Engineering Society High School Chapter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthDebug />
        <Navbar />
        {children}
      </body>
    </html>
  );
}

