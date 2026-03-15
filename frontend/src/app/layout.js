import "./globals.css";
import { Roboto } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Qué Hacer en Santiago — Planes y actividades",
    template: "%s | Qué Hacer en Santiago",
  },
  description: "Descubre los mejores planes y actividades en Santiago de Chile. Encuentra panoramas outdoor, culturales, gastronómicos y más para disfrutar en la ciudad.",
  keywords: ["Santiago", "Chile", "planes", "actividades", "panoramas", "qué hacer", "outdoor", "cultura", "gastronomía"],
  openGraph: {
    title: "Qué Hacer en Santiago",
    description: "Descubre los mejores planes y actividades en Santiago de Chile.",
    type: "website",
    locale: "es_CL",
    siteName: "Qué Hacer en Santiago",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={roboto.variable}>
      <body className="min-h-screen flex flex-col bg-dark text-light font-body">
        <ClerkProvider localization={esES}>
          <Providers>
            <Header />
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
              {children}
            </main>
            <Footer />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
