"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  FileCheck2,
  GraduationCap,
  Calendar,
  X,
} from "lucide-react";

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  batchName: string;
  technology: string;
  status: "active" | "inactive";
  interviewsCompleted: number;
  averageScore: number;
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [techFilter, setTechFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([
    {
      id: "std-101",
      fullName: "Aarav Sharma",
      email: "aarav.sharma@linktest.io",
      phone: "+91 98765 43210",
      batchName: "Python Full Stack 2026-A",
      technology: "Python",
      status: "active",
      interviewsCompleted: 3,
      averageScore: 84,
    },
    {
      id: "std-102",
      fullName: "Pooja Iyer",
      email: "pooja.iyer@linktest.io",
      phone: "+91 98765 43211",
      batchName: "Java Enterprise Systems 2026-B",
      technology: "Java",
      status: "active",
      interviewsCompleted: 4,
      averageScore: 89,
    },
    {
      id: "std-103",
      fullName: "Rohan Verma",
      email: "rohan.verma@linktest.io",
      phone: "+91 98765 43212",
      batchName: "DSA & Systems Placement Track",
      technology: "DSA",
      status: "active",
      interviewsCompleted: 2,
      averageScore: 72,
    },
    {
      id: "std-104",
      fullName: "Ananya Deshmukh",
      email: "ananya.d@linktest.io",
      phone: "+91 98765 43213",
      batchName: "Python Full Stack 2026-A",
      technology: "Python",
      status: "active",
      interviewsCompleted: 3,
      averageScore: 91,
    },
    {
      id: "std-105",
      fullName: "Vikram Malhotra",
      email: "vikram.m@linktest.io",
      phone: "+91 98765 43214",
      batchName: "Java Enterprise Systems 2026-B",
      technology: "Java",
      status: "active",
      interviewsCompleted: 1,
      averageScore: 68,
    },
  ]);

  const [newStudent, setNewStudent] = useState({
    fullName: "",
    email: "",
    phone: "",
    batchName: "Python Full Stack 2026-A",
    technology: "Python",
  });

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.fullName || !newStudent.email) return;

    const student: Student = {
      id: `std-${Date.now().toString().slice(-3)}`,
      fullName: newStudent.fullName,
      email: newStudent.email,
      phone: newStudent.phone || "+91 99999 88888",
      batchName: newStudent.batchName,
      technology: newStudent.technology,
      status: "active",
      interviewsCompleted: 0,
      averageScore: 0,
    };

    setStudents([student, ...students]);
    setModalOpen(false);
    setNewStudent({
      fullName: "",
      email: "",
      phone: "",
      batchName: "Python Full Stack 2026-A",
      technology: "Python",
    });
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.batchName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTech = techFilter === "all" || s.technology.toLowerCase() === techFilter.toLowerCase();
    return matchesSearch && matchesTech;
  });

  return (
    <AppShell role="admin" userName="Rahul Sir (Founder & Admin)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                STUDENT ROSTER
              </span>
              <span className="text-xs text-[#64748B]">• Institute Candidate Registry</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Candidate & Student Management
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Manage candidate profiles, batch assignments, interview participation, and performance benchmarks.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Candidate</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="card p-4 bg-white border border-[#E2E8F0] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by candidate name, email, or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Technology:</span>
            </div>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="form-select text-xs py-2 px-3"
            >
              <option value="all">All Technologies</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="dsa">DSA</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="card p-0 overflow-hidden bg-white border border-[#E2E8F0]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">CANDIDATE</th>
                  <th className="py-3 px-4">BATCH & TECH</th>
                  <th className="py-3 px-4">CONTACT</th>
                  <th className="py-3 px-4 text-center">INTERVIEWS</th>
                  <th className="py-3 px-4 text-center">AVG SCORE</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F172A]">{s.fullName}</div>
                      <div className="text-xs text-[#64748B]">ID: {s.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{s.batchName}</div>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        {s.technology}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-slate-700">{s.email}</div>
                      <div className="text-xs text-slate-500">{s.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {s.interviewsCompleted}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {s.averageScore > 0 ? (
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                          {s.averageScore}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="badge badge-success text-[11px]">Active</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          alert(`Candidate Profile: ${s.fullName}\nEmail: ${s.email}\nBatch: ${s.batchName}\nInterviews: ${s.interviewsCompleted}\nAverage Score: ${s.averageScore}%`);
                        }}
                        className="btn btn-outline btn-sm text-xs py-1 px-3"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Student Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <h3 className="text-lg font-bold text-[#0F172A] m-0">Add New Candidate</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4 pt-4">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.fullName}
                    onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                    placeholder="e.g. Siddharth Joshi"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="e.g. siddharth@linktest.io"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Technology & Batch Track</label>
                  <select
                    value={newStudent.batchName}
                    onChange={(e) => {
                      const batch = e.target.value;
                      const tech = batch.includes("Python") ? "Python" : batch.includes("Java") ? "Java" : "DSA";
                      setNewStudent({ ...newStudent, batchName: batch, technology: tech });
                    }}
                    className="form-select"
                  >
                    <option value="Python Full Stack 2026-A">Python Full Stack 2026-A</option>
                    <option value="Java Enterprise Systems 2026-B">Java Enterprise Systems 2026-B</option>
                    <option value="DSA & Systems Placement Track">DSA & Systems Placement Track</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary text-xs">
                    Save Candidate
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
