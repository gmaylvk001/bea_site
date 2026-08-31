"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getDefaultSmartLeadConfig } from "@/lib/smartLead/configDefaults.js";

const SmartLeadConfigContext = createContext(null);

const CLIENT_CACHE_KEY = "bea_smart_lead_config_v1";
const CLIENT_CACHE_TTL_MS = 60_000;

function readClientCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CLIENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.at || Date.now() - parsed.at > CLIENT_CACHE_TTL_MS) return null;
    return parsed.config || null;
  } catch {
    return null;
  }
}

function writeClientCache(config) {
  if (typeof window === "undefined" || !config) return;
  try {
    sessionStorage.setItem(
      CLIENT_CACHE_KEY,
      JSON.stringify({ at: Date.now(), config })
    );
  } catch {
    // ignore
  }
}

export function SmartLeadConfigProvider({ children }) {
  const [config, setConfig] = useState(() => getDefaultSmartLeadConfig());
  const [ready, setReady] = useState(false);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    let cancelled = false;
    const cached = readClientCache();
    if (cached) {
      setConfig(cached);
      setReady(true);
    }

    (async () => {
      try {
        const res = await fetch("/api/smart-lead/config");
        const data = await res.json();
        if (cancelled) return;
        if (data?.success && data.data) {
          setConfig(data.data);
          writeClientCache(data.data);
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/smart-lead/config?_=" + Date.now());
      const data = await res.json();
      if (data?.success && data.data) {
        setConfig(data.data);
        writeClientCache(data.data);
        return data.data;
      }
    } catch {
      // ignore
    }
    return configRef.current;
  }, []);

  const value = useMemo(
    () => ({
      ready,
      config,
      getConfig: () => configRef.current,
      refresh,
    }),
    [ready, config, refresh]
  );

  return (
    <SmartLeadConfigContext.Provider value={value}>
      {children}
    </SmartLeadConfigContext.Provider>
  );
}

export function useSmartLeadConfig() {
  const ctx = useContext(SmartLeadConfigContext);
  if (!ctx) {
    const defaults = getDefaultSmartLeadConfig();
    return {
      ready: false,
      config: defaults,
      getConfig: () => defaults,
      refresh: async () => defaults,
    };
  }
  return ctx;
}
