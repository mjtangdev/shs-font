import type { Metadata } from "next";
import "@/app/globals.css"; // 使用绝对路径
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SSEProvider } from "@/components/SSEProvider";

const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  title: "SHS Management System",
  description: "Solar Home System Control Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> 
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SSEProvider>
            {children}
          </SSEProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
