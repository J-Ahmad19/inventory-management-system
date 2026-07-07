"use client";

import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Alert } from "@/lib/types";

const severityConfig = {
  info: { icon: Info, variant: "info" as const, color: "text-blue-400" },
  warning: { icon: AlertTriangle, variant: "warning" as const, color: "text-amber-400" },
  critical: { icon: XCircle, variant: "danger" as const, color: "text-red-400" },
};

interface AlertsFeedProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
  compact?: boolean;
}

export function AlertsFeed({ alerts, onAcknowledge, compact = false }: AlertsFeedProps) {
  const displayAlerts = compact ? alerts.slice(0, 5) : alerts;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {compact ? "Recent Alerts" : "All Alerts"}
        </CardTitle>
        {!compact && (
          <Badge variant="danger">
            {alerts.filter((a) => !a.acknowledged).length} active
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {displayAlerts.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-slate-500">
            <CheckCircle className="mb-2 h-8 w-8 text-emerald-500" />
            <p className="text-sm">No alerts — all systems normal</p>
          </div>
        ) : (
          displayAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={`flex gap-3 rounded-lg border p-3 transition-colors ${
                  alert.acknowledged
                    ? "border-slate-800/50 bg-slate-900/30 opacity-60"
                    : "border-slate-800 bg-slate-900/50 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {alert.title}
                    </p>
                    <Badge variant={config.variant} className="shrink-0 text-[10px]">
                      {alert.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{alert.message}</p>
                  <p className="mt-1 text-[10px] text-slate-600">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                {!alert.acknowledged && onAcknowledge && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="shrink-0 rounded-md px-2 py-1 text-[10px] text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
