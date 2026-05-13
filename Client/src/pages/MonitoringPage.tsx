import { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  ListChecks,
} from "lucide-react";
import { StatCard, Select, Button, Badge, Table, type TableColumn } from "@/components";
import { dashboardApi, type FlaggedAsset } from "@/lib/api";

export default function MonitoringPage() {
  const [filterRiskLevel, setFilterRiskLevel] = useState("all");
  const [filterRule, setFilterRule] = useState("all");
  const [flaggedAssets, setFlaggedAssets] = useState<FlaggedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hardcoded rules logic to toggle them on and off locally for the UI showcase
  const [rules, setRules] = useState([
    {
      id: "1",
      name: "Age > 3 years",
      condition: "Asset age exceeds 3 years",
      severity: "critical",
      enabled: true,
    },
    {
      id: "2",
      name: "Age > 2 years",
      condition: "Asset age exceeds 2 years",
      severity: "high",
      enabled: true,
    },
    {
      id: "3",
      name: "Age > 1 year",
      condition: "Asset age exceeds 1 year",
      severity: "medium",
      enabled: true,
    },
    {
      id: "4",
      name: "Currently in maintenance",
      condition: "Asset is currently undergoing maintenance",
      severity: "high",
      enabled: true,
    },
  ]);

  useEffect(() => {
    dashboardApi.getSummary()
      .then((data) => {
        setFlaggedAssets(data.flaggedAssets || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggleRule = (ruleId: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  // Filter out assets if their corresponding rule is toggled off
  const enabledFlaggedAssets = useMemo(() => {
    return flaggedAssets.filter(asset => {
      const correspondingRule = rules.find(r => r.name === asset.rule);
      return correspondingRule ? correspondingRule.enabled : true;
    });
  }, [flaggedAssets, rules]);

  const filteredAssets = useMemo(() => {
    return enabledFlaggedAssets.filter((asset) => {
      const riskMatch = filterRiskLevel === "all" || asset.riskLevel === filterRiskLevel;
      const ruleMatch = filterRule === "all" || asset.rule === filterRule;
      return riskMatch && ruleMatch;
    });
  }, [filterRiskLevel, filterRule, enabledFlaggedAssets]);

  const handleResetFilters = () => {
    setFilterRiskLevel("all");
    setFilterRule("all");
  };

  const assetTableColumns: TableColumn<FlaggedAsset>[] = [
    { key: "assetTag", label: "Asset Tag", sortable: true, width: "15%" },
    { key: "assetName", label: "Asset Model", sortable: true, width: "20%" },
    { key: "category", label: "Category", width: "15%" },
    { key: "rule", label: "Rule Triggered", width: "20%" },
    {
      key: "riskLevel",
      label: "Risk Level",
      width: "15%",
      render: (value) => {
        const variantMap: Record<string, "active" | "inactive" | "warning" | "critical" | "maintenance"> = {
          critical: "critical",
          high: "warning",
          medium: "warning",
          low: "active",
        };
        return (
          <Badge variant={variantMap[value] || "inactive"}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: "ageDays",
      label: "Age (Days)",
      width: "15%",
      render: (value) => <span>{value} days</span>,
    },
  ];

  const getRiskBadgeVariant = (
    level: string
  ): "active" | "inactive" | "warning" | "critical" | "maintenance" => {
    switch (level) {
      case "critical": return "critical";
      case "high": return "warning";
      case "medium": return "warning";
      case "low": return "active";
      default: return "inactive";
    }
  };

  const totalFlaggedAssets = enabledFlaggedAssets.length;
  const criticalCount = enabledFlaggedAssets.filter((a) => a.riskLevel === "critical").length;
  const activeRulesCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Monitoring
        </h1>
        <p className="text-neutral-500 text-sm">
          System monitoring and proactive maintenance alerts.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Flagged Assets"
          value={totalFlaggedAssets}
          icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
        />
        <StatCard
          label="Critical Risk"
          value={criticalCount}
          icon={<ShieldAlert className="h-6 w-6 text-red-500" />}
        />
        <StatCard
          label="Rules Active"
          value={activeRulesCount}
          icon={<ListChecks className="h-6 w-6 text-blue-500" />}
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Risk Level
            </label>
            <Select
              id="risk-filter"
              value={filterRiskLevel}
              onChange={(e) => setFilterRiskLevel(e.target.value)}
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </Select>
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Rule
            </label>
            <Select
              id="rule-filter"
              value={filterRule}
              onChange={(e) => setFilterRule(e.target.value)}
            >
              <option value="all">All</option>
              {rules.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </Select>
          </div>
          <Button variant="ghost" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Flagged Assets Table */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Flagged Assets ({filteredAssets.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <Table<FlaggedAsset>
            columns={assetTableColumns}
            rows={filteredAssets}
            rowKey="id"
            loading={isLoading}
            hoverable
          />
        </div>
      </div>

      {/* Active Rules */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Active Maintenance Rules
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => {
            const flaggedCount = flaggedAssets.filter(a => a.rule === rule.name).length;
            
            return (
              <div
                key={rule.id}
                className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-900">{rule.name}</h3>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">{rule.condition}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                  <div className="text-sm">
                    <span className="font-semibold text-neutral-900">
                      {flaggedCount}
                    </span>
                    <span className="text-neutral-600"> assets flagged</span>
                  </div>
                  <Badge variant={getRiskBadgeVariant(rule.severity)}>
                    {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
