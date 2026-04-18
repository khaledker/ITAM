import {
  Server,
  CheckCircle,
  Wrench,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, type TableColumn } from "../components/ui/Table";

interface RecentOperation {
  id: string;
  operationId: string;
  type: "Reception" | "Transfer" | "Affectation" | "Retour";
  assetTag: string;
  performedBy: string;
  date: string;
  status: "approved" | "pending" | "rejected";
}

interface MaintenancePrediction {
  id: string;
  assetTag: string;
  assetName: string;
  rule: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export default function DashboardPage() {
  const recentOperations: RecentOperation[] = [
    {
      id: "1",
      operationId: "OP-001",
      type: "Reception",
      assetTag: "TAG-001",
      performedBy: "Ali BELLOUT",
      date: "22/02/2026 11:30",
      status: "approved",
    },
    {
      id: "2",
      operationId: "OP-002",
      type: "Transfer",
      assetTag: "MON-002",
      performedBy: "Ouiza YALA",
      date: "22/02/2026 10:15",
      status: "pending",
    },
    {
      id: "3",
      operationId: "OP-003",
      type: "Affectation",
      assetTag: "TAG-003",
      performedBy: "Admin User",
      date: "21/02/2026 15:45",
      status: "approved",
    },
    {
      id: "4",
      operationId: "OP-004",
      type: "Retour",
      assetTag: "TAG-004",
      performedBy: "Ali BELLOUT",
      date: "21/02/2026 14:20",
      status: "rejected",
    },
    {
      id: "5",
      operationId: "OP-005",
      type: "Reception",
      assetTag: "TAG-005",
      performedBy: "Ouiza YALA",
      date: "20/02/2026 09:00",
      status: "approved",
    },
    {
      id: "6",
      operationId: "OP-006",
      type: "Affectation",
      assetTag: "MON-006",
      performedBy: "System",
      date: "20/02/2026 08:30",
      status: "pending",
    },
  ];

  const maintenancePredictions: MaintenancePrediction[] = [
    {
      id: "1",
      assetTag: "TAG-001",
      assetName: "ThinkPad T14",
      rule: "Age > 3 years",
      riskLevel: "critical",
    },
    {
      id: "2",
      assetTag: "MON-002",
      assetName: "UltraSharp 27",
      rule: "No maintenance in 12 months",
      riskLevel: "high",
    },
    {
      id: "3",
      assetTag: "TAG-003",
      assetName: "Dell Desktop",
      rule: "Battery health < 50%",
      riskLevel: "medium",
    },
    {
      id: "4",
      assetTag: "TAG-004",
      assetName: "HP Printer",
      rule: "Usage hours > 5000",
      riskLevel: "low",
    },
  ];

  const operationColumns: TableColumn<RecentOperation>[] = [
    {
      key: "operationId",
      label: "Operation ID",
      width: "15%",
    },
    {
      key: "type",
      label: "Type",
      width: "15%",
      render: (value) => {
        const typeVariantMap: Record<string, "active" | "inactive" | "warning" | "critical" | "maintenance"> = {
          Reception: "active",
          Transfer: "inactive",
          Affectation: "warning",
          Retour: "maintenance",
        };
        return (
          <Badge variant={typeVariantMap[value] || "inactive"}>
            {value}
          </Badge>
        );
      },
    },
    {
      key: "assetTag",
      label: "Asset Tag",
      width: "15%",
    },
    {
      key: "performedBy",
      label: "Performed By",
      width: "20%",
    },
    {
      key: "date",
      label: "Date",
      width: "18%",
    },
    {
      key: "status",
      label: "Status",
      width: "15%",
      render: (value) => {
        const statusVariantMap: Record<string, "active" | "inactive" | "warning" | "critical" | "maintenance"> = {
          approved: "active",
          pending: "warning",
          rejected: "critical",
        };
        return (
          <Badge variant={statusVariantMap[value] || "inactive"}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        );
      },
    },
  ];

  const getRiskBadgeVariant = (
    level: "low" | "medium" | "high" | "critical"
  ): "active" | "inactive" | "warning" | "critical" | "maintenance" => {
    switch (level) {
      case "low":
        return "active";
      case "medium":
        return "warning";
      case "high":
        return "critical";
      case "critical":
        return "critical";
      default:
        return "inactive";
    }
  };

  return (
    <div className="bg-red-50 min-h-screen p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-500">Welcome back, IT Operations</p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Assets"
          value="2,547"
          icon={<Server className="h-6 w-6 text-blue-500" />}
          trend={{ value: 4, direction: "up" }}
        />
        <StatCard
          label="Active Assets"
          value="1,893"
          icon={<CheckCircle className="h-6 w-6 text-green-500" />}
          trend={{ value: 2, direction: "up" }}
        />
        <StatCard
          label="Under Maintenance"
          value="124"
          icon={<Wrench className="h-6 w-6 text-orange-500" />}
          trend={{ value: 1, direction: "down" }}
        />
        <StatCard
          label="Critical Alerts"
          value="18"
          icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
          trend={{ value: 12, direction: "up" }}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Operations
          </h2>
        </div>

        <div className="overflow-x-auto">
          <Table<RecentOperation>
            columns={operationColumns}
            rows={recentOperations}
            rowKey="id"
            hoverable
          />
        </div>
      </div>

      {/* Maintenance Predictions Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Maintenance Predictions
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Assets flagged by the rule engine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {maintenancePredictions.map((prediction) => (
            <div
              key={prediction.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {prediction.assetTag}
                  </p>
                  <p className="text-sm text-gray-600">{prediction.assetName}</p>
                </div>
                <Badge variant={getRiskBadgeVariant(prediction.riskLevel)}>
                  {prediction.riskLevel.charAt(0).toUpperCase() +
                    prediction.riskLevel.slice(1)}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-4">{prediction.rule}</p>

              <Button variant="ghost" size="sm" className="text-primary">
                View Asset
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
