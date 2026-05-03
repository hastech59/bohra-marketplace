"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserCog } from "lucide-react";
import { adminApi } from "@/lib/api";
import { getStatusColor } from "@/lib/utils";
import type { Profile } from "@/types";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const [searchQ, setSearchQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleModal, setRoleModal] = useState<{ userId: string; name: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState("");
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", searchQ, roleFilter],
    queryFn: () =>
      adminApi.getUsers({ q: searchQ || undefined, role: roleFilter || undefined }).then((r) => r.data as Profile[]),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.changeUserRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated");
      setRoleModal(null);
    },
    onError: () => toast.error("Failed to update role"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">User Management</h1>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="input pl-9 text-sm"
            placeholder="Search by name or email…"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input w-40 text-sm"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="vendor">Vendor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">City</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="skeleton h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users found</td>
              </tr>
            ) : (
              users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{user.city || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      user.role === "admin" ? "bg-purple-100 text-purple-700" :
                      user.role === "vendor" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setRoleModal({ userId: user.id, name: user.full_name, currentRole: user.role });
                        setNewRole(user.role);
                      }}
                      className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
                      title="Change role"
                    >
                      <UserCog size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Role change modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-2">Change Role</h3>
            <p className="text-sm text-gray-500 mb-4">
              Changing role for <strong>{roleModal.name}</strong>
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="input mb-4"
            >
              <option value="user">User</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setRoleModal(null)} className="btn-outline flex-1">Cancel</button>
              <button
                onClick={() => roleMutation.mutate({ userId: roleModal.userId, role: newRole })}
                disabled={newRole === roleModal.currentRole}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
