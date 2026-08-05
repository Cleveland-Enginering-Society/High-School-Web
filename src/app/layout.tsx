// Written by Evan Dan

import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthDebug from "@/components/AuthDebug";

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
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-kanit">
        <AuthDebug />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

