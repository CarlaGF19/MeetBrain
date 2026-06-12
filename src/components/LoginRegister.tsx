/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User } from "../types";
import { Brain, Sparkles, CheckCircle2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { auth } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface LoginRegisterProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleOAuth = async () => {
    setIsLoading(true);
    setError("");

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
      setError(err.message || "Fallo al autenticar tus credenciales de Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login_container" className="min-h-screen flex items-center justify-center bg-slate-50/70 p-4 relative overflow-hidden font-sans">
      {/* Decorative calm blobs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#C4E2F5] rounded-full filter blur-[100px] opacity-25 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4BB8FA] rounded-full filter blur-[120px] opacity-20 translate-x-1/3 translate-y-1/3" />

      <motion.div 
        id="login_card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_-15px_rgba(44,94,173,0.1)] p-8 max-md:p-6 z-10 text-center"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#2C5EAD] flex items-center justify-center mb-4 text-white shadow-lg shadow-[#2C5EAD]/20">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <h1 id="app_name" className="text-2xl font-bold bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] bg-clip-text text-transparent">
            MeetingBrain
          </h1>
          <p className="text-sm text-slate-400 mt-1 px-4">
            Donde las reuniones se estructuran, analizan y almacenan con seguridad.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600 flex items-start space-x-2 text-left">
            <span className="shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Highlight features list */}
        <div className="mb-8 space-y-3.5 text-left bg-slate-50/50 border border-slate-100/80 p-5 rounded-xl">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Transcripción Digital Activa:</span> Captura de audio directo de pestañas o micrófonos sin ruidos de fondo.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Sparkles className="w-4 h-4 text-[#1591DC] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Análisis con Gemini 3.5:</span> Resúmenes ejecutivos exactos y generación automática de notas para Obsidian.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Shield className="w-4 h-4 text-[#2C5EAD] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Bóveda Cifrada en la Nube:</span> Tus transcripciones están resguardadas en tu cuenta de Google.
            </div>
          </div>
        </div>

        <button
          onClick={handleGoogleOAuth}
          disabled={isLoading}
          className="w-full bg-[#2C5EAD] hover:bg-[#1b4382] text-white py-3.5 px-5 rounded-xl text-sm font-semibold shadow-md shadow-[#2C5EAD]/10 hover:shadow-lg transition-all flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-75"
        >
          {isLoading ? (
            <span className="border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.14-5.136 4.14-3.41 0-6.173-2.784-6.173-6.225s2.763-6.226 6.173-6.226c1.55 0 2.96.568 4.05 1.503l3.056-3.055C19.123 2.115 15.935 1 12.24 1 6.13 1 1.135 6 1.135 12.16s4.996 11.16 11.105 11.16c6.07 0 10.99-4.8 10.99-11.16 0-.6-.051-1.2-.162-1.875H12.24zm0 0"
                />
              </svg>
              <span>Ingresar con Google Single Sign-On</span>
            </>
          )}
        </button>

        <div className="text-center mt-6 text-[10px] text-slate-400 font-medium">
          Workspace de acceso selectivo. Al continuar autorizas tu acceso mediante Google OAuth.
        </div>
      </motion.div>
    </div>
  );
}
