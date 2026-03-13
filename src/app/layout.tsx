import type { Metadata } from "next";
import { Inter, Kanit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthDebug from "@/components/AuthDebug";

const inter = Inter({ subsets: ["latin"] });
const kanit = Kanit({ subsets: ["latin"], weight: ["400"] });

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
        <Footer />
      </body>
    </html>
  );
}

