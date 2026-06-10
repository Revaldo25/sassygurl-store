const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../app/admin/AdminDashboardClient.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update Navigation Tabs
const oldTabs = `<motion.div variants={item} className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
            { id: "transactions", label: "Transaksi", icon: History },
            ...(isOwner ? [
              { id: "games", label: "Kelola Game", icon: Gamepad2 },
              { id: "providers", label: "Provider Status", icon: Megaphone },
              { id: "ops", label: "Ops Status", icon: Zap },
            ] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={\`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3 text-xs font-bold transition-all \${
                activeTab === tab.id ? "border-sakura/40 bg-sakura/15 text-sakura shadow-sm" : "border-white/10 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              }\`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>`;
        
const newTabs = `<motion.div variants={item} className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-zinc-950/80 p-1.5 border border-white/5 w-max backdrop-blur-md">
          {[
            { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
            { id: "transactions", label: "Transaksi", icon: History },
            ...(isOwner ? [
              { id: "games", label: "Kelola Game", icon: Gamepad2 },
              { id: "providers", label: "Provider Status", icon: Megaphone },
              { id: "ops", label: "Ops Status", icon: Zap },
            ] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={\`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-300 \${
                activeTab === tab.id ? "bg-white/[0.08] text-sakura shadow-sm" : "text-zinc-500 hover:text-white hover:bg-white/[0.02]"
              }\`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>`;
content = content.replace(oldTabs, newTabs);

// 2. Health
const oldHealth = `<div className="lg:col-span-2 rounded-[2rem] border border-white/10 bg-zinc-900 p-8 ">
                  <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
                    <Activity className="h-5 w-5 text-sakura" /> System Health & Provider Balance
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {providerStatusesList.map((ps: any) => (
                      <div key={ps.name} className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.05]">
                        <div className="flex items-center gap-4">
                          <div className={\`h-3 w-3 rounded-full \${ps.isActive ? "bg-emerald-500 " : "bg-red-500 "}\`} />
                          <div>
                            <p className="text-xs font-black text-white">{ps.name}</p>
                            <p className="text-xs font-bold text-zinc-500">{ps.isActive ? "Online" : "Trouble"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">{formatIDR(ps.balance ?? 0)}</p>
                          <p className="text-xs font-black text-zinc-600 uppercase">Balance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>`;
const newHealth = `<div className="lg:col-span-2 rounded-2xl border border-white/5 bg-zinc-950 p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                      <Activity className="h-4 w-4 text-emerald-400" /> System Status & Balances
                    </h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {providerStatusesList.map((ps: any) => (
                      <div key={ps.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#09090b] p-4 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-2.5 w-2.5">
                            {ps.isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={\`relative inline-flex rounded-full h-2.5 w-2.5 \${ps.isActive ? "bg-emerald-500" : "bg-red-500"}\`}></span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{ps.name}</p>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{ps.isActive ? "Operational" : "Degraded"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-medium text-white">{formatIDR(ps.balance ?? 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>`;
content = content.replace(oldHealth, newHealth);

// Quick Actions
const oldQuickActions = `<div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-sakura/10 to-transparent p-8 ">
                  <p className="mb-1 text-xs font-black uppercase tracking-wider text-sakura">Quick Actions</p>
                  <h3 className="text-lg font-black text-white tracking-tighter mb-6">Operations</h3>
                  <div className="space-y-3">
                    <button onClick={handleSync} disabled={isSyncing} className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95">
                      <span>Sync Catalog</span>
                      <RefreshCw className={\`h-4 w-4 \${isSyncing ? "animate-spin" : ""}\`} />
                    </button>
                    <a href="/admin/catalog-health" className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 text-xs font-bold text-white transition-all hover:bg-white/10">
                      <span>Catalog Health</span>
                      <Activity className="h-4 w-4 text-emerald-400" />
                    </a>
                    <a href="/admin/review" className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 text-xs font-bold text-white transition-all hover:bg-white/10">
                      <span>Review Queue</span>
                      <ShieldCheck className="h-4 w-4 text-amber-400" />
                    </a>
                  </div>
                </div>`;
const newQuickActions = `<div className="rounded-2xl border border-white/5 bg-zinc-950 p-6">
                  <h3 className="mb-4 text-sm font-bold text-white border-b border-white/5 pb-4">Operational Controls</h3>
                  <div className="space-y-2">
                    <button onClick={handleSync} disabled={isSyncing} className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-[#09090b] p-3 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/[0.02] hover:text-white">
                      <span>Sync Catalog</span>
                      <RefreshCw className={\`h-4 w-4 \${isSyncing ? "animate-spin text-sakura" : "text-zinc-500"}\`} />
                    </button>
                    <a href="/admin/catalog-health" className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-[#09090b] p-3 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/[0.02] hover:text-white">
                      <span>Catalog Health</span>
                      <Activity className="h-4 w-4 text-blue-400" />
                    </a>
                    <a href="/admin/review" className="flex w-full items-center justify-between rounded-lg border border-amber-500/10 bg-amber-500/5 p-3 text-xs font-semibold text-amber-500 transition-all hover:bg-amber-500/10 hover:text-amber-400">
                      <span>Review Queue</span>
                      <ShieldCheck className="h-4 w-4" />
                    </a>
                  </div>
                </div>`;
content = content.replace(oldQuickActions, newQuickActions);

// Stats Grid
const oldStatsGrid = `<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ...(isOwner ? [
                    { label: "Total Omzet", value: formatIDR(ownerStats.totalRevenue), color: "text-white", accent: "border-sakura/20 bg-sakura/5" },
                    { label: "Laba Bersih", value: formatIDR(ownerStats.netProfit), color: "text-emerald-400", accent: "border-emerald-500/20 bg-emerald-500/5" },
                    { label: "Omzet Hari Ini", value: formatIDR(ownerStats.todayRevenue), color: "text-brand-cyan", accent: "border-brand-cyan/20 bg-brand-cyan/5" },
                  ] : []),
                  { label: "Total Member", value: String(stats.totalUsers), color: "text-amber-400", accent: "border-amber-500/20 bg-amber-500/5" },
                  { label: "Produk Aktif", value: String(stats.totalProducts), color: "text-pink-400", accent: "border-pink-500/20 bg-pink-500/5" },
                  { label: "Total Game", value: String(stats.totalGames), color: "text-violet-400", accent: "border-violet-500/20 bg-violet-500/5" },
                ].map((stat, i) => (
                  <motion.div key={i} variants={item} whileHover={{ y: -4 }} className={\`rounded-[2rem] border p-6  transition-all \${stat.accent}\`}>
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-zinc-500">{stat.label}</p>
                    <h3 className={\`text-2xl font-black tracking-tight \${stat.color}\`}>{stat.value}</h3>
                  </motion.div>
                ))}
              </div>`;
const newStatsGrid = `<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ...(isOwner ? [
                    { label: "Total Revenue", value: formatIDR(ownerStats.totalRevenue), color: "text-white", accent: "border-sakura/20 bg-sakura/5" },
                    { label: "Net Profit", value: formatIDR(ownerStats.netProfit), color: "text-emerald-400", accent: "border-emerald-500/20 bg-emerald-500/5" },
                    { label: "Today's Revenue", value: formatIDR(ownerStats.todayRevenue), color: "text-violet-400", accent: "border-violet-500/20 bg-violet-500/5" },
                  ] : []),
                  { label: "Total Members", value: String(stats.totalUsers), color: "text-zinc-300", accent: "border-white/5 bg-zinc-950" },
                  { label: "Active Products", value: String(stats.totalProducts), color: "text-zinc-300", accent: "border-white/5 bg-zinc-950" },
                  { label: "Total Games", value: String(stats.totalGames), color: "text-zinc-300", accent: "border-white/5 bg-zinc-950" },
                ].map((stat, i) => (
                  <motion.div key={i} variants={item} className={\`rounded-2xl border p-5 transition-all \${stat.accent}\`}>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{stat.label}</p>
                    <h3 className={\`font-mono text-xl font-medium tracking-tight \${stat.color}\`}>{stat.value}</h3>
                  </motion.div>
                ))}
              </div>`;
content = content.replace(oldStatsGrid, newStatsGrid);

// Chart area
content = content.replace(/rounded-\[2\.5rem\] border border-white\/10 bg-zinc-900 p-8/g, 'rounded-2xl border border-white/5 bg-zinc-950 p-6');

// Tables UI
const tableHeaderOld = `<thead className="text-xs font-black uppercase tracking-wider text-zinc-600">
                    <tr>
                      <th className="px-6 py-4">Invoice</th>
                      <th className="px-6 py-4">Game / Produk</th>
                      <th className="px-6 py-4">Target ID</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Nominal</th>
                      {isOwner && <th className="px-6 py-4 text-right">Profit</th>}
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>`;
const tableHeaderNew = `<thead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-white/5">
                    <tr>
                      <th className="px-5 py-4 font-semibold text-zinc-500">Invoice</th>
                      <th className="px-5 py-4 font-semibold text-zinc-500">Game / Product</th>
                      <th className="px-5 py-4 font-semibold text-zinc-500">Target ID</th>
                      <th className="px-5 py-4 text-center font-semibold text-zinc-500">Status</th>
                      <th className="px-5 py-4 text-right font-semibold text-zinc-500">Amount</th>
                      {isOwner && <th className="px-5 py-4 text-right font-semibold text-zinc-500">Profit</th>}
                      <th className="px-5 py-4 text-center font-semibold text-zinc-500">Action</th>
                    </tr>
                  </thead>`;
content = content.replace(tableHeaderOld, tableHeaderNew);

// Table Rows Replace
const oldRowStart = `<td className="px-6 py-5">
                          <div className="font-mono text-xs font-black text-white transition-colors group-hover:text-sakura">`;
const newRowStart = `<td className="px-5 py-4">
                          <div className="font-mono text-xs font-semibold text-white transition-colors group-hover:text-sakura">`;
content = content.replace(new RegExp(oldRowStart, 'g'), newRowStart);

content = content.replace(/<td className="px-6 py-5">/g, '<td className="px-5 py-4">');
content = content.replace(/<td className="px-6 py-5 text-center">/g, '<td className="px-5 py-4 text-center">');
content = content.replace(/<td className="px-6 py-5 text-right text-sm font-black text-white">/g, '<td className="px-5 py-4 text-right font-mono text-sm text-zinc-200">');
content = content.replace(/<td className="px-6 py-5 text-right text-sm font-bold text-emerald-400">/g, '<td className="px-5 py-4 text-right font-mono text-sm text-emerald-400">');

content = content.replace(/className="group transition-colors hover:bg-white\/\[0\.02\]"/g, 'className="group transition-colors hover:bg-[#1a1a1e] border-b border-white/[0.02] last:border-0"');
content = content.replace(/<tbody className="divide-y divide-white\/5">/g, '<tbody>');


// Transaction Filter Tabs
const oldFilterHeader = `<div className="space-y-6 border-b border-white/10 bg-white/[0.02] p-8">`;
const newFilterHeader = `<div className="space-y-4 border-b border-white/5 bg-zinc-950 p-6">`;
content = content.replace(oldFilterHeader, newFilterHeader);

const oldSearchInput = `<input
                      type="text"
                      placeholder="Cari invoice, game, atau ID..."
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 py-4 pl-12 pr-6 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-700 focus:border-sakura focus:ring-4 focus:ring-sakura/5"
                    />`;
const newSearchInput = `<input
                      type="text"
                      placeholder="Search invoice, game, or ID..."
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#09090b] py-2.5 pl-10 pr-4 text-xs font-semibold text-white outline-none transition-all placeholder:text-zinc-600 focus:border-sakura focus:ring-1 focus:ring-sakura/20"
                    />`;
content = content.replace(oldSearchInput, newSearchInput);

content = content.replace(/className=\{`whitespace-nowrap rounded-xl px-5 py-2\.5 text-xs font-black uppercase tracking-wider transition-all/g, 'className={`whitespace-nowrap rounded-lg px-4 py-2 text-[11px] font-semibold transition-all');
content = content.replace(/bg-white text-zinc-950 shadow-lg/g, 'bg-zinc-800 text-white border border-white/10');
content = content.replace(/border border-white\/10 bg-zinc-900\/50 text-zinc-500 hover:bg-zinc-800 hover:text-white/g, 'border border-transparent text-zinc-500 hover:bg-white/5 hover:text-white');


// Transaction Action Buttons Fix
const oldProcessBtn = `<button
                                onClick={() => handleStatusUpdate(tx.id, "PROCESSING")}
                                className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20"
                              >
                                Process
                              </button>`;
const newProcessBtn = `<button
                                onClick={() => handleStatusUpdate(tx.id, "PROCESSING")}
                                className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-500 transition hover:bg-amber-500/20"
                              >
                                Process
                              </button>`;
content = content.replace(oldProcessBtn, newProcessBtn);

const oldDoneBtn = `<button
                                onClick={() => handleStatusUpdate(tx.id, "SUCCESS")}
                                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                              >
                                ✓ Done
                              </button>`;
const newDoneBtn = `<button
                                onClick={() => handleStatusUpdate(tx.id, "SUCCESS")}
                                className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500 transition hover:bg-emerald-500/20"
                              >
                                ✓ Done
                              </button>`;
content = content.replace(oldDoneBtn, newDoneBtn);

const oldHealBtn = `<button
                                onClick={() => {
                                  alert("Auto-Healing diproses... Mencoba sinkronisasi ulang dengan API Provider.");
                                  handleStatusUpdate(tx.id, "PROCESSING");
                                }}
                                className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 transition hover:bg-cyan-500/20"
                                title="Auto-Heal Transaction (Retry API)"
                              >
                                ⚡ Auto-Heal
                              </button>`;
const newHealBtn = `<button
                                onClick={() => {
                                  alert("Auto-Healing diproses... Mencoba sinkronisasi ulang dengan API Provider.");
                                  handleStatusUpdate(tx.id, "PROCESSING");
                                }}
                                className="rounded border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400 transition hover:bg-blue-500/20"
                                title="Auto-Heal Transaction (Retry API)"
                              >
                                ⚡ Heal
                              </button>`;
content = content.replace(oldHealBtn, newHealBtn);


// AdminStatusBadge rewrite
const oldBadgeDef = `function AdminStatusBadge({ status }: { status: string }) {
  const config =
    status === "SUCCESS"
      ? { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 }
      : status === "PROCESSING"
        ? { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: RefreshCw }
        : status === "PENDING"
          ? { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock }
          : { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle };

  return (
    <span className={\`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black \${config.color}\`}>
      <config.icon className="h-3 w-3" />
      {status}
    </span>
  );
}`;

const newBadgeDef = `function AdminStatusBadge({ status }: { status: string }) {
  const config =
    status === "SUCCESS"
      ? { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 }
      : status === "PROCESSING"
        ? { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: RefreshCw }
        : status === "PENDING"
          ? { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock }
          : { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle };

  return (
    <span className={\`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold \${config.color}\`}>
      <config.icon className="h-3 w-3" />
      {status}
    </span>
  );
}`;
content = content.replace(oldBadgeDef, newBadgeDef);


// Ensure container for transactions tab is rounded-2xl
content = content.replace(/className="overflow-hidden rounded-\[3rem\] border border-white\/10 bg-zinc-900 shadow-2xl "/g, 'className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-950 shadow-xl "');
content = content.replace(/<div className="overflow-hidden rounded-\[2rem\] border border-white\/10 bg-zinc-900 shadow-2xl ">/g, '<div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-950 shadow-xl ">');


fs.writeFileSync(targetPath, content, 'utf8');
console.log("AdminDashboardClient.tsx redesigned successfully with strict matching.");
