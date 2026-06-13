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
  CornerDownRight, 
  CheckCircle,
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
        displayName: firebaseUser.displayName || "Usuario Brain",
        photoURL: firebaseUser.photoURL || undefined,
      });
    } catch (err: any) {
      console.error("Firebase Google Auth failed:", err);
      
      // Check for blocked environments or generic popup-closed errors
      if (err.code === "auth/popup-closed-by-user") {
        setError("La ventana de autenticación fue cerrada antes de completar.");
      } else {
        setError(err.message || "Fallo inesperado al conectar con Google.");
      }

      // Proactively prompt user about allowing popups
      setInfoMessage("Asegúrate de habilitar las ventanas emergentes (popups) en tu navegador para iniciar sesión segura con Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login_screen_wrapper" className="min-h-screen w-full bg-[#FAF9F5] flex items-stretch justify-center select-none font-sans relative overflow-hidden">
      
      {/* Brand Background Elements */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-[#C4E2F5]/25 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-120px] right-[-100px] w-[500px] h-[500px] bg-[#f472b6]/8 rounded-full filter blur-[150px] pointer-events-none" />

      {/* Main Container - FULL SCREEN split layout occupies 100% of physical viewport */}
      <motion.div
        id="desktop_login_card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full min-h-screen bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10"
      >
        
        {/* LEFT COLUMN (7 Cols) - Product value description & Features */}
        <div className="lg:col-span-7 bg-[#FAF9F6]/60 border-r border-[#E9E9EB] p-8 sm:p-16 flex flex-col justify-center relative overflow-hidden">
          
          <div className="max-w-2xl mx-auto w-full">
            {/* Logo logotype & Project Tagline */}
            <div className="flex items-center gap-2 mb-8 text-left">
              <div className="flex items-center justify-center gap-0.5 shrink-0">
                <span className="w-2.5 h-6 rounded-full bg-[#135bf1]" />
                <span className="w-2.5 h-4 rounded-full bg-[#135bf1]/60" />
                <span className="w-2.5 h-5 rounded-full bg-[#135bf1]/80" />
              </div>
              <span className="font-bold text-2xl tracking-tighter text-[#111111] font-sans flex items-center">
                olli<span className="text-[#135bf1] ml-[1px]">.</span>
              </span>
            </div>

            {/* Product Title Banner */}
            <div className="text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                El motor inteligente de minutas que convierte tus reuniones en apuntes de valor.
              </h1>
              <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                Transcribe conferencias, organiza planes de acción, y debate acuerdos directamente con Olli, tu copiloto de IA con total privacidad.
              </p>
            </div>

            {/* Core Feature Grid - PROVING THE STUFF WHAT THIS APP DOES! */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10 text-left relative z-10">
              
              <div className="p-5 bg-white/70 backdrop-blur-md rounded-2xl border border text-slate-900 border-[#E9E9EB] hover:shadow-2xs transition-all">
                <div className="w-8 h-8 rounded-xl bg-[#135bf1]/10 flex items-center justify-center text-[#135bf1] mb-2.5">
                  <Mic className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold">Grabación & Transcripción en Vivo</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Speech-to-text inteligente en tiempo real asistido por IA para capturar cada idea clave sin cortes.
                </p>
              </div>

              <div className="p-5 bg-white/70 backdrop-blur-md rounded-2xl border border text-slate-900 border-[#E9E9EB] hover:shadow-2xs transition-all">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2.5">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold">Bóveda Inteligente Estructurada</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Generación instantánea de actas ejecutivas estructuradas en Markdown con listas de tareas marcables.
                </p>
              </div>

              <div className="p-5 bg-white/70 backdrop-blur-md rounded-2xl border border text-slate-900 border-[#E9E9EB] hover:shadow-2xs transition-all">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2.5">
                  <Bot className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold">Copiloto Integrado (Ask Olli Chat)</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Interroga directamente a la transcripción. Extrae decisiones, planes de acción y temas complejos de inmediato.
                </p>
              </div>

              <div className="p-5 bg-white/70 backdrop-blur-md rounded-2xl border border text-slate-900 border-[#E9E9EB] hover:shadow-2xs transition-all">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2.5">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold">Total Privacidad de Datos</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Proyecto de código abierto. Tu base de datos y tus transcripciones se almacenan de manera privada y segura.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (5 Cols) - Secure Google Login Gateway, clean & minimalist design without mascots */}
        <div className="lg:col-span-5 p-8 sm:p-16 flex flex-col justify-center items-stretch bg-white relative">
          
          {/* Middle Section - Form Credentials / OAuth Gateway */}
          <div className="my-auto text-center flex flex-col justify-center max-w-sm mx-auto w-full">
            
            {/* Elegant tiny lock illustration block to complement typography */}
            <div className="w-12 h-12 bg-[#135bf1]/5 border border-[#135bf1]/12 rounded-2xl flex items-center justify-center text-[#135bf1] mt-2 mb-5 mx-auto shadow-3xs">
              <Lock className="w-5 h-5" />
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Ingresa a tu Espacio Seguro
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Utiliza un método seguro para acceder a tu panel. Tus grabaciones de audio y notas se mantendrán sincronizadas de forma privada.
            </p>

            <div className="space-y-3 mt-8 w-full">
              
              {/* Google OAuth Login Button */}
              <motion.button
                type="button"
                id="google_signin_btn"
                onClick={handleGoogleOAuth}
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#FFFFFF] hover:bg-slate-50 text-black font-bold py-3.5 px-6 rounded-full border-[1.5px] border-[#E9E9EB] shadow-xs flex items-center justify-center gap-2.5 transition-all text-xs cursor-pointer select-none disabled:opacity-75"
              >
                {isLoading && !error ? (
                  <span className="border-2 border-[#111111]/20 border-t-[#111111] rounded-full w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.14-5.136 4.14-3.41 0-6.173-2.784-6.173-6.225s2.763-6.226 6.173-6.226c1.55 0 2.96.568 4.05 1.503l3.056-3.055C19.123 2.115 15.935 1 12.24 1 6.13 1 1.135 6 1.135 12.16s4.996 11.16 11.105 11.16c6.07 0 10.99-4.8 10.99-11.16 0-.6-.051-1.2-.162-1.875H12.24z"
                      />
                    </svg>
                    <span>Iniciar sesión con Google</span>
                  </>
                )}
              </motion.button>

            </div>

            {/* Custom Error & Helper Status Overlay panels */}
            <div className="min-h-[50px] mt-6 flex items-center justify-center px-1.5">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-50 border border-red-100 rounded-xl p-2.5 text-[10.5px] font-medium text-red-600 flex items-start space-x-1.5 text-left w-full"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {!error && infoMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#135bf1]/5 border border-[#135bf1]/12 rounded-xl p-2.5 text-[10px] font-medium text-[#135bf1] flex items-start space-x-1.5 text-left w-full"
                  >
                    <Info className="w-3.5 h-3.5 text-[#135bf1] shrink-0 mt-0.5" />
                    <span>{infoMessage}</span>
                  </motion.div>
                )}

                {!error && !infoMessage && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    className="text-[10px] text-[#80807C] font-semibold leading-normal block"
                  >
                    🔐 Tus credenciales de acceso son procesadas de extremo a extremo a través del servicio oficial de Google Authentication.
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
