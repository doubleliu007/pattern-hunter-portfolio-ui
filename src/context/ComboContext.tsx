import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "../utils/api";
import type { ComboInfo } from "../types";

interface ComboContextValue {
  combo: string;
  setCombo: (name: string) => void;
  combos: ComboInfo[];
  loading: boolean;
}

const ComboContext = createContext<ComboContextValue>({
  combo: "",
  setCombo: () => {},
  combos: [],
  loading: true,
});

export function ComboProvider({ children }: { children: ReactNode }) {
  const [combo, setComboState] = useState("");
  const [combos, setCombos] = useState<ComboInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .combos()
      .then((res) => {
        setCombos(res.combos);
        setComboState(res.default);
      })
      .catch(() => {
        setComboState("encoder_v4_default");
      })
      .finally(() => setLoading(false));
  }, []);

  const setCombo = useCallback((name: string) => {
    setComboState(name);
  }, []);

  return (
    <ComboContext.Provider value={{ combo, setCombo, combos, loading }}>
      {children}
    </ComboContext.Provider>
  );
}

export function useCombo() {
  return useContext(ComboContext);
}
