/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Sparkles, AlertCircle, Info } from "lucide-react";

interface LoginRegisterProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Fallback demo user details for instant bypass / Apple login
  const handleDemoBypass = (platform: "Apple" | "Test") => {
    setIsLoading(true);
    setInfoMessage(`Simulando ingreso con cuenta de ${platform}...`);
    
    setTimeout(() => {
      onLoginSuccess({
        uid: "demo-user-123",
        email: "username45usario@gmail.com",
        displayName: "Carla Acha",
        photoURL: undefined,
      });
      setIsLoading(false);
    }, 1200);
  };

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

      // Proactively prompt user about the fallback/Apple demo login bypass
      setInfoMessage("¿Problemas con Google? Prueba con 'Sign in with Apple' para entrar de inmediato en modo Invitado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login_screen_wrapper" className="min-h-screen w-full bg-[#EBEBE6] flex items-center justify-center p-0 sm:p-5 select-none font-sans relative overflow-hidden">
      
      {/* Decorative environment background effects */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#C4E2F5]/20 rounded-full filter blur-[120px] pointer-events-none -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FCE7F3]/25 rounded-full filter blur-[140px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Elegant phone mockup frame on desktop, borderless on mobile */}
      <motion.div
        id="phone_device_container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] h-screen sm:h-[840px] bg-[#FAF9F6] border-0 sm:border-[10px] sm:border-[#1E1E1C] rounded-none sm:rounded-[52px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.22)] relative flex flex-col justify-between overflow-hidden"
      >
        
        {/* Status bar mock mirroring real iOS framing */}
        <div className="w-full flex justify-between items-center px-7 pt-4 pb-1 text-black text-[12px] font-sans font-extrabold select-none shrink-0 z-30">
          <span>9:41</span>
          
          {/* Punch hole camera dynamic notch */}
          <div className="w-24 h-6 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-3 z-50 flex items-center justify-end pr-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1c1c1e] border border-zinc-800" />
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Status indicators */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-1.2 0-2.4.3-3.4.8l-1.2-1.2C8.7 2.2 10.3 2 12 2s3.3.2 4.6.6l-1.2 1.2C14.4 3.3 13.2 3 12 3zm0 4c-.7 0-1.4.1-2 .4l-1.2-1.2C9.9 5.8 10.9 5.6 12 5.6s2.1.2 3.2.6l-1.2 1.2c-.6-.3-1.3-.4-2-.4zm0 4c-.2 0-.4 0-.6.1l-1.2-1.2c.5-.3 1.1-.5 1.8-.5s1.3.2 1.8.5l-1.2 1.2c-.2-.1-.4-.1-.6-.1z" />
            </svg>
            <div className="flex items-end gap-[1.5px] h-2.5">
              <span className="w-[1.5px] h-1 bg-black rounded-[0.5px]" />
              <span className="w-[1.5px] h-1.5 bg-black rounded-[0.5px]" />
              <span className="w-[1.5px] h-2 bg-black rounded-[0.5px]" />
              <span className="w-[1.5px] h-2.5 bg-black rounded-[0.5px]" />
            </div>
            <div className="w-5.5 h-3 border-2 border-black rounded-[4px] p-[1px] flex items-center justify-start">
              <div className="w-3 h-full bg-black rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Brand Header Logotype */}
        <div className="px-6 pt-2 shrink-0 z-10 text-center">
          <h1 id="brand_logo_title" className="text-[52px] font-extrabold tracking-tighter text-black select-none leading-none pt-2 font-sans font-black">
            olli
          </h1>
        </div>

        {/* Interactive illustration viewport containing cute character bubbles */}
        <div className="flex-grow relative w-full h-[360px] sm:h-[390px] overflow-hidden select-none">
          
          {/* Connector vector curls in backdrop */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 380">
            {/* Top Loop: Green to Coral via Pink */}
            <path
              d="M 60,110 C 130,10 170,120 195,60 C 220,10 260,95 295,90"
              fill="none"
              stroke="#111111"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray="4 4"
              opacity="0.85"
            />
            {/* Bottom Loop: Blue to Yellow with a center swirl */}
            <path
              d="M 85,250 C 120,310 180,210 210,285 C 230,330 255,270 280,250"
              fill="none"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>

          {/* 1. GREEN BUBBLE (Left-center) */}
          <motion.div
            id="bubble_green"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            whileHover={{ scale: 1.1, rotate: -3 }}
            className="absolute left-[8%] top-[20%] w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-[#d2fab4] to-[#7adb64] border-[1.5px] border-[#111111] shadow-md z-10 cursor-pointer overflow-hidden flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] shrink-0">
              {/* Hair */}
              <path d="M 30,15 C 45,3 60,10 68,18" stroke="#111111" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 40,18 C 48,10 58,14 62,24" stroke="#111111" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Eyes */}
              <path d="M 28,45 C 32,38 40,38 44,45" stroke="#111111" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M 56,45 C 60,38 68,38 72,45" stroke="#111111" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              {/* Cute grin */}
              <path d="M 40,64 C 47,70 55,70 61,64_M 40,64" stroke="#111111" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* 2. PINK BUBBLE (Subtle upper middle-right) */}
          <motion.div
            id="bubble_pink"
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            whileHover={{ scale: 1.15 }}
            className="absolute left-[44%] top-[10%] w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-[#ffd5ee] to-[#f472b6] border-[1.5px] border-[#111111] shadow-sm z-10 cursor-pointer overflow-hidden flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] shrink-0">
              {/* Vertical line lashes */}
              <line x1="38" y1="36" x2="38" y2="52" stroke="#111111" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="62" y1="36" x2="62" y2="52" stroke="#111111" strokeWidth="5.5" strokeLinecap="round" />
              {/* Little dot mouth */}
              <circle cx="50" cy="70" r="5" fill="#111111" />
            </svg>
          </motion.div>

          {/* 3. CORAL BUBBLE (Right-top) */}
          <motion.div
            id="bubble_coral"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
            whileHover={{ scale: 1.08, rotate: 4 }}
            className="absolute left-[65%] top-[14%] w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-br from-[#ffbfa9] to-[#f96f5b] border-[1.5px] border-[#111111] shadow-md z-10 cursor-pointer overflow-hidden flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] shrink-0">
              {/* Curly hair strand */}
              <path d="M 52,10 C 62,-2 82,2 72,18 C 67,24 75,27 82,30" stroke="#111111" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Eyes */}
              <path d="M 28,44 C 32,38 38,38 42,44" stroke="#111111" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M 58,44 C 62,38 68,38 72,44" stroke="#111111" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              {/* laughing open mouth */}
              <path d="M 38,58 C 38,71 62,71 62,58 Z" fill="#111111" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
              {/* Teeth stroke */}
              <path d="M 44,59 C 48,61 52,61 56,59" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* SPEECH BUBBLE "Hello~" */}
          <motion.div
            id="hello_speech_pill"
            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute left-[44%] top-[39%] -translate-x-1/2 bg-black text-white px-4 py-1.5 rounded-2xl text-[12px] font-bold shadow-lg flex items-center justify-center font-sans tracking-tight z-20"
          >
            <span>Hello~</span>
            {/* Notch pointing left */}
            <span className="absolute -bottom-1 left-4 w-2.5 h-2.5 bg-black rotate-45 transform" />
          </motion.div>

          {/* 4. BLUE BUBBLE (Left-bottom, staring mischievously right) */}
          <motion.div
            id="bubble_blue"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.2 }}
            whileHover={{ scale: 1.07, rotate: -2 }}
            className="absolute left-[11%] top-[51%] w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#a6e0ff] to-[#3ca3ff] border-[1.5px] border-[#111111] shadow-lg z-10 cursor-pointer overflow-hidden flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] shrink-0">
              {/* Curved Eyebrows */}
              <path d="M 22,32 C 30,26 40,28 45,34" stroke="#111111" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M 55,30 C 65,30 72,34 78,40" stroke="#111111" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* White Eyeballs */}
              <ellipse cx="36" cy="48" rx="14" ry="16" fill="white" stroke="#111111" strokeWidth="3.5" />
              <ellipse cx="66" cy="52" rx="14" ry="16" fill="white" stroke="#111111" strokeWidth="3.5" />
              {/* Pupils shifted right */}
              <circle cx="43" cy="48" r="6" fill="#111111" />
              <circle cx="73" cy="52" r="6" fill="#111111" />
              {/* Confident side smile */}
              <path d="M 40,68 C 47,72 58,71 64,63" stroke="#111111" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* 5. YELLOW BUBBLE (Right-bottom, cute smiling up left) */}
          <motion.div
            id="bubble_yellow"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut", delay: 0.8 }}
            whileHover={{ scale: 1.06, rotate: 3 }}
            className="absolute left-[58%] top-[49%] w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#ffee93] to-[#fbc326] border-[1.5px] border-[#111111] shadow-lg z-10 cursor-pointer overflow-hidden flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] shrink-0">
              {/* Hair loops */}
              <path d="M 50,14 C 45,2 30,4 40,18 C 45,24 55,20 60,18" stroke="#111111" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              {/* Eyebrows */}
              <path d="M 28,38 C 34,34 40,36 44,41" stroke="#111111" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 56,38 C 62,34 68,36 72,41" stroke="#111111" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* White Eyeballs */}
              <ellipse cx="38" cy="54" rx="12" ry="14" fill="white" stroke="#111111" strokeWidth="3" />
              <ellipse cx="66" cy="54" rx="12" ry="14" fill="white" stroke="#111111" strokeWidth="3" />
              {/* Pupils looking up-left */}
              <circle cx="34" cy="50" r="5" fill="#111111" />
              <circle cx="62" cy="50" r="5" fill="#111111" />
              {/* Grin */}
              <path d="M 45,72 C 55,72 65,68 68,60" stroke="#111111" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </svg>
          </motion.div>

          {/* 6. ORANGE BUBBLE WITH SPECTACLES (Bottom-center) */}
          <motion.div
            id="bubble_orange"
            animate={{ y: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1.2 }}
            whileHover={{ scale: 1.15 }}
            className="absolute left-[44%] top-[69%] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#ffd5ab] to-[#fb923c] border-[1.5px] border-[#111111] shadow-md z-10 cursor-pointer overflow-hidden flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] shrink-0">
              {/* Spectacles circles */}
              <circle cx="35" cy="50" r="14" fill="none" stroke="#111111" strokeWidth="4.5" />
              <circle cx="65" cy="50" r="14" fill="none" stroke="#111111" strokeWidth="4.5" />
              {/* Spectacles bridge */}
              <path d="M 49,50 L 51,50" stroke="#111111" strokeWidth="4.5" strokeLinecap="round" />
              {/* Tiny eyes */}
              <circle cx="35" cy="50" r="3" fill="#111111" />
              <circle cx="65" cy="50" r="3" fill="#111111" />
              {/* Little surprised o mouth */}
              <circle cx="50" cy="74" r="4" fill="#111111" />
            </svg>
          </motion.div>

        </div>

        {/* Action Form Footer */}
        <div className="px-7 pb-6 select-none z-10 text-center shrink-0">
          
          <p id="pitch_title" className="text-[13.5px] font-semibold text-[#80807C] tracking-tight mb-4 select-none font-sans">
            Sign in to get started
          </p>

          <div className="space-y-3 max-w-[340px] mx-auto">
            {/* Google OAuth Login Button */}
            <motion.button
              type="button"
              id="google_signin_btn"
              onClick={handleGoogleOAuth}
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#FFFFFF] hover:bg-slate-50 text-black font-bold py-3 px-6 rounded-full border-[1.5px] border-[#E9E9EB] shadow-xs flex items-center justify-center gap-2.5 transition-all text-xs cursor-pointer select-none disabled:opacity-75"
            >
              {isLoading && !error ? (
                <span className="border-2 border-[#111111]/20 border-t-[#111111] rounded-full w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.14-5.136 4.14-3.41 0-6.173-2.784-6.173-6.225s2.763-6.226 6.173-6.226c1.55 0 2.96.568 4.05 1.503l3.056-3.055C19.123 2.115 15.935 1 12.24 1 6.13 1 1.135 6 1.135 12.16s4.996 11.16 11.105 11.16c6.07 0 10.99-4.8 10.99-11.16 0-.6-.051-1.2-.162-1.875H12.24z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </motion.button>

            {/* Apple OAuth Login Button */}
            <motion.button
              type="button"
              id="apple_signin_btn"
              onClick={() => handleDemoBypass("Apple")}
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-black hover:bg-zinc-900 text-white font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2.5 transition-all text-xs cursor-pointer select-none disabled:opacity-75"
            >
              <svg className="w-4.5 h-4.5 fill-current text-white shrink-0 mb-[1.5px]" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
              </svg>
              <span>Sign in with Apple</span>
            </motion.button>
          </div>

          {/* Custom Error & Helper Status Overlay panels */}
          <div className="min-h-[46px] mt-4 flex items-center justify-center px-2">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-100 rounded-xl p-2.5 text-[11px] font-medium text-red-600 flex items-start space-x-1.5 text-left w-full max-w-[340px]"
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
                  className="bg-[#2a7dfa]/5 border border-[#2a7dfa]/10 rounded-xl p-2.5 text-[10.5px] font-medium text-[#2a7dfa] flex items-start space-x-1.5 text-left w-full max-w-[340px]"
                >
                  <Info className="w-3.5 h-3.5 text-[#2a7dfa] shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </motion.div>
              )}

              {!error && !infoMessage && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  className="text-[9px] text-[#A0A09B] font-medium leading-normal block max-w-[280px]"
                >
                  Al ingresar con Google o Apple autorizas el acceso seguro a tu caja fuerte de transcripción de olli.
                </motion.span>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* iPhone screen bottom bar indicator */}
        <div className="w-full pb-2.5 pt-1 flex justify-center items-center shrink-0 z-10 select-none">
          <div className="w-32 h-[4.5px] bg-[#111111] rounded-full" />
        </div>

      </motion.div>
    </div>
  );
}
