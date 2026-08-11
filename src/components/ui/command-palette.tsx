"use client";

import { useState, useEffect, useRef, useMemo, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search, ChevronRight, Keyboard, LayoutDashboard, BarChart2, UserGroup, ShieldCheck, Users, Trophy, AlertTriangle, Image, Calendar, Flame, TrendingUp, Activity, Clock, Video, ListChecks, X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  shortcut?: string;
  group?: string;
  action: () => void;
  keywords?: string[];
}

interface Props {
  items: CommandItem[];
  isOpen: boolean;
  onClose: () => void;
  trigger?: "cmd+k" | "ctrl+k";
}

export const CommandPalette = ({ items, isOpen, onClose, trigger = "cmd+k" }: Props) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.keywords?.some(k => k.toLowerCase().includes(q)) ||
      item.shortcut?.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (modKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          filteredItems[selectedIndex]?.action();
          onClose();
          break;
        case "Tab":
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredItems.length);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen || typeof document === "undefined") return null;

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modLabel = isMac ? "⌘" : "Ctrl";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pointer-events-none">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl pointer-events-auto animate-slide-down">
        <div className="bg-background border border-border rounded-2xl shadow-elegant overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Buscar comandos, navegar, ações..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-lg"
              autoComplete="off"
              aria-label="Busca de comandos"
            />
            <kbd className="px-2 py-1 text-[10px] font-mono text-muted-foreground bg-muted rounded">
              {modLabel}K
            </kbd>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum comando encontrado para "{query}"</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[50vh] px-2 pb-4" type="always">
              <div role="listbox" aria-label="Comandos disponíveis">
                {(() => {
                  const groups = new Map<string, CommandItem[]>();
                  filteredItems.forEach(item => {
                    const g = item.group || "Geral";
                    if (!groups.has(g)) groups.set(g, []);
                    groups.get(g)!.push(item);
                  });
                  return Array.from(groups.entries());
                })().map(([groupName, groupItems], groupIdx) => (
                  <div key={groupName} className="py-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {groupName}
                    </div>
                    {groupIdx > 0 && <Separator className="my-1" />}
                    {groupItems.map((item, itemIdx) => {
                      const globalIdx = filteredItems.indexOf(item);
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          ref={el => { itemRefs.current[globalIdx] = el; }}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => { item.action(); onClose(); }}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted/50"
                          )}
                        >
                          {item.icon && <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{item.label}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground truncate block">{item.description}</span>
                            )}
                          </div>
                          {item.shortcut && (
                            <kbd className="px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded">
                              {item.shortcut}
                            </kbd>
                          )}
                          <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground", isSelected && "text-primary")} />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{filteredItems.length} comando(s)</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded">{modLabel}K</kbd>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export function useCommandPalette(items: CommandItem[]) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (modKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}