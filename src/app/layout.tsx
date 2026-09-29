import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kovai Customizes — Production Orders",
  description: "Production order management for Kovai Customizes / Kovai Frames.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F7C948",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#221F17",
              color: "#FFFBEF",
              fontSize: "14px",
              borderRadius: "10px",
            },
          }}
        />
      </body>
    </html>
  );
}
