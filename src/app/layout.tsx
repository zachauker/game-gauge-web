import type {Metadata} from "next";
import {Inter, Geist} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider";
import {Toaster} from "sonner";
import React from "react";
import {Analytics} from "@vercel/analytics/next";
import {SpeedInsights} from "@vercel/speed-insights/next";
import {cn} from "@/lib/utils";
import localFont from 'next/font/local';

const geist = Geist({subsets: ['latin'], variable: '--font-sans'});

const inter = Inter({subsets: ["latin"]});

const flexing = localFont({
    src: '../../public/fonts/flexing-regular.otf',
    variable: '--font-flexing',
    display: 'swap',
});


export const metadata: Metadata = {
    title: "Game Gauge - Track, Rate, and Review Your Games",
    description: "Discover, track, rate, and review your favorite video games. Create custom lists and connect with other gamers.",
    keywords: ["games", "video games", "reviews", "ratings", "gaming", "game tracker"],
    icons: {
        icon: [
            {url: '/favicon.ico'},
            {url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png'},
            {url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png'},
        ],
        apple: '/apple-touch-icon.png',
    },
    openGraph: {
        images: [{url: '/images/logo/logo-full.png', width: 1200, height: 630}],
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={flexing.variable}>
        <body className={inter.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Toaster richColors position="top-right"/>
        </ThemeProvider>
        <Analytics/>
        <SpeedInsights/>
        </body>
        </html>
    );
}
