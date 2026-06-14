/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { User, Meeting } from "../types";
import {
  Home,
  MessageSquare,
  Compass,
  Cpu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  Download,
  Flame,
  LogOut,
  FolderHeart,
  Settings
} from "lucide-react";

interface SidebarProps {
  user: User;
  activeTab: "dashboard" | "recorder" | "meetings" | "settings" | "integrations";
  setActiveTab: (tab: "dashboard" | "recorder" | "meetings" | "settings" | "integrations") => void;
  onLogout: () => void;
  favoritesCount: number;
  meetings: Meeting[];
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  favoritesCount,
  meetings,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const displayName = user.displayName || "Carla Acha";
  const userEmail = user.email || "carlita.ai19.20@gmail.com";

  const navItems = [
    {
      id: "dashboard" as const,
      label: "Home",
      icon: Home,
    },
    {
      id: "recorder" as const,
      label: "Olli AI Chat",
      icon: MessageSquare,
    },
    {
      id: "meetings" as const,
      label: "Explore",
      icon: Compass,
    },
    {
      id: "integrations" as const,
      label: "Integrations",
      icon: Cpu,
    },
    {
      id: "settings" as const,
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      id="workspace_sidebar"
      className={`bg-white border-r border-[#EBEBEB] flex flex-col justify-between h-screen fixed top-0 left-0 z-20 max-md:hidden select-none font-sans transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 w-6 h-6 bg-white border border-[#EBEBEB] rounded-full shadow-md flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-55 transition-all cursor-pointer z-30 focus:outline-none"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className="flex flex-col flex-grow overflow-y-auto">
        
        {/* Brand Header */}
        <div className={`py-4 pb-2 flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-5"}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-1.5 cursor-pointer">
                <div className="flex items-center justify-center gap-0.5">
                  <span className="w-2.5 h-6 rounded-full bg-[#135bf1]" />
                  <span className="w-2.5 h-4 rounded-full bg-[#135bf1]/60" />
                  <span className="w-2.5 h-5 rounded-full bg-[#135bf1]/80" />
                </div>
                <span className="font-bold text-[22px] tracking-tight text-[#111111] font-sans flex items-center ml-0.5 select-none">
                  olli<span className="text-[#135bf1] ml-[1px]">.</span>
                </span>
              </div>
              
              <button className="p-1.5 hover:bg-slate-55 rounded-full text-[#333333] hover:bg-[#F4F4F5] transition-colors relative">
                <Bell className="w-5 h-5 text-slate-700" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#FF4D4F]" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-0.5 cursor-pointer py-1.5">
              <span className="w-2 h-5 rounded-full bg-[#135bf1]" />
              <span className="w-2 h-3.5 rounded-full bg-[#135bf1]/60" />
              <span className="w-2 h-4.5 rounded-full bg-[#135bf1]/80" />
            </div>
          )}
        </div>

        {/* Profile Card Switcher */}
        <div className={`mb-2 ${isCollapsed ? "px-2 flex justify-center" : "px-3"}`}>
          {isCollapsed ? (
            <div className="w-9 h-9 rounded-full bg-[#F5F2EB] border border-[#E2E0D8] overflow-hidden flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 select-none cursor-pointer hover:bg-[#F4F4F5]/60 transition-colors" title={displayName}>
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl border border-[#E9E9EB] hover:bg-[#F4F4F5]/60 transition-colors flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#F5F2EB] border border-[#E2E0D8] overflow-hidden flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 select-none">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-grow min-w-0 text-left">
                  <p className="text-sm font-bold text-[#111111] truncate leading-tight select-none">{displayName}</p>
                  <p className="text-[11px] text-[#666666] truncate mt-0.5 select-none">{userEmail}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className={`space-y-[2px] mb-6 ${isCollapsed ? "px-2" : "px-3"}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center transition-all cursor-pointer group relative ${
                  isCollapsed ? "justify-center p-2.5 rounded-xl" : "gap-3 px-3 py-2.5 rounded-xl text-left"
                } ${
                  isActive
                    ? "text-[#135bf1] bg-[#135bf1]/8 font-bold"
                    : "text-slate-650 hover:bg-[#F4F4F5] hover:text-[#111111]"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] transition-transform group-hover:scale-105 ${
                    isActive ? "text-[#135bf1]" : "text-slate-500"
                  }`}
                />
                {!isCollapsed && <span className="flex-grow text-sm font-semibold">{item.label}</span>}
                {!isCollapsed && item.id === "meetings" && favoritesCount > 0 && (
                  <span className="bg-[#135bf1]/12 text-[#135bf1] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                    <FolderHeart className="w-3 h-3 mr-0.5" />
                    {favoritesCount}
                  </span>
                )}
                {isCollapsed && item.id === "meetings" && favoritesCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#135bf1] border border-white" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Channels Section */}
        {!isCollapsed && (
          <div className="px-3 mb-6">
            <div className="flex items-center justify-between px-3 mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
              <span>Channels</span>
              <span className="cursor-pointer hover:text-slate-600">+</span>
            </div>
            <button className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer block">
              # General
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className={`space-y-2 border-t border-[#F2F2F2] ${isCollapsed ? "p-2" : "p-3"}`}>
        {!isCollapsed && (
          <div className="bg-[#FAF9F6] rounded-2xl p-3 border border-[#E9E9EB] relative overflow-hidden text-left">
            <p className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Olli Workspace
            </p>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Open-source meeting minutes engine & offline-first private secure chest.
            </p>
          </div>
        )}

        <button
          onClick={onLogout}
          title={isCollapsed ? "Exit Account" : undefined}
          className={`w-full flex items-center text-rose-500 hover:bg-rose-50/60 font-semibold transition-colors cursor-pointer group mt-1 ${
            isCollapsed ? "justify-center p-2.5 rounded-xl" : "gap-2.5 px-3 py-2 rounded-xl text-xs text-left"
          }`}
        >
          <LogOut className="w-4 h-4 text-rose-450 group-hover:translate-x-0.5 transition-transform shrink-0" />
          {!isCollapsed && <span>Exit Account</span>}
        </button>
      </div>
    </aside>
  );
}
