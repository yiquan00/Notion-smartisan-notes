// app/layout.js
import './globals.css';
import Head from 'next/head';

export const metadata = {
  title: 'My Notes App',
  description: 'A Notion-integrated notes app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* 其他meta标签 */}
      </Head>
      <body>
        {children}
      </body>
    </html>
  );
}