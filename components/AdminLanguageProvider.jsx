"use client";

import { createContext, useContext, useMemo } from "react";
import { translateAdmin } from "@/lib/adminI18n";

const AdminLanguageContext = createContext({ locale: "zh", t: (text) => text });

export function AdminLanguageProvider({ children, locale }) {
  const value = useMemo(() => ({ locale, t: (text) => translateAdmin(locale, text) }), [locale]);
  return <AdminLanguageContext.Provider value={value}>{children}</AdminLanguageContext.Provider>;
}

export function useAdminLanguage() {
  return useContext(AdminLanguageContext);
}
