import { useState, useMemo, useEffect } from "react";
import { AlertTriangle, ShieldAlert, Activity, CheckCircle, ArrowLeft } from "lucide-react";
import { StatCard, Select, Button, Badge, Table, type TableColumn, AssetDetailsView } from "@/components";
import { telemetryApi, type DeviceHealthLabel, type TelemetrySummary, type Asset } from "@/lib/api";

export default function MonitoringPage() {
  const [filterRiskLevel, setFilterRiskLevel] = useState("all");
  const [labels, setLabels] = useState<DeviceHealthLabel[]>([]);
  const [summary, setSummary] = useState<TelemetrySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLabel, setSelectedLabel] = useState<any | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      telemetryApi.getLabels(),
      telemetryApi.getSummary()
    ])
      .then(([labelsData, summaryData]) => {
        setLabels(labelsData);
        setSummary(summaryData);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredLabels = useMemo(() => {
    return labels.filter((label) => {
      const riskMatch = filterRiskLevel === "all" || label.risk_level === filterRiskLevel;
      return riskMatch;
    });
  }, [filterRiskLevel, labels]);

  const handleResetFilters = () => {
    setFilterRiskLevel("all");
  };

  const assetTableColumns: TableColumn<any>[] = [
    { key: "asset_tag", label: "Asset Tag", sortable: true, width: "15%" },
    {
      key: "model_name",
      label: "Asset Model",
      sortable: true,
      width: "20%",
      render: (_, row) => <span>{row.brand} {row.model_name}</span>
    },
    {
      key: "risk_score",
      label: "Risk Score",
      sortable: true,
      width: "10%",
      render: (val) => <span className="font-semibold">{val}</span>
    },
    {
      key: "risk_level",
      label: "Risk Level",
      width: "15%",
      render: (value) => {
        const variantMap: Record<string, "active" | "inactive" | "warning" | "critical"> = {
          Critical: "critical",
          'At Risk': "warning",
          Watch: "warning",
          Healthy: "active",
        };
        return (
          <Badge variant={variantMap[value] || "inactive"}>
            {value}
          </Badge>
        );
      },
    },
    {
      key: "triggered_rules",
      label: "Issues Detected",
      width: "25%",
      render: (rules: any[]) => {
        if (!rules || rules.length === 0) return <span className="text-neutral-600">None</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {rules.slice(0, 2).map((r: any, idx) => (
              <span key={idx} className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-0.5 rounded-full" title={r.note}>
                {r.label}
              </span>
            ))}
            {rules.length > 2 && (
              <span className="bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full">
                +{rules.length - 2} more
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: "scored_at",
      label: "Last Synced",
      width: "15%",
      render: (val) => {
        const date = new Date(val);
        return <span className="text-sm text-neutral-600">{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      }
    },
  ];

  if (selectedLabel) {
    const assetObj: Asset = {
      id: selectedLabel.asset_id || 9999,
      tag: selectedLabel.asset_tag,
      partNum: 'N/A',
      etat: selectedLabel.risk_level === 'Critical' ? 'inMaintenance' : 'Available',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      modele: { 
        nom: selectedLabel.model_name || 'Unknown', 
        marque: selectedLabel.brand || 'Unknown', 
        categorie: 'Computer' 
      },
      employee: null
    };

    return (
      <div className="space-y-6">
        <AssetDetailsView 
          asset={assetObj} 
          onBack={() => setSelectedLabel(null)} 
          defaultTab="health"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Intelligent Telemetry Monitoring
        </h1>
        <p className="text-neutral-600 text-sm">
          Real-time hardware health analysis from local prediction agents.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Total Monitored"
          value={summary?.total_monitored || 0}
          icon={<Activity />}
        />
        <StatCard
          label="Healthy"
          value={summary?.healthy || 0}
          icon={<CheckCircle />}
        />
        <StatCard
          label="At Risk"
          value={summary?.at_risk || 0}
          icon={<AlertTriangle />}
        />
        <StatCard
          label="Critical"
          value={summary?.critical || 0}
          icon={<ShieldAlert />}
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-300 rounded-xl p-6 shadow-lg space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-0 md:max-w-[250px]">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Risk Level
            </label>
            <Select
              id="risk-filter"
              value={filterRiskLevel}
              onChange={(e) => setFilterRiskLevel(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Healthy">Healthy</option>
              <option value="Watch">Watch</option>
              <option value="At Risk">At Risk</option>
              <option value="Critical">Critical</option>
            </Select>
          </div>
          <Button variant="ghost" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Flagged Assets Table */}
      <div className="bg-white border border-neutral-300 rounded-xl p-6 shadow-lg space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Monitored Devices ({filteredLabels.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <Table<any>
            columns={assetTableColumns}
            rows={filteredLabels}
            rowKey="id"
            loading={isLoading}
            hoverable
            onRowClick={(row) => setSelectedLabel(row)}
          />
        </div>
      </div>

    </div>
  );
}
