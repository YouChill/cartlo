import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cartlo',
  description: 'Cartlo — rodzinna lista zakupow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${nunito.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
