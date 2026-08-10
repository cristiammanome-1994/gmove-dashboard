import { useRef } from "react";
import { Hero } from "@/components/gmove/Hero";
import { HowItWorks } from "@/components/gmove/HowItWorks";
import { DataGate } from "@/components/gmove/DataGate";
import { Footer } from "@/components/gmove/Footer";

const Index = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">GMove — Movimento que transforma · Desafio fitness corporativo Gmaster</h1>
      <Hero onCtaClick={() => scrollTo(dashboardRef)} onHowClick={() => scrollTo(howRef)} />
      <div ref={howRef}>
        <HowItWorks />
      </div>
      <div ref={dashboardRef}>
        <DataGate />
      </div>
      <Footer />
    </main>
  );
};

export default Index;
