import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RCMS | Remote Career Management System",
  description: "A focused remote career operating workspace powered by the local RCMS engine.",
  icons: {
    icon: [
      { url: "/rcms-favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/rcms-favicon.png" }],
    shortcut: "/rcms-favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="ce-shell">
          <Sidebar />
          <div className="ce-workspace">
            <Header />
            <main className="ce-main">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
