/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { 
  Sparkles, 
  AlertCircle, 
  Info, 
  Mic, 
  FileText, 
  Bot, 
  Lock, 
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Cpu
} from "lucide-react";

interface LoginRegisterProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleGoogleOAuth = async () => {
    setIsLoading(true);
    setError("");
    setInfoMessage(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      onLoginSuccess({
        uid: firebaseUser.uid,
        email: firebaseUser.email || "username45usario@gmail.com",
        displayName: firebaseUser.displayName || "Usuario Olli",
        photoURL: firebaseUser.photoURL || undefined,
      });
    } catch (err: any) {
      console.error("Firebase Google Auth failed:", err);
      
      if (err.code === "auth/popup-closed-by-user") {
        setError("La ventana de autenticación fue cerrada antes de completarla.");
      } else {
        setError(err.message || "Fallo inesperado al conectar con Google.");
      }

      setInfoMessage("Asegúrate de permitir las ventanas emergentes (popups) en tu navegador para iniciar sesión segura.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login_screen_wrapper" className="min-h-screen w-full bg-gradient-to-tr from-[#020617] via-[#0b1329] to-[#040815] flex items-stretch justify-center select-none font-sans relative overflow-hidden p-4 sm:p-8">
      
      {/* Dynamic Glowing Ambient Light Orbs for Glassmorphism Background depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-[#004ac6]/20 to-[#2563eb]/5 filter blur-[120px] pointer-events-none animate-[pulse_8s_infinite_alternate]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-[#fea619]/10 to-transparent filter blur-[150px] pointer-events-none animate-[pulse_10s_infinite_alternate]" />
      <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full bg-[#00ffcc]/5 filter blur-[100px] pointer-events-none animate-[pulse_12s_infinite]" />

      {/* Main Container - Full viewport glass frame */}
      <motion.div
        id="desktop_login_card"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 shadow-[0_24px_80px_rgba(0,0,0,0.4)] my-auto self-center"
      >
        
        {/* LEFT COLUMN (7 Cols) - Olli Value Prop & Glassmorphic Tiles */}
        <div className="lg:col-span-7 p-8 sm:p-14 lg:p-16 flex flex-col justify-between relative overflow-y-auto">
          
          {/* Header Brand */}
          <div className="flex items-center gap-2.5 text-left mb-10 lg:mb-0">
            <div className="flex items-center justify-center gap-1 shrink-0 bg-white/5 px-3 py-2.5 rounded-xl border border-white/10 shadow-inner">
              <span className="w-1 h-6 rounded-full bg-[#004ac6] animate-[pulse_1.2s_infinite]" />
              <span className="w-1 h-4 rounded-full bg-[#00a8e8] animate-[pulse_1.5s_infinite]" />
              <span className="w-1 h-5 rounded-full bg-[#2563eb] animate-[pulse_1.8s_infinite]" />
              <span className="w-1 h-3 rounded-full bg-[#a855f7] animate-[pulse_1.4s_infinite]" />
            </div>
            <div>
              <span className="font-display font-black text-2xl tracking-tighter text-white flex items-center">
                Olli<span className="text-[#00a8e8] ml-[1px] font-black">.</span>
              </span>
            </div>
          </div>
 
          {/* Main Info Hero */}
          <div className="max-w-xl w-full my-auto py-8 text-left">
            
            {/* Title corresponding to Headline-LG with gorgeous clip gradient */}
            <h1 className="font-display text-3xl sm:text-[42px] font-black text-white tracking-tight leading-[44px] sm:leading-[52px]">
              Revoluciona tus <br />
              reuniones con <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-[#fea619] animate-gradient">
                inteligencia pura.
              </span>
            </h1>

            {/* Body Description corresponding to Body-LG */}
            <p className="font-sans text-sm sm:text-base text-slate-300 font-light mt-4 leading-relaxed max-w-lg">
              Transforma el caos en claridad. Olli estructura tus conversaciones directamente en decisiones y planes de acción procesables al instante.
            </p>

            {/* Feature Bento Grid with Glassmorphic blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              
              {/* Feature 1: Live Record */}
              <div className="p-5 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/5 hover:border-white/12 hover:bg-white/[0.05] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="font-display text-sm font-semibold text-white">Captura Precisa</h3>
                <p className="font-sans text-[12px] text-slate-400 mt-1 leading-normal">
                  Transcripción en tiempo real impulsada por IA, sin perder un solo detalle crítico.
                </p>
              </div>

              {/* Feature 2: Structured Document */}
              <div className="p-5 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/5 hover:border-white/12 hover:bg-white/[0.05] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-display text-sm font-semibold text-white">Síntesis Automática</h3>
                <p className="font-sans text-[12px] text-slate-400 mt-1 leading-normal">
                  Generación instantánea de resúmenes estructurados y tareas asignables.
                </p>
              </div>

              {/* Feature 3: Copilot */}
              <div className="p-5 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/5 hover:border-white/12 hover:bg-white/[0.05] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#fea619] mb-3">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-display text-sm font-semibold text-white">IA Conversacional</h3>
                <p className="font-sans text-[12px] text-slate-400 mt-1 leading-normal">
                  Interactúa con tus transcripciones para extraer insights ocultos al instante.
                </p>
              </div>

              {/* Feature 4: High Reliability Protection */}
              <div className="p-5 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/5 hover:border-white/12 hover:bg-white/[0.05] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display text-sm font-semibold text-white">Seguridad Total</h3>
                <p className="font-sans text-[12px] text-slate-400 mt-1 leading-normal">
                  Infraestructura blindada para mantener la confidencialidad absoluta de tus datos.
                </p>
              </div>

            </div>
          </div>

          <div className="text-left text-[11px] text-slate-500 font-light mt-6 lg:block hidden">
            <span>Tecnología inteligente integrada con Olli IA.</span>
          </div>

        </div>

        {/* RIGHT COLUMN (5 Cols) - Vibrant Glowing Blue-Cyan Glassmorphic Portal */}
        <div className="lg:col-span-5 p-6 sm:p-14 lg:p-16 flex flex-col justify-center items-stretch bg-white/[0.01] border-l border-white/5 relative">
          
          <div className="my-auto max-w-sm mx-auto w-full">
            
            {/* Glowing Blue-Cyan Neon Glassmorphism Card */}
            <div className="bg-gradient-to-b from-[#004ac6]/90 via-[#0053db]/95 to-[#00a8e8]/90 backdrop-blur-2xl rounded-3xl border border-white/25 p-8 shadow-[0_20px_50px_rgba(0,168,232,0.25)] text-center relative overflow-hidden">
              
              {/* Highlight Overlay effect */}
              <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/15 pointer-events-none" />

              {/* Top Accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />

              {/* Secure Fingerprint block */}
              <div className="w-14 h-14 bg-black/15 border border-white/15 rounded-2xl flex items-center justify-center text-white mb-6 mx-auto shadow-inner">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12C2 6.5 6.5 2 12 2s10 4.5 10 10" />
                  <path d="M5 19.5C6.9 21 9.4 22 12 22s5.1-1 7-2.5" />
                  <path d="M12 11V7" />
                  <path d="M8 14v-3c0-2.2 1.8-4 4-4s4 1.8 4 4v3" />
                  <path d="M12 18h.01" />
                  <circle cx="12" cy="14" r="2" />
                </svg>
              </div>

              {/* High Contrast Headings */}
              <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                Acceso Restringido
              </h2>
              <p className="font-sans text-xs text-blue-100/80 mt-2.5 leading-relaxed">
                Ingresa para sincronizar tus espacios de trabajo y continuar donde lo dejaste.
              </p>

              <div className="mt-8 space-y-4">
                
                {/* Main Google Sign-In Button (Solid white with animated hover) */}
                <motion.button
                  type="button"
                  id="google_signin_btn"
                  onClick={handleGoogleOAuth}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#ffffff] hover:bg-slate-50 text-slate-900 font-semibold py-3 px-5 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] flex items-center justify-center gap-3.5 transition-all text-sm cursor-pointer select-none disabled:opacity-75 h-12"
                >
                  {isLoading ? (
                    <span className="border-2 border-slate-900/20 border-t-slate-900 rounded-full w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.14-5.136 4.14-3.41 0-6.173-2.784-6.173-6.225s2.763-6.226 6.173-6.226c1.55 0 2.96.568 4.05 1.503l3.056-3.055C19.123 2.115 15.935 1 12.24 1 6.13 1 1.135 6 1.135 12.16s4.996 11.16 11.105 11.16c6.07 0 10.99-4.8 10.99-11.16 0-.6-.051-1.2-.162-1.875H12.24z"
                          />
                        </svg>
                      </div>
                      <span className="tracking-tight text-slate-900 font-bold">Iniciar sesión con Google</span>
                    </>
                  )}
                </motion.button>

              </div>

              {/* Interactive Alert Panels for Popups or Failures */}
              <div className="min-h-[48px] mt-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-black/25 border border-white/10 rounded-xl p-3 text-[11px] font-medium text-white flex items-start space-x-2 text-left w-full shadow-inner"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {!error && infoMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-black/20 border border-white/10 rounded-xl p-3 text-[11px] font-medium text-blue-100 flex items-start space-x-2 text-left w-full"
                    >
                      <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                      <span>{infoMessage}</span>
                    </motion.div>
                  )}

                  {!error && !infoMessage && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      className="text-[10px] text-blue-100/85 font-normal leading-relaxed block text-center"
                    >
                      🔐 Autenticación segura gestionada a través de Google. Tus datos están protegidos.
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
