# GMove Dashboard

Dashboard executivo do desafio fitness corporativo GMove (Gmaster). Rankings, validação de check-ins, modalidades, equipes e imagens.

## Stack

- React 18 + TypeScript + Vite 5
- TailwindCSS + shadcn/ui (Radix)
- TanStack Query, React Hook Form, Zod
- Recharts, React Router v6
- Vitest + Testing Library + ESLint

## Como rodar

```bash
npm install
npm run dev
```

O dashboard consome `public/challenge-data.json`. Sem o arquivo, a tela inicial mostra o upload em `DataGate.tsx`.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | Type-check TypeScript |
| `npm run lint` | ESLint |
| `npm run test` | Testes unitários |
| `npm run test:watch` | Testes em watch |
| `npm run test:coverage` | Testes com cobertura |
| `npm run preview` | Preview do build |

## Estrutura

```
src/
├── components/gmove/   # Dashboard, DataGate, tabs, sidebar
├── components/ui/      # shadcn/ui
├── data/               # Mock legado
├── hooks/              # Custom hooks
├── lib/                # processChallenge, checkin-validator
├── pages/              # Rotas
└── test/               # Setup e testes
```

## Licença

MIT — veja [LICENSE](LICENSE).
