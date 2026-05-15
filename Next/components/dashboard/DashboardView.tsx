'use client'
import { Users, Eye, Building2, TrendingUp, UserCheck, UserX, MousePointerClick } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const statusLabels: Record<string, string> = {
  new: "Nya",
  contacted: "Kontaktade",
  viewing: "Visning",
  negotiating: "Förhandling",
  won: "Vunna",
  lost: "Förlorade",
};

const statusColors: Record<string, string> = {
  new: "hsl(43, 96%, 56%)",
  contacted: "hsl(217, 91%, 60%)",
  viewing: "hsl(270, 67%, 58%)",
  negotiating: "hsl(226, 70%, 55%)",
  won: "hsl(160, 84%, 39%)",
  lost: "hsl(215, 16%, 47%)",
};

export function DashboardView() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <section className="flex-1 px-4 md:px-8 py-6">
        <div className="text-muted-foreground">Laddar statistik...</div>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="flex-1 px-4 md:px-8 py-6">
        <div className="text-muted-foreground">Kunde inte ladda statistik.</div>
      </section>
    );
  }

  const pieData = stats.leadsByStatus.map((item) => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
    color: statusColors[item.status] || "hsl(215, 16%, 47%)",
  }));

  return (
    <section className="flex-1 px-4 md:px-8 py-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-medium text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Översikt av din verksamhet</p>
      </div>

      {/* KPI Cards - stacked on mobile, 2 cols on tablet, 5 cols on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 md:mb-8">
        <Link to="/app/leads">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Totalt antal leads</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalLeads}</p>
              </div>
              <div className="p-2 md:p-3 bg-primary/10 rounded-full">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.newLeads} nya leads att hantera
            </p>
          </div>
        </Link>

        <Link to="/app/leads?status=won">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Konverteringsgrad</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stats.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 md:p-3 bg-status-won-bg rounded-full">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-status-won-text" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.wonLeads} vunna av {stats.wonLeads + stats.lostLeads} avslutade
            </p>
          </div>
        </Link>

        <Link to="/app/lokaler">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Visningar</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalViews}</p>
              </div>
              <div className="p-2 md:p-3 bg-status-contacted-bg rounded-full">
                <Eye className="w-5 h-5 md:w-6 md:h-6 text-status-contacted-text" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Totalt antal sidvisningar
            </p>
          </div>
        </Link>

        <Link to="/app/lokaler">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Kontaktintresse</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalReveals}</p>
              </div>
              <div className="p-2 md:p-3 bg-primary/10 rounded-full">
                <MousePointerClick className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.emailReveals} e-post · {stats.phoneReveals} telefon
            </p>
          </div>
        </Link>

        <Link to="/app/lokaler">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Publicerade objekt</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stats.publishedListings}/{stats.totalListings}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-status-viewing-bg rounded-full">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-status-viewing-text" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Aktiva annonser
            </p>
          </div>
        </Link>
      </div>

      {/* Charts Row - stacked on mobile, 2 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Views per month */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">
            Visningar per månad
          </h2>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.viewsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by status */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">
            Leads per status
          </h2>
          <div className="h-48 md:h-64 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Ingen data att visa</p>
            )}
          </div>
        </div>
      </div>

      {/* Leads trend */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">
          Leads per månad
        </h2>
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.leadsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick stats - stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Link to="/app/leads?status=won">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98]">
            <div className="p-2 bg-status-won-bg rounded-full">
              <UserCheck className="w-5 h-5 text-status-won-text" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Vunna leads</p>
              <p className="text-lg md:text-xl font-semibold text-foreground">{stats.wonLeads}</p>
            </div>
          </div>
        </Link>

        <Link to="/app/leads?status=lost">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98]">
            <div className="p-2 bg-status-lost-bg rounded-full">
              <UserX className="w-5 h-5 text-status-lost-text" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Förlorade leads</p>
              <p className="text-lg md:text-xl font-semibold text-foreground">{stats.lostLeads}</p>
            </div>
          </div>
        </Link>

        <Link to="/app/leads?status=new">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98]">
            <div className="p-2 bg-status-new-bg rounded-full">
              <Users className="w-5 h-5 text-status-new-text" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Leads att hantera</p>
              <p className="text-lg md:text-xl font-semibold text-foreground">
                {stats.totalLeads - stats.wonLeads - stats.lostLeads}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
