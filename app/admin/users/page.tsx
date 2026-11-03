"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Calendar,
  X,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Award,
  RefreshCw,
} from "lucide-react";

interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  role: "super_admin" | "trainer" | "student";
  status: "active" | "suspended";
  batchCode?: string;
  joinedAt: string;
}

const AVAILABLE_BATCHES = [
  { code: "PY-2026-A", name: "Python Full Stack 2026-A" },
  { code: "JV-2026-B", name: "Java Enterprise Systems 2026-B" },
  { code: "DSA-2026-P", name: "DSA & Systems Placement Track" },
  { code: "MERN-2026-C", name: "Full Stack Web Cohort C" },
  { code: "GLOBAL", name: "Open Institutional Roster" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    fullName: "",
    email: "",
    batchCode: "PY-2026-A",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Users from Backend
  const loadUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const url = new URL("/api/admin/users", window.location.origin);
      if (roleFilter !== "all") url.searchParams.set("role", roleFilter);
      if (searchTerm) url.searchParams.set("search", searchTerm);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [roleFilter, searchTerm]);

  useEffect(() => {
    loadUsers();
    // Auto-poll every 3 seconds to instantly detect when a new student signs in
    const interval = setInterval(() => {
      loadUsers(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadUsers]);

  // Promote Student to Trainer
  const handlePromoteToTrainer = async (user: PlatformUser) => {
    if (!confirm(`Are you sure you want to promote ${user.fullName} (${user.email}) to Faculty Trainer?`)) return;

    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "promote_to_trainer",
          batchCodes: [user.batchCode || "GLOBAL"],
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({
          type: "success",
          text: `Successfully promoted ${user.fullName} to Faculty Trainer! They can now access the Trainer Portal.`,
        });
        await loadUsers();
      } else {
        setStatusMsg({ type: "error", text: json.error || "Failed to promote user." });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error occurred." });
    }
  };

  // Demote Trainer back to Student
  const handleDemoteToStudent = async (user: PlatformUser) => {
    if (!confirm(`Demote ${user.fullName} back to Student?`)) return;

    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "demote_to_student",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({
          type: "success",
          text: `Successfully demoted ${user.fullName} back to Student.`,
        });
        await loadUsers();
      } else {
        setStatusMsg({ type: "error", text: json.error || "Failed to demote user." });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error occurred." });
    }
  };

  // Assign / Change Batch
  const handleBatchChange = async (userId: string, newBatchCode: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "update_batch",
          batchCode: newBatchCode,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, batchCode: newBatchCode } : u))
        );
        setStatusMsg({ type: "success", text: `Cohort batch updated to ${newBatchCode}` });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Failed to update cohort batch." });
    }
  };

  // Add New Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.email.trim()) return;

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newStudent.fullName.trim() || newStudent.email.split("@")[0],
          email: newStudent.email.trim().toLowerCase(),
          role: "student",
          batchCode: newStudent.batchCode,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({
          type: "success",
          text: `Student ${newStudent.email} registered successfully. They will log in as a Student.`,
        });
        setModalOpen(false);
        setNewStudent({ fullName: "", email: "", batchCode: "PY-2026-A" });
        await loadUsers();
      } else {
        setStatusMsg({ type: "error", text: json.error || "Failed to create student." });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell role="admin" userName="Rahul Sir (Admin)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-slate-500">• User Governance & Role Authorization</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight m-0">
              User Management & Role Permissions
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Manage all registered Google and institute users. Assign student batches and promote students to Faculty Trainers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Auto-Sync (3s)</span>
            </span>

            <button
              onClick={() => loadUsers(false)}
              className="btn btn-outline text-xs py-2 px-3 font-bold flex items-center gap-1.5"
              title="Refresh Roster"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5 shadow-sm bg-gradient-to-tr from-purple-700 to-indigo-700 text-white"
            >
              <Plus size={15} />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert size={16} className="text-red-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-700">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Role Governance Rules Alert Box */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-extrabold text-orange-400 text-xs uppercase tracking-wider block">
              🛡️ Strict Role Boundary Enforced
            </span>
            <p className="text-slate-300 m-0 leading-relaxed">
              Every person logging in via Google strictly joins as a <strong>Student</strong>. Only the Super Administrator has authorization to promote a student to <strong>Trainer</strong> or assign batches.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold text-[11px]">
              Default: Student
            </span>
            <span className="px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold text-[11px]">
              Admin-Controlled
            </span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="card p-4 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Roles</option>
              <option value="student">Students Only</option>
              <option value="trainer">Trainers Only</option>
              <option value="super_admin">Administrators</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Total Roster: <strong>{users.length} Users</strong>
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="card bg-white border border-[#E2E8F0] shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Assigned Batch / Cohort</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Role Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No users found. Any user who signs in with Google will automatically appear here as a Student.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isAdmin = user.role === "super_admin";
                    const isTrainer = user.role === "trainer";
                    const isStudent = user.role === "student";

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 leading-tight">
                                {user.fullName}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isAdmin ? (
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                              SUPER ADMIN
                            </span>
                          ) : isTrainer ? (
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              FACULTY TRAINER
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              STUDENT
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {isAdmin ? (
                            <span className="text-slate-400 font-mono text-[11px]">Institution Global</span>
                          ) : (
                            <select
                              value={user.batchCode || "GLOBAL"}
                              onChange={(e) => handleBatchChange(user.id, e.target.value)}
                              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:border-slate-300 focus:outline-none focus:border-purple-600"
                            >
                              {AVAILABLE_BATCHES.map((b) => (
                                <option key={b.code} value={b.code}>
                                  {b.name} ({b.code})
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              user.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isAdmin ? (
                            <span className="text-slate-400 text-[11px] font-medium">Protected Admin</span>
                          ) : isStudent ? (
                            <button
                              type="button"
                              onClick={() => handlePromoteToTrainer(user)}
                              className="btn btn-primary text-[11px] py-1 px-3 font-bold flex items-center gap-1.5 ml-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              title="Promote Student to Faculty Trainer"
                            >
                              <GraduationCap size={13} />
                              <span>Promote to Trainer</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDemoteToStudent(user)}
                              className="btn btn-outline text-[11px] py-1 px-3 font-bold flex items-center gap-1.5 ml-auto text-amber-700 hover:bg-amber-50 border-amber-300"
                              title="Demote Trainer back to Student"
                            >
                              <UserCheck size={13} />
                              <span>Demote to Student</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD STUDENT MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Plus size={18} />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 m-0">
                    Add New Student to Roster
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Candidate Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newStudent.fullName}
                    onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Candidate Email Address: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@gmail.com"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Initial Batch Assignment:
                  </label>
                  <select
                    value={newStudent.batchCode}
                    onChange={(e) => setNewStudent({ ...newStudent, batchCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  >
                    {AVAILABLE_BATCHES.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  Candidate will be registered with the default <strong>Student</strong> role. You can promote them to Faculty Trainer anytime from the roster table.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-outline text-xs py-2 px-4 font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary text-xs py-2 px-5 font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? "Registering..." : "Add Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
