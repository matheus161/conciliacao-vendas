import { Public_Sans, Roboto_Slab } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${publicSans.variable} ${robotoSlab.variable}`}>
      <body>{children}</body>
    </html>
  );
}
