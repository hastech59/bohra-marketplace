"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, PauseCircle, PlayCircle, Search } from "lucide-react";
import { adminApi } from "@/lib/api";
import { getStatusColor } from "@/lib/utils";
import type { VendorProfile } from "@/types";
import toast from "react-hot-toast";

type Tab = "pending" | "approved" | "suspended" | "rejected";

export default function AdminVendorsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [searchQ, setSearchQ] = useState("");
  const [rejectModal, setRejectModal] = useState<{ vendorId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const qc = useQueryClient();

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-vendors", activeTab],
    queryFn: () => adminApi.getVendors(activeTab).then((r) => r.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ vendorId, action, reason }: { vendorId: string; action: string; reason?: string }) =>
      adminApi.vendorAction(vendorId, { action, rejection_reason: reason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(`Vendor ${vars.action}d`);
      setRejectModal(null);
      setRejectReason("");
    },
    onError: () => toast.error("Action failed"),
  });

  const filtered = vendors?.filter((v: Record<string, unknown>) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return (
      (v.business_name as string)?.toLowerCase().includes(q) ||
      (v.profiles as Record<string, string>)?.email?.toLowerCase().includes(q) ||
      (v.city as string)?.toLowerCase().includes(q)
    );
  });

  const TABS: Tab[] = ["pending", "approved", "suspended", "rejected"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Vendor Management</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="input pl-9 text-sm"
          placeholder="Search vendors…"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Owner</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">City</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="skeleton h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No vendors found
                </td>
              </tr>
            ) : (
              filtered?.map((vendor: Record<string, unknown>) => (
                <tr key={vendor.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{vendor.business_name as string}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{(vendor.profiles as Record<string, string>)?.full_name}</div>
                    <div className="text-xs text-gray-400">{(vendor.profiles as Record<string, string>)?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{vendor.business_type as string}</td>
                  <td className="px-4 py-3 text-gray-600">{vendor.city as string}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusColor(vendor.approval_status as string)}`}>
                      {vendor.approval_status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {vendor.approval_status === "pending" && (
                        <>
                          <button
                            onClick={() => actionMutation.mutate({ vendorId: vendor.id as string, action: "approve" })}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => setRejectModal({ vendorId: vendor.id as string, name: vendor.business_name as string })}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {vendor.approval_status === "approved" && (
                        <button
                          onClick={() => actionMutation.mutate({ vendorId: vendor.id as string, action: "suspend" })}
                          className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg"
                          title="Suspend"
                        >
                          <PauseCircle size={16} />
                        </button>
                      )}
                      {vendor.approval_status === "suspended" && (
                        <button
                          onClick={() => actionMutation.mutate({ vendorId: vendor.id as string, action: "unsuspend" })}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Unsuspend"
                        >
                          <PlayCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-2">Reject Vendor</h3>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting <strong>{rejectModal.name}</strong>. Please provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input resize-none mb-4"
              rows={3}
              placeholder="Reason for rejection…"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  actionMutation.mutate({
                    vendorId: rejectModal.vendorId,
                    action: "reject",
                    reason: rejectReason,
                  })
                }
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
