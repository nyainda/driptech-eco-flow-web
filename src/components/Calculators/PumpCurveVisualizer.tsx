import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Gauge,
  Info,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import {
  analyzePumpSystemCurves,
  type MatchedPumpRecommendation,
  type PumpCurveConfig,
  type PumpCurveModelMode,
  type PumpSolarResult,
} from "@/lib/pumpSolarSizing";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PumpCurveVisualizerProps {
  /** Live calculator hydraulic result. Omit in standalone SEO guide mode to use interactive field presets. */
  result?: PumpSolarResult;
  /** Matched DripTech catalogue pumps from calculator */
  matchedPumps?: MatchedPumpRecommendation[];
  /** Custom / manual pump specs from calculator custom figure tab */
  customPumpSpecs?: {
    label?: string;
    maxFlowM3h?: number;
    maxHeadM?: number;
  };
  /** Optional external selection when clicking "Plot Curve" on a matched pump card */
  selectedPumpId?: string | null;
  /** Whether rendered inside SEO guide (/how-to-read-pump-curves-kenya) */
  standaloneGuideMode?: boolean;
}

interface GuidePresetScenario {
  id: string;
  label: string;
  summary: string;
  designFlowM3h: number;
  fixedStaticHeadM: number;
  dynamicLossAtDesignM: number;
  pumpConfig: PumpCurveConfig;
}

const STANDALONE_GUIDE_PRESETS: GuidePresetScenario[] = [
  {
    id: "healthy_por",
    label: "1-Acre Borehole Drip (Healthy BEP)",
    summary:
      "Balanced match: 5.5 m³/h BEP submersible operating into a 60 m static + 15 m drip head at ~96% of BEP inside the green POR zone.",
    designFlowM3h: 5.2,
    fixedStaticHeadM: 60,
    dynamicLossAtDesignM: 7.5,
    pumpConfig: {
      mode: "datasheet_3point",
      label: "4ST Multi-Stage Submersible (1.5 kW)",
      maxFlowM3h: 8.6,
      maxHeadM: 112,
      bepFlowM3h: 5.5,
      bepHeadM: 72,
      runoutFlowM3h: 8.2,
      runoutHeadM: 18,
      vfdFreqHz: 42,
      ratedFreqHz: 50,
    },
  },
  {
    id: "recirculation_left",
    label: "Oversized / Throttled (<70% BEP)",
    summary:
      "Staff picked too big a pump or closed block valves: flow drops to ~3.2 m³/h (36% of 9.0 m³/h BEP), causing impeller recirculation & motor heat.",
    designFlowM3h: 3.2,
    fixedStaticHeadM: 76,
    dynamicLossAtDesignM: 12,
    pumpConfig: {
      mode: "datasheet_3point",
      label: "Oversized 3 kW Submersible (High Flow)",
      maxFlowM3h: 14.5,
      maxHeadM: 105,
      bepFlowM3h: 9.0,
      bepHeadM: 68,
      runoutFlowM3h: 13.8,
      runoutHeadM: 16,
      vfdFreqHz: 42,
      ratedFreqHz: 50,
    },
  },
  {
    id: "runout_right",
    label: "Open Flood / Low Head (>120% BEP)",
    summary:
      "Flat field with almost zero pipe resistance: pump surges to the far right past 120% BEP, risking motor amp overload & cavitation.",
    designFlowM3h: 7.5,
    fixedStaticHeadM: 12,
    dynamicLossAtDesignM: 3.5,
    pumpConfig: {
      mode: "datasheet_3point",
      label: "Low-Head Transfer Centrifugal (1.1 kW)",
      maxFlowM3h: 8.8,
      maxHeadM: 58,
      bepFlowM3h: 5.0,
      bepHeadM: 38,
      runoutFlowM3h: 8.4,
      runoutHeadM: 10,
      vfdFreqHz: 42,
      ratedFreqHz: 50,
    },
  },
  {
    id: "dead_head",
    label: "Insufficient Head (Shutoff < Static)",
    summary:
      "Shutoff head (52 m) is below well lift + drip pressure (64 m): pump spins zero water, turns all energy into heat, and damages mechanical seals.",
    designFlowM3h: 4.0,
    fixedStaticHeadM: 64,
    dynamicLossAtDesignM: 6,
    pumpConfig: {
      mode: "parabolic_endpoints",
      label: "Shallow 0.75 kW Surface Pump (Hmax 52 m)",
      maxFlowM3h: 7.5,
      maxHeadM: 52,
      vfdFreqHz: 42,
      ratedFreqHz: 50,
    },
  },
];

function buildSyntheticResult(preset: GuidePresetScenario): PumpSolarResult {
  const tdh = preset.fixedStaticHeadM + preset.dynamicLossAtDesignM;
  return {
    designFlowM3h: preset.designFlowM3h,
    totalPipeFrictionM: preset.dynamicLossAtDesignM * 0.85,
    fittingsMinorLossM: preset.dynamicLossAtDesignM * 0.15,
    totalDynamicHeadM: tdh,
  } as PumpSolarResult;
}

export default function PumpCurveVisualizer({
  result,
  matchedPumps = [],
  customPumpSpecs,
  selectedPumpId,
  standaloneGuideMode = false,
}: PumpCurveVisualizerProps) {
  const [presetId, setPresetId] = useState<string>("healthy_por");
  const activePreset = useMemo(
    () => STANDALONE_GUIDE_PRESETS.find((p) => p.id === presetId) ?? STANDALONE_GUIDE_PRESETS[0],
    [presetId],
  );

  // Source choice when used inside PumpSolarSizingEngine
  const [sourceChoice, setSourceChoice] = useState<string>("auto");
  useEffect(() => {
    if (selectedPumpId) {
      setSourceChoice(selectedPumpId);
    }
  }, [selectedPumpId]);

  const effectiveResult = useMemo(
    () => (result ? result : buildSyntheticResult(activePreset)),
    [result, activePreset],
  );

  const validMatchedPumps = useMemo(
    () =>
      matchedPumps.filter(
        (m) =>
          typeof m.specs.maxFlowM3h === "number" &&
          m.specs.maxFlowM3h > 0 &&
          typeof m.specs.maxHeadM === "number" &&
          m.specs.maxHeadM > 0,
      ),
    [matchedPumps],
  );

  // Determine initial baseline curve parameters from chosen pump or standalone preset
  const resolvedSource = useMemo<{
    key: string;
    label: string;
    maxFlowM3h: number;
    maxHeadM: number;
    bepFlowM3h?: number | null;
    bepHeadM?: number | null;
    runoutFlowM3h?: number | null;
    runoutHeadM?: number | null;
    defaultMode: PumpCurveModelMode;
  }>(() => {
    if (standaloneGuideMode || !result) {
      const cfg = activePreset.pumpConfig;
      return {
        key: activePreset.id,
        label: cfg.label,
        maxFlowM3h: cfg.maxFlowM3h,
        maxHeadM: cfg.maxHeadM,
        bepFlowM3h: cfg.bepFlowM3h,
        bepHeadM: cfg.bepHeadM,
        runoutFlowM3h: cfg.runoutFlowM3h,
        runoutHeadM: cfg.runoutHeadM,
        defaultMode: cfg.mode,
      };
    }

    if (
      sourceChoice === "custom" &&
      customPumpSpecs?.maxFlowM3h &&
      customPumpSpecs.maxFlowM3h > 0 &&
      customPumpSpecs?.maxHeadM &&
      customPumpSpecs.maxHeadM > 0
    ) {
      return {
        key: "custom",
        label: customPumpSpecs.label || "Custom / User Pump",
        maxFlowM3h: customPumpSpecs.maxFlowM3h,
        maxHeadM: customPumpSpecs.maxHeadM,
        defaultMode: "parabolic_endpoints",
      };
    }

    const pickedMatch =
      validMatchedPumps.find((m) => m.product.id === sourceChoice) ??
      validMatchedPumps[0];

    if (pickedMatch) {
      return {
        key: pickedMatch.product.id,
        label: pickedMatch.product.name,
        maxFlowM3h: pickedMatch.specs.maxFlowM3h!,
        maxHeadM: pickedMatch.specs.maxHeadM!,
        defaultMode: "parabolic_endpoints",
      };
    }

    if (
      customPumpSpecs?.maxFlowM3h &&
      customPumpSpecs.maxFlowM3h > 0 &&
      customPumpSpecs?.maxHeadM &&
      customPumpSpecs.maxHeadM > 0
    ) {
      return {
        key: "custom",
        label: customPumpSpecs.label || "Custom / User Pump",
        maxFlowM3h: customPumpSpecs.maxFlowM3h,
        maxHeadM: customPumpSpecs.maxHeadM,
        defaultMode: "parabolic_endpoints",
      };
    }

    // Synthetic matched baseline curve from design point if catalogue hasn't matched anything yet
    const qMaxSynth = Number((effectiveResult.designFlowM3h / 0.62).toFixed(1));
    const hMaxSynth = Math.ceil((effectiveResult.totalDynamicHeadM / 0.58) / 5) * 5;
    return {
      key: "reference",
      label: `Target Equivalent Pump (${effectiveResult.recommendedMotorKw.toFixed(1)} kW est.)`,
      maxFlowM3h: Math.max(2, qMaxSynth),
      maxHeadM: Math.max(20, hMaxSynth),
      defaultMode: "parabolic_endpoints",
    };
  }, [standaloneGuideMode, result, activePreset, sourceChoice, customPumpSpecs, validMatchedPumps, effectiveResult]);

  // Editable curve calibration state synced when selected pump changes
  const [curveMode, setCurveMode] = useState<PumpCurveModelMode>(resolvedSource.defaultMode);
  const [pumpLabel, setPumpLabel] = useState<string>(resolvedSource.label);
  const [shutoffHeadM, setShutoffHeadM] = useState<number>(resolvedSource.maxHeadM);
  const [maxFlowM3h, setMaxFlowM3h] = useState<number>(resolvedSource.maxFlowM3h);
  const [bepFlowM3h, setBepFlowM3h] = useState<number>(
    resolvedSource.bepFlowM3h ?? Number((resolvedSource.maxFlowM3h * 0.62).toFixed(1)),
  );
  const [bepHeadM, setBepHeadM] = useState<number>(
    resolvedSource.bepHeadM ?? Math.round(resolvedSource.maxHeadM * 0.6),
  );
  const [runoutFlowM3h, setRunoutFlowM3h] = useState<number>(
    resolvedSource.runoutFlowM3h ?? Number((resolvedSource.maxFlowM3h * 0.95).toFixed(1)),
  );
  const [runoutHeadM, setRunoutHeadM] = useState<number>(
    resolvedSource.runoutHeadM ?? Math.max(0, Math.round(resolvedSource.maxHeadM * 0.14)),
  );
  const [showVfdCurve, setShowVfdCurve] = useState<boolean>(true);
  const [vfdFreqHz, setVfdFreqHz] = useState<number>(42);
  const [hoverFlowM3h, setHoverFlowM3h] = useState<number | null>(null);

  useEffect(() => {
    setCurveMode(resolvedSource.defaultMode);
    setPumpLabel(resolvedSource.label);
    setShutoffHeadM(resolvedSource.maxHeadM);
    setMaxFlowM3h(resolvedSource.maxFlowM3h);
    setBepFlowM3h(
      resolvedSource.bepFlowM3h ?? Number((resolvedSource.maxFlowM3h * 0.62).toFixed(1)),
    );
    setBepHeadM(resolvedSource.bepHeadM ?? Math.round(resolvedSource.maxHeadM * 0.6));
    setRunoutFlowM3h(
      resolvedSource.runoutFlowM3h ?? Number((resolvedSource.maxFlowM3h * 0.95).toFixed(1)),
    );
    setRunoutHeadM(
      resolvedSource.runoutHeadM ?? Math.max(0, Math.round(resolvedSource.maxHeadM * 0.14)),
    );
  }, [resolvedSource]);

  const analysis = useMemo(
    () =>
      analyzePumpSystemCurves(effectiveResult, {
        mode: curveMode,
        label: pumpLabel,
        maxFlowM3h: Math.max(0.5, maxFlowM3h),
        maxHeadM: Math.max(5, shutoffHeadM),
        bepFlowM3h,
        bepHeadM,
        runoutFlowM3h,
        runoutHeadM,
        vfdFreqHz: showVfdCurve ? vfdFreqHz : null,
        ratedFreqHz: 50,
      }),
    [
      effectiveResult,
      curveMode,
      pumpLabel,
      maxFlowM3h,
      shutoffHeadM,
      bepFlowM3h,
      bepHeadM,
      runoutFlowM3h,
      runoutHeadM,
      showVfdCurve,
      vfdFreqHz,
    ],
  );

  // SVG Coordinate Geometry
  const SVG_W = 720;
  const SVG_H = 380;
  const PAD = { top: 24, right: 26, bottom: 48, left: 56 };
  const PLOT_W = SVG_W - PAD.left - PAD.right;
  const PLOT_H = SVG_H - PAD.top - PAD.bottom;

  const xScale = (q: number) =>
    PAD.left + Math.min(1, Math.max(0, q / analysis.chartMaxFlowM3h)) * PLOT_W;
  const yScale = (h: number) =>
    PAD.top + PLOT_H - Math.min(1, Math.max(0, h / analysis.chartMaxHeadM)) * PLOT_H;

  const pumpPathD = useMemo(() => {
    const valid = analysis.points.filter((p) => p.pumpHeadM !== null);
    return valid
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${xScale(p.flowM3h).toFixed(1)} ${yScale(p.pumpHeadM!).toFixed(1)}`)
      .join(" ");
  }, [analysis]);

  const sysPathD = useMemo(
    () =>
      analysis.points
        .map((p, idx) => `${idx === 0 ? "M" : "L"} ${xScale(p.flowM3h).toFixed(1)} ${yScale(p.systemHeadM).toFixed(1)}`)
        .join(" "),
    [analysis],
  );

  const reducedPathD = useMemo(() => {
    const valid = analysis.points.filter((p) => p.reducedSpeedHeadM !== null);
    if (valid.length < 2) return "";
    return valid
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${xScale(p.flowM3h).toFixed(1)} ${yScale(p.reducedSpeedHeadM!).toFixed(1)}`)
      .join(" ");
  }, [analysis]);

  // Closest point readout when hovering over the plot
  const hoverSnapshot = useMemo(() => {
    if (hoverFlowM3h === null) return null;
    let best = analysis.points[0];
    let bestDist = Infinity;
    for (const pt of analysis.points) {
      const dist = Math.abs(pt.flowM3h - hoverFlowM3h);
      if (dist < bestDist) {
        bestDist = dist;
        best = pt;
      }
    }
    return best;
  }, [analysis.points, hoverFlowM3h]);

  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    Number((analysis.chartMaxFlowM3h * t).toFixed(1)),
  );
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    Math.round(analysis.chartMaxHeadM * t),
  );

  const verdictBadgeClass =
    analysis.porVerdict === "optimal_por"
      ? "border-primary/40 bg-primary/15 text-primary"
      : analysis.porVerdict === "dead_head_blocked"
        ? "border-destructive/40 bg-destructive/15 text-destructive"
        : "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300";

  return (
    <section
      aria-labelledby="pump-curve-visualizer-heading"
      className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"
    >
      {/* Header Strip */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Activity className="h-3.5 w-3.5" />
              Interactive Q–H Curve &amp; POR Reader
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${verdictBadgeClass}`}>
              {analysis.porVerdict === "optimal_por" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {analysis.porVerdictLabel}
            </span>
          </div>
          <h2 id="pump-curve-visualizer-heading" className="mt-2 text-lg font-extrabold text-foreground sm:text-xl">
            Pump Curve vs Farm System Resistance Curve ({analysis.pumpLabel})
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            The true farm flow is strictly where the <strong>Pump Q–H Curve</strong> crosses the rising{" "}
            <strong>System Resistance Curve</strong>. Keep duty inside the shaded{" "}
            <strong>70%–120% BEP Preferred Operating Range (POR)</strong> to stop cavitation and premature motor burn.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!standaloneGuideMode ? (
            <Link
              to="/how-to-read-pump-curves-kenya"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Staff Curve Training Guide
            </Link>
          ) : (
            <Link
              to="/pump-solar-calculator-kenya"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Calculator className="h-3.5 w-3.5" />
              Open Full Sizing Engine
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Main 2-Column Interactive Plot + Controls */}
      <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,330px)_minmax(0,1fr)]">
        {/* Left: Controls & Datasheet Calibration */}
        <div className="space-y-4">
          {standaloneGuideMode ? (
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Test a Kenya Field Scenario
              </p>
              <div className="grid gap-1.5">
                {STANDALONE_GUIDE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPresetId(preset.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      presetId === preset.id
                        ? "border-primary bg-primary/10 font-bold text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
                {activePreset.summary}
              </p>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3.5">
              <Label htmlFor="curve-pump-select" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Select Pump Curve to Plot
              </Label>
              <select
                id="curve-pump-select"
                value={resolvedSource.key}
                onChange={(e) => setSourceChoice(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              >
                {validMatchedPumps.map((m, idx) => (
                  <option key={m.product.id} value={m.product.id}>
                    #{idx + 1} Matched: {m.product.name} ({m.specs.maxFlowM3h} m³/h, {m.specs.maxHeadM} m)
                  </option>
                ))}
                {customPumpSpecs?.maxFlowM3h && customPumpSpecs?.maxHeadM ? (
                  <option value="custom">
                    Custom Pump: {customPumpSpecs.label || "User Figure"} ({customPumpSpecs.maxFlowM3h} m³/h,{" "}
                    {customPumpSpecs.maxHeadM} m)
                  </option>
                ) : null}
                {!validMatchedPumps.length && !(customPumpSpecs?.maxFlowM3h && customPumpSpecs?.maxHeadM) && (
                  <option value="reference">Target Sizing Reference Curve</option>
                )}
              </select>
            </div>
          )}

          {/* Mode Toggle: 2-Point vs 3-Point OEM Calibration */}
          <div className="space-y-3 rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                2. Datasheet Curve Accuracy
              </span>
              <Badge variant="outline" className="text-[10px]">
                {curveMode === "datasheet_3point" ? "Exact 3-Pt Fit" : "Qmax/Hmax Fit"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setCurveMode("parabolic_endpoints")}
                className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                  curveMode === "parabolic_endpoints"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Quick Qmax / Hmax
              </button>
              <button
                type="button"
                onClick={() => setCurveMode("datasheet_3point")}
                className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                  curveMode === "datasheet_3point"
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                3-Point OEM Sheet
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label htmlFor="curve-shutoff-head" className="text-[11px] text-muted-foreground">
                  Shutoff Hmax (m @ 0 Q)
                </Label>
                <Input
                  id="curve-shutoff-head"
                  type="number"
                  min={5}
                  step={1}
                  value={shutoffHeadM}
                  onChange={(e) => setShutoffHeadM(Math.max(5, Number(e.target.value) || 0))}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              {curveMode === "parabolic_endpoints" ? (
                <div>
                  <Label htmlFor="curve-max-flow" className="text-[11px] text-muted-foreground">
                    Max Flow Qmax (m³/h)
                  </Label>
                  <Input
                    id="curve-max-flow"
                    type="number"
                    min={0.5}
                    step={0.1}
                    value={maxFlowM3h}
                    onChange={(e) => setMaxFlowM3h(Math.max(0.5, Number(e.target.value) || 0.5))}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="curve-bep-flow" className="text-[11px] text-muted-foreground">
                    BEP Flow (m³/h)
                  </Label>
                  <Input
                    id="curve-bep-flow"
                    type="number"
                    min={0.2}
                    step={0.1}
                    value={bepFlowM3h}
                    onChange={(e) => setBepFlowM3h(Math.max(0.2, Number(e.target.value) || 0.2))}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              )}

              {curveMode === "datasheet_3point" && (
                <>
                  <div>
                    <Label htmlFor="curve-bep-head" className="text-[11px] text-muted-foreground">
                      BEP Head (m)
                    </Label>
                    <Input
                      id="curve-bep-head"
                      type="number"
                      min={1}
                      step={1}
                      value={bepHeadM}
                      onChange={(e) => setBepHeadM(Math.max(1, Number(e.target.value) || 1))}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="curve-runout-flow" className="text-[11px] text-muted-foreground">
                      Runout Flow (m³/h)
                    </Label>
                    <Input
                      id="curve-runout-flow"
                      type="number"
                      min={0.5}
                      step={0.1}
                      value={runoutFlowM3h}
                      onChange={(e) => setRunoutFlowM3h(Math.max(0.5, Number(e.target.value) || 0.5))}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="curve-runout-head" className="text-[11px] text-muted-foreground">
                      Head at Runout Point (m)
                    </Label>
                    <Input
                      id="curve-runout-head"
                      type="number"
                      min={0}
                      step={1}
                      value={runoutHeadM}
                      onChange={(e) => setRunoutHeadM(Math.max(0, Number(e.target.value) || 0))}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Solar VFD Speed Affinity Slider */}
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={showVfdCurve}
                    onChange={(e) => setShowVfdCurve(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border accent-primary"
                  />
                  <Sun className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  Solar VFD Speed Curve
                </label>
                {showVfdCurve && (
                  <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                    {vfdFreqHz} Hz vs 50 Hz
                  </span>
                )}
              </div>
              {showVfdCurve && (
                <div className="mt-2">
                  <input
                    type="range"
                    aria-label="Solar VFD reduced frequency Hz"
                    min={30}
                    max={49}
                    step={1}
                    value={vfdFreqHz}
                    onChange={(e) => setVfdFreqHz(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {analysis.reducedSpeedOperatingPoint?.canOperate
                      ? `At ${vfdFreqHz} Hz (cloudy/morning sun), flow drops to ${analysis.reducedSpeedOperatingPoint.flowM3h.toFixed(
                          1,
                        )} m³/h @ ${analysis.reducedSpeedOperatingPoint.headM.toFixed(0)} m.`
                      : `At ${vfdFreqHz} Hz, shutoff head drops to ${(
                          analysis.shutoffHeadM * Math.pow(vfdFreqHz / 50, 2)
                        ).toFixed(0)} m — below ${analysis.fixedStaticHeadM.toFixed(0)} m static lift (0 L/h delivered).`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Model Accuracy Disclaimer */}
          <div className="flex gap-2 rounded-xl border border-border/80 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{analysis.modelNote}</span>
          </div>
        </div>

        {/* Right: Responsive Vector Q-H Plot + Readout Strip */}
        <div className="min-w-0 space-y-4">
          {/* Interactive Hover Readout Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/25 px-3.5 py-2 text-xs">
            {hoverSnapshot ? (
              <div className="flex flex-wrap items-center gap-3 font-medium">
                <span className="font-bold text-foreground">
                  Cursor Q = {hoverSnapshot.flowM3h.toFixed(1)} m³/h
                </span>
                <span className="text-primary font-semibold">
                  Pump Head:{" "}
                  {hoverSnapshot.pumpHeadM !== null ? `${hoverSnapshot.pumpHeadM.toFixed(1)} m` : "Beyond Qmax"}
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  System Resistance: {hoverSnapshot.systemHeadM.toFixed(1)} m
                </span>
                {hoverSnapshot.reducedSpeedHeadM !== null && (
                  <span className="font-semibold text-sky-600 dark:text-sky-400">
                    {vfdFreqHz} Hz Head: {hoverSnapshot.reducedSpeedHeadM.toFixed(1)} m
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">
                Hover or tap along the curve to read exact Head (m) vs Flow (m³/h) at any point.
              </span>
            )}
            <span className="text-[11px] font-semibold text-muted-foreground">
              POR Window: {analysis.porMinFlowM3h.toFixed(1)}–{analysis.porMaxFlowM3h.toFixed(1)} m³/h
            </span>
          </div>

          {/* SVG Graph Container */}
          <div className="overflow-hidden rounded-xl border border-border bg-background p-2 sm:p-3">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              role="img"
              aria-label={`Pump Q-H Curve and System Resistance Curve for ${analysis.pumpLabel}`}
              className="h-auto w-full select-none"
              onMouseLeave={() => setHoverFlowM3h(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
                const relX = (svgX - PAD.left) / PLOT_W;
                if (relX >= 0 && relX <= 1) {
                  setHoverFlowM3h(Number((relX * analysis.chartMaxFlowM3h).toFixed(2)));
                } else {
                  setHoverFlowM3h(null);
                }
              }}
            >
              {/* Zone 1: Left Recirculation Danger Band (0 .. 70% BEP) */}
              <rect
                x={xScale(0)}
                y={PAD.top}
                width={Math.max(0, xScale(analysis.porMinFlowM3h) - xScale(0))}
                height={PLOT_H}
                className="fill-destructive/[0.06]"
              />
              {/* Zone 2: Optimal Preferred Operating Range (70% .. 120% BEP) */}
              <rect
                x={xScale(analysis.porMinFlowM3h)}
                y={PAD.top}
                width={Math.max(0, xScale(analysis.porMaxFlowM3h) - xScale(analysis.porMinFlowM3h))}
                height={PLOT_H}
                className="fill-primary/[0.11]"
              />
              {/* Zone 3: Right Runout / Cavitation Band (>120% BEP) */}
              <rect
                x={xScale(analysis.porMaxFlowM3h)}
                y={PAD.top}
                width={Math.max(0, xScale(analysis.chartMaxFlowM3h) - xScale(analysis.porMaxFlowM3h))}
                height={PLOT_H}
                className="fill-amber-500/[0.07]"
              />

              {/* Top Zone Labels */}
              <text
                x={(xScale(0) + xScale(analysis.porMinFlowM3h)) / 2}
                y={PAD.top + 14}
                textAnchor="middle"
                className="fill-destructive text-[10px] font-bold"
              >
                &lt;70% BEP
              </text>
              <text
                x={(xScale(analysis.porMinFlowM3h) + xScale(analysis.porMaxFlowM3h)) / 2}
                y={PAD.top + 14}
                textAnchor="middle"
                className="fill-primary text-[10px] font-extrabold"
              >
                POR (70%–120% BEP)
              </text>
              {xScale(analysis.chartMaxFlowM3h) - xScale(analysis.porMaxFlowM3h) > 52 && (
                <text
                  x={(xScale(analysis.porMaxFlowM3h) + xScale(analysis.chartMaxFlowM3h)) / 2}
                  y={PAD.top + 14}
                  textAnchor="middle"
                  className="fill-amber-600 dark:fill-amber-400 text-[10px] font-bold"
                >
                  Runout
                </text>
              )}

              {/* Gridlines & Axis Ticks */}
              {yTicks.map((headVal) => {
                const y = yScale(headVal);
                return (
                  <g key={`y-${headVal}`}>
                    <line
                      x1={PAD.left}
                      y1={y}
                      x2={SVG_W - PAD.right}
                      y2={y}
                      className="stroke-border"
                      strokeDasharray={headVal === 0 ? undefined : "3 3"}
                    />
                    <text
                      x={PAD.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-muted-foreground text-[11px]"
                    >
                      {headVal} m
                    </text>
                  </g>
                );
              })}

              {xTicks.map((flowVal) => {
                const x = xScale(flowVal);
                return (
                  <g key={`x-${flowVal}`}>
                    <line
                      x1={x}
                      y1={PAD.top}
                      x2={x}
                      y2={SVG_H - PAD.bottom}
                      className="stroke-border"
                      strokeDasharray={flowVal === 0 ? undefined : "3 3"}
                    />
                    <text
                      x={x}
                      y={SVG_H - PAD.bottom + 18}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[11px]"
                    >
                      {flowVal}
                    </text>
                  </g>
                );
              })}

              {/* Axis Titles */}
              <text
                x={PAD.left + PLOT_W / 2}
                y={SVG_H - 8}
                textAnchor="middle"
                className="fill-foreground text-[12px] font-bold"
              >
                Flow Rate Q (m³/h)
              </text>
              <text
                x={16}
                y={PAD.top + PLOT_H / 2}
                textAnchor="middle"
                transform={`rotate(-90 16 ${PAD.top + PLOT_H / 2})`}
                className="fill-foreground text-[12px] font-bold"
              >
                Total Head H (meters)
              </text>

              {/* BEP Vertical Guide Line */}
              <line
                x1={xScale(analysis.bepPoint.flowM3h)}
                y1={PAD.top + 20}
                x2={xScale(analysis.bepPoint.flowM3h)}
                y2={SVG_H - PAD.bottom}
                className="stroke-primary/50"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* Hover Crosshair */}
              {hoverSnapshot && (
                <line
                  x1={xScale(hoverSnapshot.flowM3h)}
                  y1={PAD.top}
                  x2={xScale(hoverSnapshot.flowM3h)}
                  y2={SVG_H - PAD.bottom}
                  className="stroke-foreground/40"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}

              {/* Reduced Solar VFD Curve */}
              {reducedPathD && (
                <path
                  d={reducedPathD}
                  fill="none"
                  className="stroke-sky-600 dark:stroke-sky-400"
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                />
              )}

              {/* Farm System Resistance Curve (Static + Q^1.852) */}
              <path
                d={sysPathD}
                fill="none"
                className="stroke-amber-600 dark:stroke-amber-400"
                strokeWidth="2.8"
              />

              {/* Rated 50 Hz Pump Performance Q-H Curve */}
              <path
                d={pumpPathD}
                fill="none"
                className="stroke-primary"
                strokeWidth="3.5"
              />

              {/* Target Farm Demand Dot */}
              <circle
                cx={xScale(analysis.designDemandPoint.flowM3h)}
                cy={yScale(analysis.designDemandPoint.headM)}
                r={5}
                className="fill-card stroke-amber-600 dark:stroke-amber-400"
                strokeWidth="2.5"
              />

              {/* BEP Point Marker */}
              <circle
                cx={xScale(analysis.bepPoint.flowM3h)}
                cy={yScale(analysis.bepPoint.headM)}
                r={5.5}
                className="fill-primary stroke-background"
                strokeWidth="2"
              />
              <text
                x={Math.min(SVG_W - PAD.right - 28, xScale(analysis.bepPoint.flowM3h) + 8)}
                y={Math.max(PAD.top + 28, yScale(analysis.bepPoint.headM) - 8)}
                className="fill-primary text-[11px] font-bold"
              >
                BEP ({analysis.bepPoint.flowM3h.toFixed(1)}, {analysis.bepPoint.headM.toFixed(0)}m)
              </text>

              {/* Shutoff Head Dot at Q = 0 */}
              <circle
                cx={xScale(0)}
                cy={yScale(analysis.shutoffHeadM)}
                r={4.5}
                className="fill-destructive stroke-background"
                strokeWidth="1.5"
              />

              {/* True Operating Duty Point (Pump Curve ∩ System Curve) */}
              {analysis.operatingPoint.canOperate && (
                <g>
                  <circle
                    cx={xScale(analysis.operatingPoint.flowM3h)}
                    cy={yScale(analysis.operatingPoint.headM)}
                    r={10}
                    className="fill-primary/20"
                  />
                  <circle
                    cx={xScale(analysis.operatingPoint.flowM3h)}
                    cy={yScale(analysis.operatingPoint.headM)}
                    r={6}
                    className="fill-foreground stroke-primary"
                    strokeWidth="2.5"
                  />
                  <text
                    x={Math.min(SVG_W - PAD.right - 72, xScale(analysis.operatingPoint.flowM3h) + 10)}
                    y={yScale(analysis.operatingPoint.headM) + 16}
                    className="fill-foreground text-[11px] font-extrabold"
                  >
                    Duty: {analysis.operatingPoint.flowM3h.toFixed(1)} m³/h @ {analysis.operatingPoint.headM.toFixed(0)} m
                  </text>
                </g>
              )}
            </svg>

            {/* Chart Legend */}
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border pt-2.5 text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <span className="h-0.5 w-5 rounded bg-primary inline-block" />
                Pump Curve (50 Hz)
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <span className="h-0.5 w-5 rounded bg-amber-600 dark:bg-amber-400 inline-block" />
                Farm System Resistance (Static {analysis.fixedStaticHeadM.toFixed(0)} m + Friction)
              </span>
              {showVfdCurve && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="w-5 border-t-2 border-dashed border-sky-600 dark:border-sky-400 inline-block" />
                  Solar Morning/Cloud ({vfdFreqHz} Hz)
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-foreground inline-block" />
                Actual Field Duty Point
              </span>
            </div>
          </div>

          {/* 4-Metric KPI Verdict Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Actual Duty Point
              </p>
              <p className="mt-1 text-base font-extrabold text-foreground sm:text-lg">
                {analysis.operatingPoint.canOperate
                  ? `${analysis.operatingPoint.flowM3h.toFixed(1)} m³/h`
                  : "0.0 m³/h (Blocked)"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                @ {analysis.operatingPoint.headM.toFixed(0)} m Field Head
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                BEP Match Ratio
              </p>
              <p className="mt-1 text-base font-extrabold text-primary sm:text-lg">
                {analysis.operatingPoint.canOperate ? `${analysis.operatingPctOfBep}% of BEP` : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">Target: 70%–120% POR</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Shutoff Head (Q=0)
              </p>
              <p className="mt-1 text-base font-extrabold text-foreground sm:text-lg">
                {analysis.shutoffHeadM.toFixed(0)} m
              </p>
              <p className="text-[11px] text-muted-foreground">
                Static + Drip: {analysis.fixedStaticHeadM.toFixed(0)} m
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Head Margin @ Design
              </p>
              <p
                className={`mt-1 text-base font-extrabold sm:text-lg ${
                  analysis.headMarginAtDesignM >= 0
                    ? "text-primary"
                    : "text-destructive"
                }`}
              >
                {analysis.headMarginAtDesignM >= 0 ? "+" : ""}
                {analysis.headMarginAtDesignM.toFixed(1)} m
              </p>
              <p className="text-[11px] text-muted-foreground">
                At {analysis.designDemandPoint.flowM3h.toFixed(1)} m³/h farm demand
              </p>
            </div>
          </div>

          {/* Engineering Diagnostic Callout */}
          <div className={`rounded-xl border p-3.5 text-xs leading-relaxed sm:text-sm ${verdictBadgeClass}`}>
            <p className="font-bold flex items-center gap-1.5">
              <Gauge className="h-4 w-4 shrink-0" />
              Staff Field Diagnosis:
            </p>
            <p className="mt-1 text-foreground">{analysis.staffExplanation}</p>
          </div>
        </div>
      </div>

      {/* 4-Step Quick Staff Curve Cheat Sheet */}
      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border/80 bg-muted/15 p-3">
          <p className="text-xs font-bold text-foreground">Step 1 · Check Shutoff (Left Y-Axis)</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            At Q = 0, Shutoff Head must clear Static Lift + Sprinkler/Drip pressure. Never dead-head a closed valve—water heats inside the stages fast.
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-muted/15 p-3">
          <p className="text-xs font-bold text-foreground">Step 2 · Find Curve Intersection</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            A pump does NOT deliver its catalog max. It always lands exactly where the falling Pump Curve crosses the rising Farm Friction Curve.
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-muted/15 p-3">
          <p className="text-xs font-bold text-primary">Step 3 · Verify 70%–120% BEP Band</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Green band = Preferred Operating Range (POR). Bearings experience near-zero radial load and electrical efficiency reaches maximum.
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-muted/15 p-3">
          <p className="text-xs font-bold text-foreground">Step 4 · Avoid Left &amp; Right Danger</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            &lt;70% BEP triggers impeller recirculation &amp; heat; &gt;120% BEP causes suction cavitation, heavy down-thrust, and tripped motor overloads.
          </p>
        </div>
      </div>
    </section>
  );
}
