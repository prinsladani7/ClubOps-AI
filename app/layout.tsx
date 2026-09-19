import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClubOpsProvider } from "@/components/providers/ClubOpsContext";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ClubOps AI — The AI Operating System for College Club Events",
  description: "Autonomous, structured, and permission-aware operational command center for college club events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#070A11] text-slate-100 antialiased overflow-x-hidden`}>
        <ClubOpsProvider>
          <AppShell>{children}</AppShell>
        </ClubOpsProvider>
      </body>
    </html>
  );
}
