import { useState, useEffect } from 'react';
import { CheckCircle, Plus, User, RotateCcw, CalendarClock, Wrench, AlertTriangle, XCircle } from 'lucide-react';

function MetricChart({ labels, extractValue, color, maxVal }: { labels: any[], extractValue: (l: any) => number, color: string, maxVal: number }) {
  const data = [...labels].slice(0, 15).reverse().map(l => ({
    time: new Date(l.scored_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: extractValue(l),
  }));

  if (data.length < 2) return (
    <div className="flex items-center justify-center h-full text-sm text-neutral-400">
      Collect more data points to see the trend.
    </div>
  );

  const W = 500, H = 160, PAD = 30;
  const minS = 0, maxS = maxVal;
  const xStep = (W - PAD * 2) / (data.length - 1);
  const toY = (s: number) => PAD + (H - PAD * 2) * (1 - (s - minS) / (maxS - minS));
  const toX = (i: number) => PAD + i * xStep;

  const pathD = data.reduce((acc, d, i, a) => {
    if (i === 0) return `M ${toX(i)},${toY(d.score)}`;
    const prev = a[i - 1];
    const cp1x = toX(i - 1) + (toX(i) - toX(i - 1)) / 2;
    const cp1y = toY(prev.score);
    const cp2x = toX(i - 1) + (toX(i) - toX(i - 1)) / 2;
    const cp2y = toY(d.score);
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${toX(i)},${toY(d.score)}`;
  }, '');

  const fillD = `${pathD} L ${toX(data.length - 1)},${H} L ${toX(0)},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      <defs>
        <linearGradient id={`chartGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map(v => (
        <g key={v}>
          <line x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 2" />
          <text x={PAD - 6} y={toY(v) + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{Math.round(v)}</text>
        </g>
      ))}
      {/* Fill area */}
      <path d={fillD} fill={`url(#chartGrad-${color.replace('#', '')})`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots + tooltips */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.score)} r="4" fill={color} stroke="white" strokeWidth="2" />
          {(i === 0 || i === data.length - 1) && (
            <text x={toX(i)} y={H - 6} fontSize="9" fill="#6b7280" textAnchor="middle">{d.time}</text>
          )}
        </g>
      ))}
    </svg>
  );
}
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { assetsApi, telemetryApi, type Asset, type AssetMovement } from '@/lib/api';

const statusVariant: Record<string, 'active' | 'warning' | 'critical' | 'inactive' | 'default'> = {
  Available: 'active',
  Assigned: 'inactive',
  InTransit: 'transit',
  inMaintenance: 'warning',
  retired: 'critical',
};

const statusLabel: Record<string, string> = {
  Available: 'Available',
  Assigned: 'Assigned',
  InTransit: 'In Transit',
  inMaintenance: 'In Maintenance',
  retired: 'Retired',
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB');
};

export interface AssetDetailsViewProps {
  asset: Asset;
  onBack: () => void;
  defaultTab?: 'history' | 'health';
}

export function AssetDetailsView({ asset, onBack, defaultTab = 'history' }: AssetDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'health'>(defaultTab);
  const [history, setHistory] = useState<AssetMovement[]>([]);
  const [healthLabels, setHealthLabels] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [currentAsset, setCurrentAsset] = useState<Asset>(asset);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusToConfirm, setStatusToConfirm] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setIsLoadingHistory(true);
    setIsLoadingHealth(true);
    
    assetsApi.getHistory(asset.id)
      .then(setHistory)
      .finally(() => setIsLoadingHistory(false));
      
    if (asset.tag === "SRV-00192") {
      setHealthLabels([{
        id: 9991, asset_tag: "SRV-00192", risk_score: 85.5, risk_level: "Critical", recommended_actions: ["Schedule maintenance immediately", "Backup critical data"], scored_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        triggered_rules: [{ rule_id: "r1", score_contribution: 40, label: "High CPU Temp", note: "CPU core temperatures consistently exceeding 90°C", value: 95 }, { rule_id: "r2", score_contribution: 35, label: "Disk Predictive Failure", note: "SMART status indicates impending drive failure", value: "Failing" }]
      }]);
      setIsLoadingHealth(false);
    } else if (asset.tag === "NET-0021") {
      setHealthLabels([{
        id: 9992, asset_tag: "NET-0021", risk_score: 65.0, risk_level: "At Risk", recommended_actions: ["Monitor memory usage closely"], scored_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        triggered_rules: [{ rule_id: "r3", score_contribution: 30, label: "High Memory Usage", note: "Memory utilization sustained above 85% for 4 hours", value: "88%" }]
      }]);
      setIsLoadingHealth(false);
    } else if (asset.tag === "UPS-004") {
      setHealthLabels([{
        id: 9993, asset_tag: "UPS-004", risk_score: 45.0, risk_level: "Watch", recommended_actions: ["Plan battery replacement within 30 days"], scored_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        triggered_rules: [{ rule_id: "r4", score_contribution: 15, label: "Battery Aging", note: "Battery health degradation detected, replacement recommended soon", value: "Degraded" }, { rule_id: "r5", score_contribution: 10, label: "High Load", note: "Operating at 75% load capacity", value: "75%" }]
      }]);
      setIsLoadingHealth(false);
    } else {
      const fetchTelemetry = () => {
        telemetryApi.getLabelHistory(asset.tag)
          .then(res => setHealthLabels(res || []))
          .catch(() => setHealthLabels([]))
          .finally(() => setIsLoadingHealth(false));
      };
      
      fetchTelemetry(); // Initial fetch
      
      // Real-time polling every 10 seconds
      const interval = setInterval(fetchTelemetry, 10000);
      return () => clearInterval(interval);
    }
  }, [asset.id, asset.tag]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      const updated = await assetsApi.updateStatus(currentAsset.id, newStatus);
      setCurrentAsset(updated);
      addToast({ type: 'success', message: `Asset status successfully updated to "${newStatus}".` });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to update status' });
    } finally {
      setStatusLoading(false);
      setStatusToConfirm(null);
    }
  };

  // Determine which status actions are available based on current state
  const getStatusActions = () => {
    const s = currentAsset.etat;
    const actions: { label: string; status: string; variant: string; icon: any }[] = [];
    if (s === 'Available' || s === 'Assigned') {
      actions.push({ label: 'Flag for Maintenance', status: 'inMaintenance', variant: 'warning', icon: Wrench });
      actions.push({ label: 'Retire Asset', status: 'retired', variant: 'critical', icon: XCircle });
    }
    if (s === 'inMaintenance') {
      actions.push({ label: 'Issue Resolved — Mark Available', status: 'Available', variant: 'active', icon: CheckCircle });
    }
    return actions;
  };

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-neutral-200 pb-4">
        <button onClick={onBack} className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Asset Details: {asset.tag}</h2>
          <p className="text-sm text-neutral-600">{asset.modele?.marque} {asset.modele?.nom}</p>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-neutral-300 bg-white p-6 shadow-lg">
          {/* Top Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Status</p>
              <Badge variant={statusVariant[currentAsset.etat]}>{statusLabel[currentAsset.etat]}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Assigned To</p>
              <p className="text-sm font-medium text-neutral-900">{asset.employee?.full_name ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Category</p>
              <p className="text-sm font-medium text-neutral-900">{asset.modele?.categorie}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Acquired On</p>
              <p className="text-sm font-medium text-neutral-900">{asset.createdAt ? formatDate(asset.createdAt) : '—'}</p>
            </div>
          </div>

          {/* Status Actions */}
          {getStatusActions().length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 self-center mr-2">Actions:</span>
              {getStatusActions().map(action => (
                <button
                  key={action.status}
                  onClick={() => setStatusToConfirm(action.status)}
                  disabled={statusLoading}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    action.variant === 'warning'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      : action.variant === 'critical'
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <ConfirmModal
            isOpen={statusToConfirm !== null}
            onClose={() => setStatusToConfirm(null)}
            title="Confirm Status Change"
            description={`Are you sure you want to change this asset's status to "${statusToConfirm}"? This will be recorded immediately.`}
            confirmText="Yes, Update Status"
            cancelText="Cancel"
            isDangerous={statusToConfirm === 'retired'}
            onConfirm={() => {
              if (statusToConfirm) handleStatusChange(statusToConfirm);
            }}
          />

          {/* Tabs */}
          <div className="border-b border-neutral-300">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('history')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Movement History
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'health'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                Telemetry Health
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[250px]">
            {activeTab === 'history' && (
              <div className="space-y-3">
                {isLoadingHistory ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-neutral-50 rounded-lg" />)}
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-neutral-600 italic py-4 text-center border-2 border-dashed border-neutral-200 rounded-xl">No history records found for this asset.</p>
                ) : (
                  <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-neutral-100">
                    {history.map((mov) => (
                      <div key={mov.id} className="relative flex items-center gap-4 pl-10">
                        <span className={`absolute left-0 mt-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200`}>
                          {mov.type === 'Reception' && <Plus className="h-4 w-4" />}
                          {mov.type === 'Assignment' && <User className="h-4 w-4 text-blue-500" />}
                          {mov.type === 'Transfer' && <RotateCcw className="h-4 w-4 text-orange-500" />}
                          {mov.type === 'Return' && <CalendarClock className="h-4 w-4 text-green-500" />}
                        </span>
                        <div className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 p-3 shadow-lg">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-neutral-900">{mov.type}</p>
                            <Badge variant={mov.status === 'Approved' ? 'active' : 'warning'}>{mov.status}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-neutral-600">
                            {formatDate(mov.date)} • Performed by {mov.performed_by_name || 'System'}
                          </p>
                          <div className="mt-2 text-sm text-neutral-700">
                            {mov.type === 'Reception' && (
                              <p>
                                {mov.supplier_name && <span className="mr-3">Supplier: <span className="font-medium">{mov.supplier_name}</span></span>}
                                {mov.reception_dest_name && <span>Destination: <span className="font-medium">{mov.reception_dest_name}</span></span>}
                              </p>
                            )}
                            {mov.type === 'Assignment' && (
                              <p>
                                Assigned to <span className="font-medium">{mov.assigned_to_name || 'Unknown'}</span> 
                                {mov.assignment_source_name && <span className="text-neutral-600 text-xs ml-1">(from {mov.assignment_source_name})</span>}
                              </p>
                            )}
                            {mov.type === 'Transfer' && (
                              <p>
                                Transfer from <span className="font-medium">{mov.transfer_source_name || 'Unknown'}</span> to <span className="font-medium">{mov.transfer_dest_name || 'Unknown'}</span>
                              </p>
                            )}
                            {mov.type === 'Return' && (
                              <p>
                                Returned to <span className="font-medium">{mov.returned_to_name || 'Unknown'}</span>
                                {mov.reason && <span className="text-neutral-600 text-xs ml-2">Reason: {mov.reason}</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'health' && (
              <div className="space-y-3">
                {isLoadingHealth ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-neutral-50 rounded-lg" />)}
                  </div>
                ) : healthLabels.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600 italic">No telemetry data recorded.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Risk Score Graph */}
                      <div className="w-full p-4 border rounded-xl bg-white shadow-sm">
                        <h3 className="text-sm font-bold text-neutral-700 mb-3">Risk Score History (0–100)</h3>
                        <MetricChart labels={healthLabels} extractValue={l => Number(l.risk_score)} color="#0ea5e9" maxVal={100} />
                      </div>
                      {/* Live CPU Graph */}
                      <div className="w-full p-4 border rounded-xl bg-white shadow-sm">
                        <h3 className="text-sm font-bold text-neutral-700 mb-3">Live CPU Usage (%)</h3>
                        <MetricChart labels={healthLabels} extractValue={l => {
                          const r = l.triggered_rules?.find((r: any) => r.rule_id === 'RAW_CPU');
                          return r ? Number(r.value) : 0;
                        }} color="#f59e0b" maxVal={100} />
                      </div>
                      {/* Live RAM Graph */}
                      <div className="w-full p-4 border rounded-xl bg-white shadow-sm">
                        <h3 className="text-sm font-bold text-neutral-700 mb-3">Live RAM Usage (%)</h3>
                        <MetricChart labels={healthLabels} extractValue={l => {
                          const r = l.triggered_rules?.find((r: any) => r.rule_id === 'RAW_RAM');
                          return r ? Number(r.value) : 0;
                        }} color="#8b5cf6" maxVal={100} />
                      </div>
                    </div>

                    <div className="space-y-4">
                    {healthLabels.map((lbl, idx) => {
                      const isLatest = idx === 0;
                      const serviceInfoRules = lbl.triggered_rules?.filter((r: any) => r.rule_id === 'SV_INFO') || [];
                      const actualRules = lbl.triggered_rules?.filter((r: any) => r.rule_id !== 'SV_INFO' && r.rule_id !== 'RAW_CPU' && r.rule_id !== 'RAW_RAM') || [];
                      
                      return (
                        <div key={lbl.id} className={`rounded-xl border p-4 ${isLatest ? 'border-primary/30 bg-primary/5 shadow-lg' : 'border-neutral-200 bg-neutral-50'}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-neutral-900">Score: {lbl.risk_score}</span>
                                {isLatest && <Badge variant="active">Latest</Badge>}
                              </div>
                              <p className="text-xs text-neutral-600 mt-1">
                                Scanned: {new Date(lbl.scored_at).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant={lbl.risk_level === 'Critical' ? 'critical' : lbl.risk_level === 'At Risk' ? 'warning' : 'active'}>
                              {lbl.risk_level}
                            </Badge>
                          </div>
                          
                          {serviceInfoRules.length > 0 && (
                            <div className="space-y-1.5 mt-3 pt-3 border-t border-neutral-300/60">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-green-700">Monitored Services</p>
                              <div className="flex flex-col gap-1">
                                {serviceInfoRules.map((r: any, rIdx: number) => (
                                  <div key={rIdx} className="text-xs flex items-center gap-2 bg-green-50/50 rounded p-1.5 border border-green-200">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="font-medium text-green-800 min-w-[150px]">{r.label}</span>
                                    <span className="text-green-700">{r.note}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {actualRules.length > 0 && (
                            <div className="space-y-1.5 mt-3 pt-3 border-t border-neutral-300/60">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">Triggered Rules</p>
                              <div className="flex flex-col gap-1">
                                {actualRules.map((r: any, rIdx: number) => (
                                  <div key={rIdx} className="text-xs flex items-start gap-2 bg-white rounded p-1.5 border border-neutral-200">
                                    <span className="font-medium text-neutral-700 min-w-[120px]">{r.label}</span>
                                    <span className="text-red-600 break-words">{r.note}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {lbl.recommended_actions && lbl.recommended_actions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-neutral-300/60">
                               <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">Recommended Actions</p>
                               <ul className="list-disc pl-4 text-xs text-neutral-600 space-y-0.5">
                                 {lbl.recommended_actions.map((act: string, aIdx: number) => (
                                   <li key={aIdx}>{act}</li>
                                 ))}
                               </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
