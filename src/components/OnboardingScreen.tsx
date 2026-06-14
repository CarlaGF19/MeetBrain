/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User } from "../types";
import { motion } from "motion/react";
import { Key, UserCheck, ShieldAlert, Sparkles, Mail, Lock, X } from "lucide-react";

interface OnboardingScreenProps {
  user: User;
  onSaveApiKey: (apiKey: string) => Promise<void>;
  showSkip?: boolean;
  onSkip?: () => void;
}

export default function OnboardingScreen({ user, onSaveApiKey, showSkip, onSkip }: OnboardingScreenProps) {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!apiKey.trim()) {
      setError("Ingresa una API Key de Gemini o usa 'Omitir por ahora'.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveApiKey(apiKey.trim());
    } catch (err: any) {
      setError(err.message || "No se pudo guardar la clave en SQLite local.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const names = user.displayName ? user.displayName.split(" ") : [user.username || "Usuario"];
  const firstName = names[0] || "Usuario";
  const lastName = names.slice(1).join(" ") || "Cuenta local";

  return (
    <motion.div
      key="api-setup-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px] px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", duration: 0.45 }}
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white border border-[#E9E9EB] rounded-2xl shadow-[0_24px_70px_rgba(15,23,42,0.22)] p-5 sm:p-6 text-left font-sans"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center gap-0.5 shrink-0">
              <span className="w-2 h-5 rounded-full bg-[#135bf1]" />
              <span className="w-2 h-3.5 rounded-full bg-[#135bf1]/60" />
              <span className="w-2 h-4 rounded-full bg-[#135bf1]/80" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tighter text-[#111111]">olli<span className="text-[#135bf1]">.</span></span>
                <span className="px-2 py-0.5 border border-[#135bf1]/15 bg-[#135bf1]/5 text-[#135bf1] text-[9px] font-bold rounded-md uppercase tracking-wider">
                  API Setup
                </span>
              </div>
            </div>
          </div>

          {showSkip && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors"
              aria-label="Cerrar configuracion"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mb-5">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Configurar Gemini API Key
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-lg">
            Hola, {firstName}. Agrega tu clave para activar transcripcion, resumen y chat con IA. Puedes omitir este paso y configurarlo despues en Settings.
          </p>
        </div>

        <div className="mb-5 p-4 bg-[#FAF9F6] border border-[#E9E9EB] rounded-2xl">
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#135bf1]" />
            Cuenta local activa
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Usuario</span>
              <span className="text-xs font-semibold text-slate-800">{firstName}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Perfil</span>
              <span className="text-xs font-semibold text-slate-800">{lastName}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-[#F2F2F2]">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Correo</span>
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5 break-all">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {user.email}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider leading-none">
                Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#135bf1] hover:underline font-bold flex items-center gap-1 leading-none shrink-0"
              >
                Obtener clave
                <Sparkles className="w-3 h-3 text-[#135bf1]" />
              </a>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Pega aqui tu API key de Gemini"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white text-xs rounded-xl outline-none focus:border-[#135bf1] transition-all text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-3 text-[10.5px] text-indigo-900 leading-relaxed">
            <Lock className="w-4 h-4 text-[#135bf1] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-indigo-950">Privacidad local:</span>
              <p className="mt-0.5 text-indigo-800/90 leading-normal">
                Tu clave se guarda en SQLite dentro de este equipo. No se sincroniza con Firebase, Firestore ni Vercel.
              </p>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-100 rounded-xl text-left flex items-start gap-2 text-[11px] text-red-700"
            >
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="font-medium leading-normal">{error}</p>
            </motion.div>
          )}

          <div className="pt-4 border-t border-[#F2F2F2] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            {showSkip && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 text-xs font-bold transition-all cursor-pointer"
              >
                Omitir por ahora
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#135bf1] hover:bg-[#0746cc] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Guardar clave</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
