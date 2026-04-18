import { useState, useMemo } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  ListChecks,
  Eye,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "../components/ui/StatCard";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Table, type TableColumn } from "../components/ui/Table";
import { Checkbox } from "../components/ui/Checkbox";

interface FlaggedAsset {
  id: string;
  assetTag: string;
  assetName: string;
  category: string;
  ruleTriggered: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  daysSinceLastMaintenance: number;
  recommendedAction: string;
}

interface MaintenanceRule {
  id: string;
  name: string;
  condition: string;
  flaggedCount: number;
  severity: "critical" | "high" | "medium" | "low";
  enabled: boolean;
}

export default function PredictionsPage() {
  const [filterRiskLevel, setFilterRiskLevel] = useState("all");
  const [filterRule, setFilterRule] = useState("all");
  const [rules, setRules] = useState<MaintenanceRule[]>([
    {
      id: "1",
      name: "Age > 3 years",
      condition: "Asset age exceeds 3 years",
      flaggedCount: 12,
      severity: "critical",
      enabled: true,
    },
    {
      id: "2",
      name: "No maintenance in 12 months",
      condition: "Asset hasn't received maintenance in over 12 months",
      flaggedCount: 18,
      severity: "high",
      enabled: true,
    },
    {
      id: "3",
      name: "Battery health < 50%",
      condition: "Battery health falls below 50%",
      flaggedCount: 8,
      severity: "medium",
      enabled: true,
    },
    {
      id: "4",
      name: "Usage hours > 5000",
      condition: "Device has exceeded 5000 operating hours",
      flaggedCount: 5,
      severity: "medium",
      enabled: true,
    },
    {
      id: "5",
      name: "Inactive > 6 months",
      condition: "Asset has been inactive for more than 6 months",
      flaggedCount: 4,
      severity: "low",
      enabled: false,
    },
  ]);

  const flaggedAssets: FlaggedAsset[] = [
    {
      id: "1",
      assetTag: "TAG-001",
      assetName: "ThinkPad T14",
      category: "Laptop",
      ruleTriggered: "Age > 3 years",
      riskLevel: "critical",
      daysSinceLastMaintenance: 450,
      recommendedAction: "Schedule replacement",
    },
    {
      id: "2",
      assetTag: "MON-002",
      assetName: "UltraSharp 27",
      category: "Monitor",
      ruleTriggered: "No maintenance in 12 months",
      riskLevel: "high",
      daysSinceLastMaintenance: 380,
      recommendedAction: "Schedule preventive maintenance",
    },
    {
      id: "3",
      assetTag: "TAG-003",
      assetName: "Dell Desktop",
      category: "Desktop",
      ruleTriggered: "Usage hours > 5000",
      riskLevel: "medium",
      daysSinceLastMaintenance: 120,
      recommendedAction: "Monitor performance",
    },
    {
      id: "4",
      assetTag: "KBD-004",
      assetName: "Mechanical Keyboard",
      category: "Peripherals",
      ruleTriggered: "Age > 3 years",
      riskLevel: "high",
      daysSinceLastMaintenance: 200,
      recommendedAction: "Consider replacement",
    },
    {
      id: "5",
      assetTag: "TAG-005",
      assetName: "HP Printer",
      category: "Printer",
      ruleTriggered: "No maintenance in 12 months",
      riskLevel: "critical",
      daysSinceLastMaintenance: 420,
      recommendedAction: "Schedule toner replacement",
    },
    {
      id: "6",
      assetTag: "TAG-006",
      assetName: "MacBook Pro",
      category: "Laptop",
      ruleTriggered: "Battery health < 50%",
      riskLevel: "medium",
      daysSinceLastMaintenance: 90,
      recommendedAction: "Battery replacement recommended",
    },
    {
      id: "7",
      assetTag: "MON-007",
      assetName: "LG 34 Ultrawide",
      category: "Monitor",
      ruleTriggered: "Age > 3 years",
      riskLevel: "low",
      daysSinceLastMaintenance: 250,
      recommendedAction: "Monitor condition",
    },
    {
      id: "8",
      assetTag: "TAG-008",
      assetName: "Router Cisco",
      category: "Network",
      ruleTriggered: "Inactive > 6 months",
      riskLevel: "medium",
      daysSinceLastMaintenance: 300,
      recommendedAction: "Verify status",
    },
    {
      id: "9",
      assetTag: "TAG-009",
      assetName: "iPad Air",
      category: "Mobile",
      ruleTriggered: "No maintenance in 12 months",
      riskLevel: "high",
      daysSinceLastMaintenance: 365,
      recommendedAction: "Software update needed",
    },
    {
      id: "10",
      assetTag: "TAG-010",
      assetName: "Work Station",
      category: "Desktop",
      ruleTriggered: "Usage hours > 5000",
      riskLevel: "critical",
      daysSinceLastMaintenance: 200,
      recommendedAction: "Schedule comprehensive maintenance",
    },
    {
      id: "11",
      assetTag: "TAG-011",
      assetName: "USB Hub",
      category: "Peripherals",
      ruleTriggered: "Battery health < 50%",
      riskLevel: "low",
      daysSinceLastMaintenance: 80,
      recommendedAction: "No action required",
    },
  ];

  const filteredAssets = useMemo(() => {
    return flaggedAssets.filter((asset) => {
      const riskMatch =
        filterRiskLevel === "all" || asset.riskLevel === filterRiskLevel;
      const ruleMatch =
        filterRule === "all" || asset.ruleTriggered === filterRule;
      return riskMatch && ruleMatch;
    });
  }, [filterRiskLevel, filterRule]);

  const handleResetFilters = () => {
    setFilterRiskLevel("all");
    setFilterRule("all");
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const assetTableColumns: TableColumn<FlaggedAsset>[] = [
    {
      key: "assetTag",
      label: "Asset Tag",
      sortable: true,
      width: "12%",
    },
    {
      key: "assetName",
      label: "Asset Name",
      sortable: true,
      width: "18%",
    },
    {
      key: "category",
      label: "Category",
      width: "12%",
    },
    {
      key: "ruleTriggered",
      label: "Rule Triggered",
      width: "18%",
    },
    {
      key: "riskLevel",
      label: "Risk Level",
      width: "12%",
      render: (value) => {
        const variantMap: Record<
          string,
          "active" | "inactive" | "warning" | "critical" | "maintenance"
        > = {
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
      key: "daysSinceLastMaintenance",
      label: "Days Since Last Maintenance",
      width: "14%",
      render: (value) => <span>{value} days</span>,
    },
    {
      key: "recommendedAction",
      label: "Recommended Action",
      width: "18%",
    },
    {
      key: "id",
      label: "Actions",
      width: "8%",
      render: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary-dark"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const getRiskBadgeVariant = (
    level: "critical" | "high" | "medium" | "low"
  ): "active" | "inactive" | "warning" | "critical" | "maintenance" => {
    switch (level) {
      case "critical":
        return "critical";
      case "high":
        return "warning";
      case "medium":
        return "warning";
      case "low":
        return "active";
      default:
        return "inactive";
    }
  };

  const totalFlaggedAssets = flaggedAssets.length;
  const criticalCount = flaggedAssets.filter(
    (a) => a.riskLevel === "critical"
  ).length;
  const activeRulesCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="bg-red-50 min-h-screen p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Predictions
        </h1>
        <p className="text-gray-500">
          Rule-based maintenance alerts generated by the system
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Flagged Assets"
          value={totalFlaggedAssets}
          icon={<AlertTriangle className="h-6 w-6 text-orange-500" />}
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
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Level
            </label>
            <Select
              value={filterRiskLevel}
              onChange={(e) => setFilterRiskLevel(e.target.value)}
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule
            </label>
            <Select
              value={filterRule}
              onChange={(e) => setFilterRule(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Age > 3 years">Age &gt; 3 years</option>
              <option value="No maintenance in 12 months">
                No maintenance in 12 months
              </option>
              <option value="Battery health < 50%">Battery health &lt; 50%</option>
              <option value="Usage hours > 5000">Usage hours &gt; 5000</option>
              <option value="Inactive > 6 months">Inactive &gt; 6 months</option>
            </Select>
          </div>
          <Button variant="ghost" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Flagged Assets Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Flagged Assets ({filteredAssets.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <Table<FlaggedAsset>
            columns={assetTableColumns}
            rows={filteredAssets}
            rowKey="id"
            hoverable
          />
        </div>
      </div>

      {/* Active Rules */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Active Maintenance Rules
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{rule.condition}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleToggleRule(rule.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-semibold text-gray-900">
                    {rule.flaggedCount}
                  </span>
                  <span className="text-gray-600"> assets flagged</span>
                </div>
                <Badge variant={getRiskBadgeVariant(rule.severity)}>
                  {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
