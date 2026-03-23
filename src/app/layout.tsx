import type { Metadata } from "next";
import "./globals.css";
import { SimulationProvider } from "@/store/simulation-store";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "RentAimmo — Simulateur d'investissement immobilier",
  description: "Analyse de rentabilité pour immeubles de rapport en France. Location longue durée et courte durée.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased bg-background text-foreground">
        <SimulationProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </SimulationProvider>
      </body>
    </html>
  );
}
