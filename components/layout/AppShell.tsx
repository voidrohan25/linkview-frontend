"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Sparkles,
  HelpCircle,
  FileQuestion,
  BarChart3,
  Settings,
  CalendarPlus,
  CheckCircle2,
  Video,
  Mic,
  FileText,
  Award,
  FileCheck2,
  TrendingUp,
  Target,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
  Zap,
} from "lucide-react";

export type Role = "admin" | "trainer" | "student" | "super_admin";
export type NormalizedRole = "admin" | "trainer" | "student";

interface AppShellProps {
  children: React.ReactNode;
  role: Role;
  userName?: string;
  userEmail?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  groupTitle?: string;
  items: NavItem[];
}

export function AppShell({
  children,
  role: inputRole,
  userName,
  userEmail,
}: AppShellProps) {
  const role: NormalizedRole = inputRole === "super_admin" ? "admin" : inputRole;
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, logout: authLogout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authoritatively derive display user from global AuthContext with props fallback
  const activeUser = {
    name:
      authUser?.fullName ||
      userName ||
      (role === "admin"
        ? "Administrator"
        : role === "trainer"
        ? "Faculty Trainer"
        : "Candidate"),
    email:
      authUser?.email ||
      userEmail ||
      (role === "admin"
        ? "admin@linktest.io"
        : role === "trainer"
        ? "trainer@linktest.io"
        : "candidate@linktest.io"),
  };

  const handleLogout = async () => {
    await authLogout();
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`linktest_${role}_sidebar_collapsed`);
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {}
  }, [role]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(`linktest_${role}_sidebar_collapsed`, String(next));
    } catch {}
  };

  const navGroups: Record<NormalizedRole, NavGroup[]> = {
    admin: [
      {
        groupTitle: "CONSOLE & OVERVIEW",
        items: [
          { label: "Admin Console", href: "/admin/dashboard", icon: LayoutDashboard },
          { label: "Student Roster", href: "/admin/users", icon: Users },
          { label: "Faculty & Trainers", href: "/admin/trainers", icon: GraduationCap },
          { label: "Batches & Cohorts", href: "/admin/batches", icon: BookOpen },
        ],
      },
      {
        groupTitle: "INTERVIEWS & CURRICULUM",
        items: [
          { label: "Interview Programs", href: "/admin/interviews", icon: Sparkles, badge: "AI" },
          { label: "Question Bank", href: "/admin/question-bank", icon: FileQuestion },
          { label: "Institutional Reports", href: "/admin/reports", icon: BarChart3 },
        ],
      },
      {
        groupTitle: "SYSTEM SETTINGS",
        items: [
          { label: "AI & System Settings", href: "/admin/settings", icon: Settings },
        ],
      },
    ],
    trainer: [
      {
        groupTitle: "TRAINER STUDIO",
        items: [
          { label: "Trainer Studio", href: "/trainer/dashboard", icon: LayoutDashboard },
          { label: "Schedule AI Mock", href: "/trainer/schedule", icon: CalendarPlus, badge: "NEW" },
          { label: "Import Questions", href: "/trainer/import-questions", icon: FileQuestion, badge: "NEW" },
          { label: "Evaluation Queue", href: "/trainer/approvals", icon: CheckCircle2 },
        ],
      },
      {
        groupTitle: "COHORTS & CANDIDATES",
        items: [
          { label: "Assigned Batches", href: "/trainer/batches", icon: BookOpen },
          { label: "Assigned Students", href: "/trainer/students", icon: UserCheck },
          { label: "Conduct Live Mock", href: "/trainer/conduct", icon: Video },
        ],
      },
      {
        groupTitle: "EVALUATIONS & REPORTS",
        items: [
          { label: "Batch Scorecards", href: "/trainer/reports", icon: FileText },
        ],
      },
    ],
    student: [
      {
        groupTitle: "CANDIDATE PORTAL",
        items: [
          { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
          { label: "My Interviews", href: "/student/interviews", icon: Sparkles, badge: "AI" },
          { label: "Voice Interview Room", href: "/student/interview/active", icon: Mic },
        ],
      },
      {
        groupTitle: "PRACTICE & REPORTS",
        items: [
          { label: "Practice", href: "/student/practice", icon: BookOpen },
          { label: "My Reports", href: "/student/results", icon: FileCheck2 },
          { label: "Profile", href: "/student/profile", icon: Users },
        ],
      },
    ],
  };

  const currentGroups = navGroups[role] || [];

  const roleLabels: Record<NormalizedRole, { title: string; color: string; bg: string; border: string }> = {
    admin: { title: "ADMIN CONSOLE", color: "#991B1B", bg: "#FEF2F2", border: "#FECACA" },
    trainer: { title: "FACULTY / TRAINER", color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE" },
    student: { title: "STUDENT PORTAL", color: "#C2410C", bg: "#FFEDD5", border: "#FED7AA" },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* LinkTest Top Bar (64px) */}
      <header className="h-16 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 text-white">
        {/* Brand Logo & Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md hover:bg-slate-800 text-slate-300"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center font-extrabold text-white text-base shadow-md">
              L
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-none">
                Link<span className="text-[#F97316]">Test</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                AI MOCK INTERVIEW
              </span>
            </div>
          </Link>

          <span
            className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded"
            style={{
              color: roleLabels[role].color,
              background: roleLabels[role].bg,
              border: `1px solid ${roleLabels[role].border}`,
            }}
          >
            {roleLabels[role].title}
          </span>
        </div>

        {/* Center Session Notice */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Academic Session 2026-27</span>
          <span className="text-slate-600">·</span>
          <span>Timezone: Asia/Kolkata (IST)</span>
        </div>

        {/* Right Role Badge & Authenticated Profile */}
        <div className="flex items-center gap-3">
          {/* Verified Active Portal Badge */}
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
            style={{
              color: roleLabels[role].color,
              background: roleLabels[role].bg,
              border: `1px solid ${roleLabels[role].border}`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: roleLabels[role].color }}
            />
            <span>{roleLabels[role].title}</span>
          </div>

          {/* Real User Profile & Logout */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-700">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#EA580C] to-[#F97316] border border-orange-400/40 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {activeUser.name ? activeUser.name.slice(0, 2).toUpperCase() : "ME"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-100 leading-tight truncate max-w-[150px]">
                {activeUser.name}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                {activeUser.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container with Sidebar and Content */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)]">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-[#0F172A] border-r border-[#1E293B] transition-all duration-200 sticky top-16 h-[calc(100vh-64px)] z-30 ${
            collapsed ? "w-[68px]" : "w-[250px]"
          }`}
        >
          {/* Collapse Toggle Bar */}
          <div className="p-3 border-b border-[#1E293B] flex items-center justify-between">
            {!collapsed && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-2">
                Navigation
              </span>
            )}
            <button
              onClick={toggleCollapsed}
              className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
                collapsed ? "mx-auto" : "ml-auto"
              }`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
            {currentGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!collapsed && group.groupTitle && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    {group.groupTitle}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link ${isActive ? "active" : ""} ${
                        collapsed ? "justify-center px-0 py-2.5" : ""
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={17} className="flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Sidebar Status */}
          <div className="p-3 border-t border-[#1E293B] text-[11px] text-slate-400">
            {!collapsed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-300">AI Engine Online</span>
                </div>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                  v2.6
                </span>
              </div>
            ) : (
              <div className="flex justify-center" title="AI Engine Online">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-[#0F172A]/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 bg-[#0F172A] h-full p-4 flex flex-col border-r border-[#1E293B]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white text-sm">
                    L
                  </div>
                  <span className="font-bold text-white">LinkTest AI</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-4">
                {currentGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    {group.groupTitle && (
                      <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        {group.groupTitle}
                      </div>
                    )}
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`sidebar-link ${isActive ? "active" : ""}`}
                        >
                          <Icon size={17} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Verified Session Info in Mobile Drawer */}
              <div className="pt-4 border-t border-[#1E293B] text-xs text-slate-400 flex items-center justify-between">
                <span>{roleLabels[role].title}</span>
                <button
                  onClick={handleLogout}
                  className="text-rose-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
export default AppShell;
