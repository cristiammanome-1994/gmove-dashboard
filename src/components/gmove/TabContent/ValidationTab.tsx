// src/components/gmove/TabContent/ValidationTab.tsx

import { useState, useMemo } from 'react';
import { validateCheckIns } from '@/lib/checkin-validator';
import {
  loadValidationConfig,
  saveValidationConfig,
  DEFAULT_CONFIG,
  ValidationConfig,
} from '@/lib/validation-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProcessedDashboard } from '@/lib/gmove-processor';
import { Settings, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  data: ProcessedDashboard;
}

export const ValidationTab = ({ data }: Props) => {
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<ValidationConfig>(loadValidationConfig());
  const [filterReason, setFilterReason] = useState<string | null>(null);

  const validation = useMemo(() => validateCheckIns(data), [data]);

  const filtered = useMemo(() => {
    let items = validation.suspicious;
    if (filterReason) {
      items = items.filter(i => i.reason.includes(filterReason));
    }
    return items;
  }, [validation.suspicious, filterReason]);

  const handleConfigChange = (
    key: keyof ValidationConfig,
    value: number | string
  ) => {
    const newConfig = {
      ...config,
      [key]: typeof value === 'string' ? parseFloat(value) : value,
    };
    setConfig(newConfig);
    saveValidationConfig(newConfig);
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
  };

  const getSeverityBorder = (severity: string) => {
    return severity === 'high'
      ? 'border-l-4 border-l-red-500 bg-red-50'
      : severity === 'medium'
      ? 'border-l-4 border-l-yellow-500 bg-yellow-50'
      : 'border-l-4 border-l-blue-500 bg-blue-50';
  };

  return (
    <div className="space-y-6">
      {/* Botão Config */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfig(!showConfig)}
        className="gap-2"
      >
        <Settings className="w-4 h-4" />
        {showConfig ? 'Fechar' : 'Configurar'} Critérios
      </Button>

      {/* Painel de Configuração */}
      {showConfig && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="text-sm font-semibold block mb-2">
              Duração Mínima (minutos)
            </label>
            <input
              type="number"
              value={config.minDurationMinutes}
              onChange={e =>
                handleConfigChange('minDurationMinutes', e.target.value)
              }
              className="w-full px-3 py-2 border rounded"
              min="0"
              max="120"
            />
            <p className="text-xs text-gray-600 mt-1">
              Check-ins abaixo disso são suspeitos
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">
              Distância Mínima (km)
            </label>
            <input
              type="number"
              value={config.minDistanceKm}
              onChange={e =>
                handleConfigChange('minDistanceKm', e.target.value)
              }
              className="w-full px-3 py-2 border rounded"
              min="0"
              max="10"
              step="0.5"
            />
            <p className="text-xs text-gray-600 mt-1">
              Check-ins abaixo disso são suspeitos
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">
              Duração Máxima (horas)
            </label>
            <input
              type="number"
              value={config.maxDurationHours}
              onChange={e =>
                handleConfigChange('maxDurationHours', e.target.value)
              }
              className="w-full px-3 py-2 border rounded"
              min="1"
              max="12"
            />
            <p className="text-xs text-gray-600 mt-1">
              Check-ins muito longos podem ser suspeitos
            </p>
          </div>

          <div className="md:col-span-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfig(DEFAULT_CONFIG);
                saveValidationConfig(DEFAULT_CONFIG);
              }}
            >
              Restaurar Padrões
            </Button>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-semibold">✅ Válidos</p>
          <p className="text-2xl font-bold text-green-700">{validation.valid}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-600 font-semibold">🔴 Crítico</p>
          <p className="text-2xl font-bold text-red-700">
            {validation.bySeverity.high}
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-600 font-semibold">🟡 Médio</p>
          <p className="text-2xl font-bold text-yellow-700">
            {validation.bySeverity.medium}
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-semibold">🟢 Baixo</p>
          <p className="text-2xl font-bold text-blue-700">
            {validation.bySeverity.low}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div>
        <p className="text-sm font-semibold mb-2">Filtrar por razão:</p>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterReason === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterReason(null)}
          >
            Todas ({validation.suspicious.length})
          </Button>
          {Object.entries(validation.byReason).map(([reason, count]) => (
            <Button
              key={reason}
              variant={filterReason === reason ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterReason(reason)}
            >
              {reason} ({count})
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Suspeitos */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">
          {filtered.length} check-in(s) suspeito(s)
        </h3>

        {filtered.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Nenhum problema encontrado com os critérios atuais! ✅
            </AlertDescription>
          </Alert>
        ) : (
          filtered.map(item => (
            <Alert key={item.id} className={getSeverityBorder(item.severity)}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold">
                      {getSeverityIcon(item.severity)} {item.participant}
                    </p>
                    <p className="text-sm text-gray-600">{item.date}</p>
                  </div>
                  <p className="text-sm">{item.suggestion}</p>
                  <div className="flex gap-2 flex-wrap">
                    {item.reason.map(r => (
                      <Badge key={r} variant="outline" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))
        )}
      </div>

      {/* Check-ins com menos de 30 minutos (total acumulado no dia) */}
      {validation.shortDurationCheckIns.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            {validation.shortDurationCheckIns.length} check-in(s) com menos de 30 minutos no dia
          </h3>
          <p className="text-sm text-muted-foreground">
            Validação por total acumulado no dia. Check-ins de corrida/caminhada com 2km+ são válidos individualmente.
          </p>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Participante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="text-right">Duração check-in</TableHead>
                  <TableHead className="text-right">Total no dia</TableHead>
                  <TableHead className="text-right">Distância (km)</TableHead>
                  <TableHead>Atividades</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validation.shortDurationCheckIns.map(ci => (
                  <TableRow key={ci.id} className="bg-yellow-50/50 hover:bg-yellow-100/50">
                    <TableCell className="font-medium">{ci.participant}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ci.date}</TableCell>
                    <TableCell className="text-sm">{ci.title ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-yellow-100 text-yellow-700 border-0">
                        {ci.duration} min
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={
                          ci.dailyTotalDuration >= 30
                            ? "bg-green-100 text-green-700 border-0"
                            : "bg-red-100 text-red-700 border-0"
                        }
                      >
                        {ci.dailyTotalDuration} min
                        {ci.isDailyTotal && <span className="ml-1 text-xs">Σ</span>}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {ci.distanceKm ? (
                        <span className="font-mono">{ci.distanceKm.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ci.activities.length > 0 ? (
                        ci.activities.map((a, i) => (
                          <Badge key={i} variant="secondary" className="mr-1 mb-1 text-xs">
                            {a}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
