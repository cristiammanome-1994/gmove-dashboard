# GMove Dashboard — Histórico do Projeto

Documento de contexto para retomar o desenvolvimento após fechar o terminal.

---

## 1. Visão geral

- **Nome:** GMove Dashboard (`gmove-dashboard`)
- **Local:** `C:\Users\Cristiam.Ieda\OneDrive - GMASTER GESTAO EMPRESARIAL LTDA\Área de Trabalho\Projetos - 9\Gmove\gmove-dashboard`
- **Stack:** Vite 5 + React 18 + TypeScript + TailwindCSS + shadcn/ui (Radix) + Recharts + Vitest
- **Objetivo:** Dashboard executivo do desafio fitness corporativo GMove (Gmaster). Rankings, validação de check-ins, modalidades, equipes e imagens.
- **Remote:** `https://github.com/cristiammanome-1994/gmove-dashboard.git`
- **Branch:** `master`

## 2. Como rodar

```bash
npm install
npm run dev        # dev server (Vite)
npm run build      # build de produção
npm run preview    # serve dist/
npm run test       # Vitest
npm run lint       # ESLint
```

O dashboard consome `public/challenge-data.json`. Sem o arquivo, a tela inicial mostra o card de upload do `DataGate.tsx`.

## 3. Estrutura de pastas (relevante)

```
src/
  components/
    gmove/
      Dashboard.tsx              # Dashboard legado (mock data de src/data/gmove.ts)
      DataGate.tsx               # Upload do JSON + period selector + renderiza LiveDashboard
      DashboardTabs.tsx          # TabsList horizontal (legado, ainda exportado)
      DashboardSidebar.tsx       # NOVA sidebar vertical agrupada (mobile: hidden)
      LiveDashboard.tsx          # Componente principal usado em runtime
      TableToolbar.tsx           # Busca + chips de filtro + export CSV
      RankBadge.tsx, MetricCard.tsx, SummaryCards.tsx, ...
      TabContent/
        DaysActiveTab.tsx, PointsTab.tsx, PerformanceTab.tsx,
        InactivesTab.tsx, VideosTab.tsx, ModalitiesTab.tsx,
        ScheduleTab.tsx, ModalidadesPorGmoverTab.tsx,
        ValidationTab.tsx, MonthImagesTab.tsx, EvolutionTab.tsx,
        shared.tsx               # Card, EmptyState, DataEmptyState, Counter, RankingTable, useExportCsv
        index.ts                 # exports
    ui/
      ... (shadcn primitives)
      command-palette.tsx        # NOVA: CommandPalette + useCommandPalette hook
  hooks/
    useSearchFilters.ts
  lib/
    gmove-processor.ts           # processChallenge(): JSON → ProcessedDashboard
    checkin-validator.ts         # validateCheckIns(): regras de suspeita
    validation-config.ts         # DEFAULT_CONFIG + persist em localStorage
    admin-storage.ts, teams-storage.ts, url-teams-codec.ts
    utils.ts
  data/
    gmove.ts                     # Mock dataset usado pelo Dashboard.tsx (legado)
  test/
    example.test.ts
```

## 4. Funcionalidades implementadas nesta sessão

### 4.1 Validação de check-ins (`checkin-validator.ts` + `validation-config.ts`)
- **Removido:** critério de calorias mínimas (`minCalories`).
- **Threshold de duração curta:** mudou de **15 min → 30 min** (configurável via `ValidationConfig.minDurationMinutes`).
- **Nova exceção:** check-ins de `running`, `walking` ou `treadmill` com **distância ≥ 2 km** são válidos mesmo com duração < 30 min.
- **Lógica por dia:** a validação agora considera o **total acumulado por participante no dia**, não check-ins isolados. Group key = `${account_id}_${YYYY-MM-DD}`.
- **Coleta de distância:** parse de `distance_miles` (string pt-BR com vírgula → número) tanto no nível do check-in quanto dentro de `check_in_activities[]`. Conversão para km: `* 1.60934`.
- **Detecção de outliers:** mantido apenas `outlier_high` (Q3 + outlierMultiplier × IQR). Removido `outlier_low`.

### 4.2 UI/UX (5 melhorias entregues)
| # | Recurso | Arquivos |
|---|---------|----------|
| 1 | **Banner de alerta de validação** no topo do dashboard (severity + contador + botão "Ver detalhes") | `LiveDashboard.tsx` |
| 2 | **Sidebar agrupada** (Visão Geral, Performance, Engajamento, Equipes, Qualidade) com colapso por grupo + atalho global ⌘K | `DashboardSidebar.tsx` (novo) |
| 3 | **Command Palette (⌘K)** com navegação entre tabs e ações rápidas (export, refresh, config validação) | `ui/command-palette.tsx` (novo) |
| 4 | **Filter chips + contador de resultados** no `TableToolbar` | `TableToolbar.tsx` |
| 5 | **EmptyState/DataEmptyState** reutilizáveis com ícones, descrições e CTAs | `TabContent/shared.tsx` |

### 4.3 Comportamento mobile (≤ `lg`)
- Sidebar: `hidden lg:flex` (não invade a tela em mobile).
- Adicionada barra horizontal scrollável de tabs em `<div className="lg:hidden ...">` no topo do `<main>`.
- `<main>` ganhou `lg:ml-72` para empurrar o conteúdo em desktop.

### 4.4 Correções aplicadas
1. **`window is not defined`** — todos os acessos a `window`, `navigator` e `document` agora guarded (`typeof !== "undefined"`).
2. **Tela branca (`ReferenceError: hasWindow is not defined`)** — `hasWindow` e `totalDaysInMonth` movidos para ANTES do `if (!data || !data.summary)`.
3. **Sidebar sobrepondo conteúdo em mobile** — `hidden lg:flex` + mobile tab nav.
4. **Hydration mismatch na sidebar** — flag `isMounted` para renderizar placeholder antes do mount.
5. **`React Hook called conditionally`** — todos os hooks movidos para antes do early return.

## 5. Tipos importantes

```ts
// lib/checkin-validator.ts
ValidationResult {
  total, valid, suspicious, byReason,
  bySeverity: { low, medium, high },
  shortDurationCheckIns: {
    id, participant, date, duration,
    dailyTotalDuration, title, distanceKm, activities,
    isDailyTotal: boolean   // true se há múltiplos check-ins no dia
  }[]
}

// lib/gmove-processor.ts
TargetMonthCheckIn {
  id, account_id, memberName, occurred_at,
  duration, title, points,
  distance_miles: string | null,  // pt-BR, ex: "2,45"
  calories: number | null,
  check_in_activities: { platform_activity?: string }[]
}

// lib/validation-config.ts
ValidationConfig {
  minDurationMinutes: 30,
  minDistanceKm: 2,
  outlierMultiplier: 1.5,
  maxDurationHours: 3,
  maxDistanceKm: 50,
  gapDays: 7
  // (minCalories REMOVIDO)
}
```

## 6. Histórico de commits

```
68d9e04  fix: guard window.location.reload for SSR safety
34b47f1  fix: add missing hasWindow and totalDaysInMonth variables
f819dc7  fix: prevent blank screen from sidebar hydration mismatch
3e136a8  fix: sidebar hidden on mobile, added mobile tab nav, removed inline style override
cf9ead2  fix: guard window/document/navigator access in command-palette for SSR safety
850b95a  feat: UI/UX improvements - validation banner, sidebar nav, command palette, filter chips, empty states
da1d05e  feat: dashboard GMove com modalidades por esporte, validação <15min, imagens do mês, remoção evolução
```

## 7. Pendências conhecidas

- **Lint pré-existente:** `npm run lint` reporta 47+ erros em arquivos não tocados nesta sessão (`Dashboard.tsx`, `Hero.tsx`, `DataGate.tsx`, vários `TabContent/*`, `tailwind.config.ts`, etc.). Não bloqueiam build/testes. Padrão típico: `Unexpected any` e `Empty block statement`.
- **Dashboard.tsx (legado)** ainda usa mock `src/data/gmove.ts`. O runtime real é `LiveDashboard.tsx` + `DataGate.tsx`.
- **Filtros rápidos (chips)** — a infra (`TableToolbar`) está pronta mas as tabs individuais ainda não passam `filters`/`onFilterChange`. Quando implementar: passar listas como `filters={[{id:"atingiu-meta", label:"Atingiu meta", count:N, active:false}]}`.
- **Tab "Validação"** no `DashboardSidebar` agrupa a antiga "Validação" e pode ganhar sub-grupo para "Calorias mínimas" (descontinuada) e "Outliers altos".

## 8. Atalhos e padrões

- **Navegação:** clicar na sidebar **ou** pressionar ⌘K / Ctrl+K.
- **Filtros:** chips no topo de cada tabela (placeholder).
- **Configuração de validação:** botão "Configurar Critérios" no topo da aba Validação.
- **Persistência:** `ValidationConfig` é salva em `localStorage["gmove_validation_config"]`.
- **Cache do dataset:** `localStorage["gmove_admin_raw_v1"]` (gerenciado em `DataGate.tsx`).

## 9. Próximos passos sugeridos

1. Aplicar filtros rápidos em pelo menos `DaysActiveTab` e `InactivesTab`.
2. Migrar `Dashboard.tsx` (legado) para usar o mesmo `LiveDashboard` ou remover.
3. Adicionar testes unitários para `checkin-validator.ts` (regras mais complexas agora).
4. Resolver os erros de lint pré-existentes em batch (`pnpm dlx eslint . --fix` ou desabilitar regras conflitantes).
5. Considerar `React.lazy` para code-split das tabs (bundle atual ~916 kB).

---

**Para retomar:** abrir o projeto na mesma pasta, ler este arquivo e checar `git log` + `git status`. Build e testes foram confirmados passando no último commit (`68d9e04`).
