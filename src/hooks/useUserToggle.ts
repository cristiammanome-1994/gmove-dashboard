import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useUserToggle(initialUsers: string[], maxUsers = 8) {
  const [selected, setSelected] = useState<string[]>(initialUsers ?? []);
  const { toast } = useToast();

  // Reset when the source list reference changes (e.g. new dataset/period)
  useEffect(() => {
    setSelected(initialUsers ?? []);
  }, [initialUsers]);

  const toggle = useCallback(
    (name: string) => {
      setSelected((prev) => {
        if (prev.includes(name)) return prev.filter((n) => n !== name);
        if (prev.length >= maxUsers) {
          toast({
            title: "Limite atingido",
            description: `Máximo de ${maxUsers} participantes no gráfico.`,
          });
          return prev;
        }
        return [...prev, name];
      });
    },
    [maxUsers, toast],
  );

  const reset = useCallback(() => setSelected(initialUsers ?? []), [initialUsers]);

  return { selected, toggle, reset, max: maxUsers };
}
