import { useEffect, useMemo, useRef, useState, DragEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, Loader2, FileJson, Trash2,
  Settings, ChevronDown, Calendar,
} from "lucide-react";
import {
  processChallenge, DEFAULT_OPTIONS, ProcessedDashboard, ProcessOptions, RawData,
  extractAvailableMonths,
} from "@/lib/gmove-processor";
import {
  saveDashboard, loadDashboard, clearDashboard,
  saveRaw, loadRaw, saveOpts, loadOpts,
} from "@/lib/admin-storage";
import { LiveSummaryCards } from "./LiveSummaryCards";
import { LiveDashboard } from "./LiveDashboard";
import { cn } from "@/lib/utils";

export const DataGate = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState<RawData | null>(null);
  const [opts, setOptsState] = useState<ProcessOptions>(DEFAULT_OPTIONS);
  const [excludeText, setExcludeText] = useState<string>(DEFAULT_OPTIONS.excludeNames.join(", "));
  const [processing, setProcessing] = useState(false);
  const [drag, setDrag] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Boot: try load cached opts + raw, then fall back to static /challenge-data.json
  useEffect(() => {
    const cachedOpts = loadOpts();
    if (cachedOpts) {
      setOptsState(cachedOpts);
      setExcludeText(cachedOpts.excludeNames.join(", "));
    }
    const cachedRaw = loadRaw();
    if (cachedRaw) {
      setRaw(cachedRaw);
    } else {
      fetch("/challenge-data.json")
        .then((r) => r.json())
        .then((json) => {
          if (Array.isArray(json?.members) && Array.isArray(json?.check_ins)) {
            const normalized: RawData = {
              members: json.members,
              check_ins: json.check_ins,
            };
            setRaw(normalized);
          }
        })
        .catch(() => {});
    }

    // Listen for changes made by the admin in another tab/route
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "gmove_admin_raw_v1" && e.newValue) {
        try {
          const json = JSON.parse(e.newValue) as RawData;
          setRaw(json);
        } catch {}
      }
      if (e.key === "gmove_admin_opts_v1" && e.newValue) {
        try {
          const next = JSON.parse(e.newValue) as ProcessOptions;
          setOptsState(next);
          setExcludeText(next.excludeNames.join(", "));
        } catch {}
      }
      if (e.key === "gmove_admin_raw_v1" && e.newValue === null) {
        setRaw(null);
      }
    };
    window.addEventListener("storage", handleStorage);

    const handleLocalUpdate = () => {
      const raw = loadRaw();
      if (raw) setRaw(raw);
      const opts = loadOpts();
      if (opts) {
        setOptsState(opts);
        setExcludeText(opts.excludeNames.join(", "));
      }
    };
    window.addEventListener("gmove:raw-updated", handleLocalUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("gmove:raw-updated", handleLocalUpdate);
    };
  }, []);

  // Available months from current dataset
  const availableMonths = useMemo(() => (raw ? extractAvailableMonths(raw) : []), [raw]);

  // Reactive processed dashboard
  const data: ProcessedDashboard | null = useMemo(() => {
    if (!raw) return loadDashboard();
    try {
      return processChallenge(raw, opts);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [raw, opts]);

  // Persist processed result + opts whenever they change
  useEffect(() => {
    if (data) saveDashboard(data);
    saveOpts(opts);
  }, [data, opts]);

  const updateOpts = (patch: Partial<ProcessOptions>) => setOptsState((o) => ({ ...o, ...patch }));

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".json")) {
      toast({ title: "Arquivo inválido", description: "Envie um arquivo .json", variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json.members) || !Array.isArray(json.check_ins)) {
        throw new Error("JSON inválido: esperado 'members' e 'check_ins'.");
      }
      const normalized: RawData = {
        members: json.members,
        check_ins: json.check_ins,
      };
      await new Promise((r) => setTimeout(r, 50));

      // Auto-select most recent month present in the file
      const months = extractAvailableMonths(normalized);
      let nextOpts = opts;
      if (months.length && !months.find((m) => m.month === opts.month && m.year === opts.year)) {
        nextOpts = { ...opts, month: months[0].month, year: months[0].year };
        setOptsState(nextOpts);
      }

      setRaw(normalized);
      const saved = saveRaw(normalized);
      if (!saved) {
        toast({
          title: "Atenção",
          description: "Dataset grande demais para cache local. Ao recarregar a página, será necessário fazer upload novamente.",
        });
      }
      const result = processChallenge(normalized, nextOpts);
      toast({
        title: "Dashboard atualizado",
        description: `${result.summary.active} participantes · ${result.summary.totalCheckIns} check-ins em ${result.monthLabel}.`,
      });
    } catch (err: any) {
      toast({
        title: "Falha ao processar",
        description: err?.message ?? "Verifique o JSON enviado.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleClear = () => {
    clearDashboard();
    setRaw(null);
    if (fileRef.current) fileRef.current.value = "";
    toast({ title: "Dataset removido" });
  };

  const commitExcludeNames = () => {
    const list = excludeText.split(",").map((s) => s.trim()).filter(Boolean);
    updateOpts({ excludeNames: list });
  };

  /* ---------------- EMPTY STATE ---------------- */
  if (!data || !data.summary.totalCheckIns) {
    return (
      <section id="dashboard" className="container py-20">
        <Card className={cn("max-w-3xl mx-auto bg-gradient-card border-primary/20", drag && "border-primary scale-[1.01]")}>
          <CardContent
            className="p-12 text-center"
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-elegant mb-5">
              <Upload className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-primary-deep mb-2">Carregar challenge-data.json</h3>
            <p className="text-muted-foreground mb-6">Arraste o arquivo JSON aqui ou clique para selecionar.</p>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={processing}
              size="lg"
              className="bg-gradient-primary shadow-elegant"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {processing ? "Processando..." : "Selecionar arquivo JSON"}
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const currentMonthKey = `${opts.year}-${String(opts.month).padStart(2, "0")}`;

  /* ---------------- LIVE DASHBOARD ---------------- */
  return (
    <>
      <section className="container pt-10 pb-2">
        <Card className="bg-gradient-card border-primary/20 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={processing}
                size="sm"
                className="bg-gradient-primary shadow-elegant"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Substituir JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="border-destructive/30 text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="h-4 w-4" /> Limpar
              </Button>
              <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" /> Configurações{" "}
                    <ChevronDown className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Meta de dias
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={opts.goalDays}
                        onChange={(e) => updateOpts({ goalDays: +e.target.value })}
                        className="h-9 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Mín. dias para 'ativo real'
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={opts.minActiveDays}
                        onChange={(e) => updateOpts({ minActiveDays: +e.target.value })}
                        className="h-9 mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Excluir nomes (separados por vírgula)
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={excludeText}
                          onChange={(e) => setExcludeText(e.target.value)}
                          placeholder="Ex: João, Maria"
                          className="h-9"
                        />
                        <Button size="sm" onClick={commitExcludeNames} variant="secondary">
                          Aplicar
                        </Button>
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <Switch
                        checked={opts.useVideoDynamic}
                        onCheckedChange={(v) => updateOpts({ useVideoDynamic: v })}
                      />
                      <Label className="text-sm font-medium">Dinâmica de vídeos ativa</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container pt-20 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Indicadores · {data.monthLabel}
              {data.summary.monthCompleted ? (
                <span className="text-muted-foreground"> · Finalizado</span>
              ) : (
                <span className="text-status-near-foreground"> · Em andamento</span>
              )}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-primary-deep">
              Resumo executivo do desafio
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-status-met-foreground bg-status-met px-3 py-1.5 rounded-full">
              <FileJson className="h-3.5 w-3.5" />
              {data.summary.totalCheckIns} check-ins · {data.monthLabel}
            </span>
          </div>
        </div>

        {/* Period selector (public, read-only) */}
        <Card className="bg-gradient-card border-primary/20 mb-8">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Período
                </Label>
              </div>
              <Select
                value={currentMonthKey}
                onValueChange={(v) => {
                  const [y, m] = v.split("-").map(Number);
                  updateOpts({ year: y, month: m });
                }}
              >
                <SelectTrigger className="w-[220px] h-10 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.length === 0 && (
                    <SelectItem value={currentMonthKey}>{data.monthLabel}</SelectItem>
                  )}
                  {availableMonths.map((m) => {
                    const isCurrent = m.month === new Date().getMonth() + 1 && m.year === new Date().getFullYear();
                    return (
                      <SelectItem key={m.key} value={m.key}>
                        <span className="flex items-center justify-between w-full gap-2">
                          {m.label}
                          {isCurrent && (
                            <Badge className="bg-status-near text-status-near-foreground hover:bg-status-near border-0 text-[10px] px-1.5 py-0">
                              Em andamento
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <LiveSummaryCards data={data} />
      </section>

      <section className="container pb-20">
        <div className="mb-6">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-2">
            Dashboard interativo
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-primary-deep">
            Análise por aba
          </h2>
        </div>
        <LiveDashboard data={data} />
      </section>
    </>
  );
};
