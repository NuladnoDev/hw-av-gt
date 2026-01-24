import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/*
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
*/

export const metadata: Metadata = {
  title: "hw-project",
  description: "Выкладывай, покупай, продавай.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "hw-project",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function preventZoom(e) {
                  if (e.scale && e.scale !== 1) {
                    e.preventDefault();
                  }
                }
                document.addEventListener('gesturestart', preventZoom, { passive: false });
                document.addEventListener('gesturechange', preventZoom, { passive: false });
                document.addEventListener('gestureend', preventZoom, { passive: false });
                document.addEventListener('wheel', function(e) {
                  if (e.ctrlKey) {
                    e.preventDefault();
                  }
                }, { passive: false });
              })();
            `,
          }}
        />
      </head>
      <body
        className="antialiased overflow-hidden text-white"
        style={{
          backgroundColor: '#0A0A0A',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
        {children}
      </body>
    </html>
  );
}
