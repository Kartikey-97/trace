import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Trace — Three Models. One Answer. Zero Leaks.",
  description:
    "Paste your error logs. Three independent AI models analyze in parallel on Chutes private inference. Get a consensus root cause and exact fix — without exposing sensitive data.",
  keywords: ["debugging", "AI", "error analysis", "Chutes", "TEE", "private inference", "developer tools"],
  authors: [{ name: "Trace" }],
  openGraph: {
    title: "Trace — Private Multi-Model Debugger",
    description:
      "Three Chutes models analyze your errors in parallel. Private by design.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
