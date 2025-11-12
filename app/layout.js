import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/app/ClientLayout";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bharath Electronics & Appliances",
  description: "Barath Electronics",
  icons: {
    icon: "/images/logo/bea-favi.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
        {/* ✅ Tracking Script */}
        <Script id="adtarbo-tracking" strategy="afterInteractive">
          {`(function(dd, ss, idd) {
              var js, ajs = dd.getElementsByTagName(ss)[0];
              if (dd.getElementById(idd)) {return;}
              js = dd.createElement(ss);
              js.id = idd;
              js.aun_id = "DxxR7VDj28N7";
              js.src = "https://pixel.adtarbo.com/pixelTrack1.js";
              ajs.parentNode.insertBefore(js, ajs);
          }(document, 'script', 'adtarbo-js-v2'));`}
        </Script>
      </body>
    </html>
  );
}
