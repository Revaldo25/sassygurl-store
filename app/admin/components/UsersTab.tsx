import { useState, useTransition, useEffect } from "react";
import { getUsersAction, updateUserRoleAction, toggleUserBanAction } from "@/app/actions/dashboard";
import { motion } from "framer-motion";
import { Search, ShieldAlert, UserCheck, Shield, Ban } from "lucide-react";

export default function UsersTab({ role }: { role?: string }) {
  const currentUserRole = role?.toUpperCase() || "";
  const isOwner = currentUserRole === "OWNER";
  const isSuperAdmin = currentUserRole === "SUPERADMIN";
  const isCSOrFinance = currentUserRole === "CS" || currentUserRole === "FINANCE";

  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchUsers = () => {
    startTransition(async () => {
      const { users, total } = await getUsersAction(search);
      setUsers(users);
      setTotalUsers(total);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = (id: string, role: string) => {
    if (!confirm(`Change role to ${role}?`)) return;
    startTransition(async () => {
      await updateUserRoleAction(id, role);
      fetchUsers();
    });
  };

  const handleToggleBan = (id: string, isBanned: boolean) => {
    if (!confirm(isBanned ? "Ban this user?" : "Unban this user?")) return;
    startTransition(async () => {
      await toggleUserBanAction(id, isBanned);
      fetchUsers();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          User Management 
          {totalUsers > 0 && (
            <span className="text-sm font-normal text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              {totalUsers} Users
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-pink-500 w-64"
            />
          </div>
          <button 
            onClick={fetchUsers}
            disabled={isPending}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
          >
            {isPending ? "Loading..." : "Search"}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Balance</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-white">{user.name || "Unknown"}</div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <select 
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      disabled={isPending || isCSOrFinance || user.role === "OWNER" || (user.role === "SUPERADMIN" && !isOwner)}
                      className="bg-zinc-900 border border-zinc-700 rounded p-1 text-xs outline-none"
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="RESELLER">RESELLER</option>
                      <option value="VIP">VIP</option>
                      <option value="CS">CS</option>
                      <option value="FINANCE">FINANCE</option>
                      {(isOwner || user.role === "SUPERADMIN") && <option value="SUPERADMIN">SUPERADMIN</option>}
                      {(isOwner || user.role === "OWNER") && <option value="OWNER">OWNER</option>}
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="text-pink-400 font-mono">
                      Rp {user.balance?.toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="p-4">
                    {user.isBanned ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-medium">
                        <Ban className="w-3 h-3" /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        <UserCheck className="w-3 h-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {(() => {
                      if (user.role === "OWNER") return null;
                      if (currentUserRole === "CS" && ["CS", "FINANCE", "SUPERADMIN"].includes(user.role)) return null;
                      if (currentUserRole === "SUPERADMIN" && user.role === "SUPERADMIN") return null;

                      return (
                        <button
                          onClick={() => handleToggleBan(user.id, !user.isBanned)}
                          disabled={isPending}
                          className={`text-xs px-3 py-1 rounded border transition-colors ${
                            user.isBanned 
                              ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" 
                              : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                          }`}
                        >
                          {user.isBanned ? "Unban" : "Ban User"}
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
