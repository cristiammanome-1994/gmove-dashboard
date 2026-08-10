import { Logo } from "./Logo";
import { Heart } from "lucide-react";

export const Footer = () => (
  <footer className="bg-primary-deep text-white mt-12">
    <div className="container py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <Logo size="md" inverted showTagline />
        <p className="mt-4 text-sm text-white/70 max-w-sm leading-relaxed">
          O programa de desafio fitness corporativo da Gmaster que transforma rotinas e fortalece o time
          através do movimento.
        </p>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-widest font-bold text-white/60 mb-3">Programa</h4>
        <ul className="space-y-2 text-sm text-white/85">
          <li><a href="#como-funciona" className="hover:text-status-met transition-smooth">Como funciona</a></li>
          <li><a href="#dashboard" className="hover:text-status-met transition-smooth">Dashboard</a></li>
          <li><a href="#metricas" className="hover:text-status-met transition-smooth">Métricas</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-widest font-bold text-white/60 mb-3">Apoio</h4>
        <ul className="space-y-2 text-sm text-white/85">
          <li>App: GymRats</li>
          <li>Categoria: Bem-estar corporativo</li>
          <li>Edição: Abril / 2026</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
        <p>© 2026 Gmaster · Todos os direitos reservados.</p>
        <div className="flex items-center gap-4">
          <p className="inline-flex items-center gap-1.5">
            Feito com <Heart className="h-3 w-3 fill-status-met text-status-met" /> para quem se movimenta.
          </p>
        </div>
      </div>
    </div>
  </footer>
);
