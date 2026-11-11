import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Mermas · Yogufrut", template: "%s · Mermas Yogufrut" },
  description: "Registro y control de mermas de las sucursales Yogufrut",
};

export const viewport: Viewport = { themeColor: "#faf8f5" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${geist.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenido"
          className="sr-only rounded-lg bg-white px-4 py-2 font-medium shadow-elevada focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
