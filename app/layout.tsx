import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClubOpsProvider } from "@/components/providers/ClubOpsContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

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
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <TopBar />
              <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </ClubOpsProvider>
      </body>
    </html>
  );
}
