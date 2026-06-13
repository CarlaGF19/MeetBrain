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
    <div id="login_screen_wrapper" className="min-h-screen w-full bg-[#f7f9fb] flex items-stretch justify-center select-none font-sans relative overflow-hidden">
      
      {/* Decorative Brand Light Orbs representing Lumina Ambient Glow */}
      <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-[#004ac6]/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[450px] h-[450px] bg-[#fea619]/4 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main Container with 12 Column Layout */}
      <motion.div
        id="desktop_login_card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full min-h-screen bg-[#f7f9fb] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10"
      >
        
        {/* LEFT COLUMN (7 Cols) - Lumina Branding & Interactive Highlights */}
        <div className="lg:col-span-7 bg-[#ffffff] border-r border-[#eceef0] p-8 sm:p-16 flex flex-col justify-between relative overflow-y-auto">
          
          {/* Header Brand */}
          <div className="flex items-center gap-2 text-left mb-8 lg:mb-0">
            <div className="flex items-center justify-center gap-1 shrink-0">
              <span className="w-1.5 h-6 rounded-full bg-[#004ac6] animate-[pulse_2s_infinite]" />
              <span className="w-1.5 h-4 rounded-full bg-[#004ac6]/60 animate-[pulse_1.5s_infinite]" />
              <span className="w-1.5 h-5 rounded-full bg-[#004ac6]/80 animate-[pulse_1.8s_infinite]" />
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl tracking-tighter text-[#191c1e] flex items-center">
                Olli<span className="text-[#004ac6] ml-[1px] font-extrabold">.</span>
              </span>
            </div>
          </div>

          {/* Main Info Hero */}
          <div className="max-w-xl mx-auto w-full my-auto py-10 text-left">
            
            {/* Minimalist Pill Accent */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563eb]/8 border border-[#2563eb]/15 text-[#004ac6] text-xs font-semibold mb-6">
              <Cpu className="w-3.5 h-3.5" />
              <span>Transcriptor de Reuniones Avanzado</span>
            </div>

            {/* Title corresponding to Headline-LG */}
            <h1 className="font-display text-3xl sm:text-[34px] font-extrabold text-[#191c1e] tracking-tight leading-[40px] sm:leading-[44px]">
              Revoluciona tus reuniones con <span className="text-[#004ac6] relative inline-block">inteligencia pura.</span>
            </h1>

            {/* Body Description corresponding to Body-LG */}
            <p className="font-sans text-base text-[#434655] font-normal mt-4 leading-relaxed max-w-lg">
              Transforma el caos en claridad. Olli estructura tus conversaciones directamente en decisiones y planes de acción procesables al instante. No vuelvas a perder un solo detalle de tus juntas de trabajo.
            </p>

            {/* Feature Bento Grid with standard (Level 1) & AI-Tinted Surfaces */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
              
              {/* Feature 1: Live Record (Level 1 Card, white with soft shadow) */}
              <div className="p-5 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="w-9 h-9 rounded-lg bg-[#004ac6]/8 flex items-center justify-center text-[#004ac6] mb-3">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="font-display text-sm font-semibold text-[#191c1e]">Captura Precisa</h3>
                <p className="font-sans text-[12px] text-[#434655] mt-1 leading-normal">
                  Grabación instantánea y transcripción automática en tiempo real de voz alta fidelidad.
                </p>
              </div>

              {/* Feature 2: Structured Document (Level 1 Card) */}
              <div className="p-5 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="w-9 h-9 rounded-lg bg-[#004ac6]/8 flex items-center justify-center text-[#004ac6] mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-display text-sm font-semibold text-[#191c1e]">Síntesis Automática</h3>
                <p className="font-sans text-[12px] text-[#434655] mt-1 leading-normal">
                  Minutas con formatos perfectos en Markdown con asignación inteligente de tareas.
                </p>
              </div>

              {/* Feature 3: Copilot (AI-Tinted Surface - light amber background and alert highlights) */}
              <div className="p-5 bg-[#fffbeb] rounded-2xl border border-[#fef3c7] shadow-[0_4px_12px_rgba(254,166,25,0.03)] hover:shadow-[0_4px_16px_rgba(254,166,25,0.07)] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#fea619]/15 text-[#855300] text-[9.5px] font-bold uppercase tracking-wider">
                  Sugerido
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#fea619]/14 flex items-center justify-center text-[#fea619] mb-3">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-display text-sm font-semibold text-[#855300]">Copiloto Conversacional</h3>
                <p className="font-sans text-[12px] text-[#855300]/90 mt-1 leading-normal">
                  Chatea con tus transcripciones de audio para extraer insights estratégicos en segundos.
                </p>
              </div>

              {/* Feature 4: High Reliability Protection (Level 1 Card) */}
              <div className="p-5 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="w-9 h-9 rounded-lg bg-[#006242]/8 flex items-center justify-center text-[#006242] mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display text-sm font-semibold text-[#191c1e]">Seguridad Absoluta</h3>
                <p className="font-sans text-[12px] text-[#434655] mt-1 leading-normal">
                  Infraestructura segura administrada de extremo a extremo sin almacenamiento público.
                </p>
              </div>

            </div>
          </div>

          {/* Footer Metadata removed per user request */}

        </div>

        {/* RIGHT COLUMN (5 Cols) - Clean Minimalist Google Authentication Terminal (Tonal Layer 2 Card) */}
        <div className="lg:col-span-5 p-8 sm:p-16 flex flex-col justify-center items-stretch bg-[#f7f9fb] relative">
          
          <div className="my-auto max-w-sm mx-auto w-full">
            
            {/* Level 2 Login Portal Card */}
            <div className="bg-white rounded-2xl border border-[#eceef0] p-8 shadow-[0_12px_32px_rgba(0,0,0,0.03)] text-center relative overflow-hidden">
              
              {/* Top Accent line or indicator */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#004ac6]" />

              {/* Secure lock illustration tailored to Lumina System specs */}
              <div className="w-12 h-12 bg-[#004ac6]/10 rounded-xl flex items-center justify-center text-[#004ac6] mb-5 mx-auto shadow-xs">
                <Lock className="w-5 h-5 text-[#004ac6]" />
              </div>

              {/* High Contrast Headings */}
              <h2 className="font-display text-xl font-bold text-[#191c1e] tracking-tight">
                Acceso Restringido
              </h2>
              <p className="font-sans text-xs text-[#434655] mt-2 leading-relaxed">
                Ingresa para sincronizar tus espacios de trabajo y continuar donde lo dejaste.
              </p>

              <div className="mt-8 space-y-4">
                
                {/* Main Google Sign-In Button (Solid Action Blue as per Buttons Token) */}
                <motion.button
                  type="button"
                  id="google_signin_btn"
                  onClick={handleGoogleOAuth}
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#004ac6] hover:bg-[#003ea8] text-white font-semibold py-3 px-5 rounded-lg shadow-sm flex items-center justify-center gap-3 transition-colors text-xs cursor-pointer select-none disabled:opacity-75 h-11"
                >
                  {isLoading ? (
                    <span className="border-2 border-white/20 border-t-white rounded-full w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded bg-white flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.14-5.136 4.14-3.41 0-6.173-2.784-6.173-6.225s2.763-6.226 6.173-6.226c1.55 0 2.96.568 4.05 1.503l3.056-3.055C19.123 2.115 15.935 1 12.24 1 6.13 1 1.135 6 1.135 12.16s4.996 11.16 11.105 11.16c6.07 0 10.99-4.8 10.99-11.16 0-.6-.051-1.2-.162-1.875H12.24z"
                          />
                        </svg>
                      </div>
                      <span>Iniciar sesión con Google</span>
                    </>
                  )}
                </motion.button>

                {/* Simulated Secondary action as a blueprint element */}
                <div className="text-center pt-2">
                  <span className="text-[10px] text-[#737686] font-medium leading-normal block">
                    ¿No tienes una cuenta corporativa? <br/>
                    <span className="text-[#004ac6] hover:underline cursor-pointer">Consulta con administración</span>
                  </span>
                </div>

              </div>

              {/* Alert Status for interactive experiences */}
              <div className="min-h-[40px] mt-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-[#ba1a1a]/5 border border-[#ba1a1a]/15 rounded-lg p-3 text-[11px] font-medium text-[#ba1a1a] flex items-start space-x-2 text-left w-full"
                    >
                      <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {!error && infoMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-[#004ac6]/5 border border-[#eceef0] rounded-lg p-3 text-[11px] font-medium text-[#004ac6] flex items-start space-x-2 text-left w-full"
                    >
                      <Info className="w-4 h-4 text-[#004ac6] shrink-0 mt-0.5" />
                      <span>{infoMessage}</span>
                    </motion.div>
                  )}

                  {!error && !infoMessage && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      className="text-[10px] text-[#737686] font-medium leading-relaxed block"
                    >
                      🔐 Autenticación segura gestionada a través de Google. Tus datos están protegidos.
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Mobile Footer Metadata removed per user request */}

          </div>

        </div>

      </motion.div>
    </div>
  );
}
