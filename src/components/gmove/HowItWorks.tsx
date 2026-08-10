import { Smartphone, TrendingUp, Trophy, Gift } from "lucide-react";

const steps = [
  { icon: Smartphone, title: "Registre seus treinos", desc: "Faça check-in pelo app GymRats sempre que treinar — corrida, academia, ciclismo, qualquer modalidade conta." },
  { icon: TrendingUp, title: "Acumule pontos e dias ativos", desc: "Cada treino soma pontos e adiciona um dia ativo no seu mês. Quanto mais consistência, mais pontuação." },
  { icon: Trophy, title: "Suba no ranking", desc: "Acompanhe sua posição em tempo real no dashboard e dispute o topo com seus colegas todos os meses." },
  { icon: Gift, title: "Conquiste a meta mensal", desc: "Atingiu 15 dias ativos? Você bate a meta GMove e ganha reconhecimento + bônus exclusivos." },
];

export const HowItWorks = () => (
  <section id="como-funciona" className="container py-20 md:py-28">
    <div className="text-center max-w-2xl mx-auto mb-14">
      <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">Como funciona</span>
      <h2 className="text-4xl md:text-5xl font-black text-primary-deep text-balance">
        Quatro passos para entrar no <span className="text-primary">movimento</span>.
      </h2>
      <p className="mt-4 text-muted-foreground text-lg">
        Simples, transparente e gamificado — feito para incentivar a saúde do time todos os dias.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {steps.map((s, i) => (
        <div
          key={i}
          className="relative rounded-2xl border border-border bg-gradient-card p-6 shadow-card hover-lift opacity-0 animate-fade-in-up"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <div className="absolute top-4 right-4 text-7xl font-black text-primary/5 leading-none select-none">
            {i + 1}
          </div>
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-elegant mb-4">
              <s.icon className="h-6 w-6" strokeWidth={2.4} />
            </div>
            <h3 className="text-lg font-bold text-primary-deep mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
