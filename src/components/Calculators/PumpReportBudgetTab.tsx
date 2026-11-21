import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookmarkCheck,
  Database,
  Download,
  FileDown,
  FolderOpen,
  Link2,
  Send,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  computeCustomFinancialSummary,
  CustomCostFigures,
  CustomProjectMetadata,
  MatchedPumpRecommendation,
  PumpSolarInputs,
  PumpSolarResult,
} from "@/lib/pumpSolarSizing";
import { SavedPumpReportRecord } from "@/services/pumpReportService";

interface PumpReportBudgetTabProps {
  inputs: PumpSolarInputs;
  result: PumpSolarResult;
  projectMeta: CustomProjectMetadata;
  onChangeProjectMeta: (next: CustomProjectMetadata) => void;
  customCosts: CustomCostFigures;
  onChangeCustomCosts: (next: CustomCostFigures) => void;
  matchedPumps: MatchedPumpRecommendation[];
  savedReports: SavedPumpReportRecord[];
  savingDb: boolean;
  lastSavedCode: string | null;
  lastShareUrl: string | null;
  onSaveReport: (requestReview: boolean) => void;
  onCopyShareLink: () => void;
  onDownloadPdfReport: () => void;
  onDownloadHtmlReport: () => void;
  onLoadSavedReport: (record: SavedPumpReportRecord) => void;
  onDeleteSavedReport: (reportCode: string) => void;
}

const parseOptionalMoney = (raw: string): number | null => {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : null;
};

export const PumpReportBudgetTab = ({
  inputs,
  result,
  projectMeta,
  onChangeProjectMeta,
  customCosts,
  onChangeCustomCosts,
  matchedPumps,
  savedReports,
  savingDb,
  lastSavedCode,
  lastShareUrl,
  onSaveReport,
  onCopyShareLink,
  onDownloadPdfReport,
  onDownloadHtmlReport,
  onLoadSavedReport,
  onDeleteSavedReport,
}: PumpReportBudgetTabProps) => {
  const financial = computeCustomFinancialSummary(
    customCosts,
    result,
    inputs.electricityTariffKesKwh,
  );
  const topMatchedWithPrice = matchedPumps.find(
    (m) => typeof m.product.price === "number" && m.product.price > 0,
  );

  return (
    <div className="space-y-5">
      {/* 1. Project Identification & Borehole Notes */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
            <BookmarkCheck className="h-5 w-5 text-primary" />
            Custom Project Details &amp; Save to Database
          </CardTitle>
          <CardDescription>
            Customize client/farm names, location, and engineering notes printed on your PDF report and stored cleanly with a shareable report code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rep-project-name">Project / Design Title</Label>
              <Input
                id="rep-project-name"
                value={projectMeta.projectName}
                onChange={(e) =>
                  onChangeProjectMeta({ ...projectMeta, projectName: e.target.value })
                }
                placeholder="e.g. 2-Acre Tomato Drip Borehole Solar Setup"
                className="bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rep-client-name">Client / Farm Name</Label>
              <Input
                id="rep-client-name"
                value={projectMeta.clientName}
                onChange={(e) =>
                  onChangeProjectMeta({ ...projectMeta, clientName: e.target.value })
                }
                placeholder="e.g. Wanjiku Farm / Kamau"
                className="bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rep-county">County / Town / Ward</Label>
              <Input
                id="rep-county"
                value={projectMeta.countyTown}
                onChange={(e) =>
                  onChangeProjectMeta({ ...projectMeta, countyTown: e.target.value })
                }
                placeholder="e.g. Limuru, Kiambu County"
                className="bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rep-phone">Phone (optional — for engineer follow-up)</Label>
              <Input
                id="rep-phone"
                value={projectMeta.clientPhone}
                onChange={(e) =>
                  onChangeProjectMeta({ ...projectMeta, clientPhone: e.target.value })
                }
                placeholder="07XX XXX XXX"
                className="bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rep-email">Email (optional)</Label>
              <Input
                id="rep-email"
                type="email"
                value={projectMeta.clientEmail}
                onChange={(e) =>
                  onChangeProjectMeta({ ...projectMeta, clientEmail: e.target.value })
                }
                placeholder="client@example.com"
                className="bg-card"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rep-notes">Technical / Site Notes on Printed Report</Label>
              <Textarea
                id="rep-notes"
                rows={2}
                value={projectMeta.notes}
                onChange={(e) =>
                  onChangeProjectMeta({ ...projectMeta, notes: e.target.value })
                }
                placeholder="e.g. Submersible pump at 72m depth, 10,000L elevated masonry tower, gravity feed to Block A-D."
                className="bg-card text-xs"
              />
            </div>
          </div>

          {/* Action Bar: Download, PDF, Save DB */}
          <div className="grid grid-cols-1 gap-2 border-t border-border pt-4 sm:grid-cols-2">
            <Button
              type="button"
              onClick={onDownloadPdfReport}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Save / Print A4 PDF Report
            </Button>

            <Button type="button" variant="outline" onClick={onDownloadHtmlReport}>
              <Download className="mr-2 h-4 w-4" />
              Download Portable Report File
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={savingDb}
              onClick={() => onSaveReport(false)}
            >
              <Database className="mr-2 h-4 w-4 text-primary" />
              {savingDb ? "Saving..." : "Save to Database & Get Link"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={savingDb}
              onClick={() => onSaveReport(true)}
            >
              <Send className="mr-2 h-4 w-4 text-primary" />
              Save &amp; Request Engineer Review
            </Button>
          </div>

          {lastShareUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
              <div className="min-w-0 flex-1">
                <span className="font-bold text-primary">
                  Saved Ref: {lastSavedCode}
                </span>
                <p className="truncate text-[11px] text-muted-foreground">{lastShareUrl}</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={onCopyShareLink}>
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                Copy Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Custom User Budget & Fuel Payback Figures */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 font-heading text-lg font-bold">
                <Wallet className="h-5 w-5 text-primary" />
                Custom Cost Figures &amp; Payback Calculator
              </CardTitle>
              <CardDescription>
                Enter your own supplier or contractor KSh figures to include a full project budget and fuel savings payback table in your report.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-custom-costs" className="text-xs text-muted-foreground">
                Include in Report
              </Label>
              <Switch
                id="toggle-custom-costs"
                checked={customCosts.includeInReport}
                onCheckedChange={(checked) =>
                  onChangeCustomCosts({ ...customCosts, includeInReport: checked })
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {topMatchedWithPrice && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/25 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                Top matched pump:{" "}
                <strong className="text-foreground">{topMatchedWithPrice.product.name}</strong> (
                KSh {topMatchedWithPrice.product.price?.toLocaleString("en-KE")})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs font-semibold text-primary"
                onClick={() =>
                  onChangeCustomCosts({
                    ...customCosts,
                    includeInReport: true,
                    pumpUnitKes: topMatchedWithPrice.product.price ?? null,
                  })
                }
              >
                Use Catalogue Price
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Pump &amp; Motor Cost (KSh)</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 85000"
                value={customCosts.pumpUnitKes ?? ""}
                onChange={(e) =>
                  onChangeCustomCosts({
                    ...customCosts,
                    includeInReport: true,
                    pumpUnitKes: parseOptionalMoney(e.target.value),
                  })
                }
                className="h-9 bg-card text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Solar Panels &amp; Controller (KSh)</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 120000"
                value={customCosts.solarArrayCtrlKes ?? ""}
                onChange={(e) =>
                  onChangeCustomCosts({
                    ...customCosts,
                    includeInReport: true,
                    solarArrayCtrlKes: parseOptionalMoney(e.target.value),
                  })
                }
                className="h-9 bg-card text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Pipes, Risers &amp; Fittings (KSh)</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 65000"
                value={customCosts.pipesFittingsKes ?? ""}
                onChange={(e) =>
                  onChangeCustomCosts({
                    ...customCosts,
                    includeInReport: true,
                    pipesFittingsKes: parseOptionalMoney(e.target.value),
                  })
                }
                className="h-9 bg-card text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Cable, SPD &amp; Surge Box (KSh)</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 32000"
                value={customCosts.cableProtectionKes ?? ""}
                onChange={(e) =>
                  onChangeCustomCosts({
                    ...customCosts,
                    includeInReport: true,
                    cableProtectionKes: parseOptionalMoney(e.target.value),
                  })
                }
                className="h-9 bg-card text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tank &amp; Tower / Pad (KSh)</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 95000"
                value={customCosts.tankCivilKes ?? ""}
                onChange={(e) =>
                  onChangeCustomCosts({
                    ...customCosts,
                    includeInReport: true,
                    tankCivilKes: parseOptionalMoney(e.target.value),
                  })
                }
                className="h-9 bg-card text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Labor, Test &amp; Install (KSh)</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 45000"
                value={customCosts.installationTestKes ?? ""}
                onChange={(e) =>
                  onChangeCustomCosts({
                    ...customCosts,
                    includeInReport: true,
                    installationTestKes: parseOptionalMoney(e.target.value),
                  })
                }
                className="h-9 bg-card text-xs"
              />
            </div>
          </div>

          {/* Fuel / Grid Baseline Comparison */}
          <div className="grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Compare Solar Against</Label>
              <Select
                value={customCosts.compareBaselineFuel}
                onValueChange={(val: "petrol_diesel" | "kplc_grid") =>
                  onChangeCustomCosts({ ...customCosts, compareBaselineFuel: val })
                }
              >
                <SelectTrigger className="h-9 bg-card text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol_diesel">Petrol / Diesel Fuel Pump</SelectItem>
                  <SelectItem value="kplc_grid">KPLC Grid Power Tariff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Your Daily Fuel / Bill Cost (KSh)</Label>
              <Input
                type="number"
                min={0}
                placeholder="Optional custom KSh/day"
                value={customCosts.dailyBaselineFuelCostKes ?? ""}
                onChange={(e) =>
                  onChangeCustomCosts({
                    ...customCosts,
                    dailyBaselineFuelCostKes: parseOptionalMoney(e.target.value),
                  })
                }
                className="h-9 bg-card text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Pumping Days / Year</Label>
              <Input
                type="number"
                min={30}
                max={365}
                value={customCosts.irrigationDaysPerYear}
                onChange={(e) =>
                  onChangeCustomCosts({
                    ...customCosts,
                    irrigationDaysPerYear: Math.max(
                      30,
                      Math.min(365, Number(e.target.value) || 240),
                    ),
                  })
                }
                className="h-9 bg-card text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs sm:grid-cols-3">
            <div>
              <div className="text-muted-foreground">Total Custom Budget</div>
              <div className="mt-0.5 font-heading text-base font-extrabold text-foreground">
                {financial.hasAnyCost
                  ? `KSh ${financial.totalCustomCapexKes.toLocaleString("en-KE")}`
                  : "Enter costs above"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Est. Annual Energy Savings</div>
              <div className="mt-0.5 font-heading text-base font-extrabold text-primary">
                KSh {financial.annualSavingsKes.toLocaleString("en-KE")}/yr
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Estimated Payback</div>
              <div className="mt-0.5 font-heading text-base font-extrabold text-foreground">
                {financial.paybackYears !== null ? `~${financial.paybackYears} years` : "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Saved Designs History */}
      {savedReports.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-heading text-base font-bold">
              <FolderOpen className="h-4 w-4 text-primary" />
              Your Saved Sizing Designs ({savedReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {savedReports.map((item) => (
              <div
                key={item.reportCode}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {item.reportCode}
                    </Badge>
                    <strong className="truncate text-foreground">
                      {item.projectMeta.projectName}
                    </strong>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {item.resultSummary.designFlowM3h} m³/h @ {item.resultSummary.totalDynamicHeadM}m TDH •{" "}
                    {item.resultSummary.nearestStandardHp} HP • {item.resultSummary.installedArrayWp} Wp PV
                    {item.resultSummary.totalCustomCapexKes > 0
                      ? ` • KSh ${item.resultSummary.totalCustomCapexKes.toLocaleString("en-KE")}`
                      : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => onLoadSavedReport(item)}
                  >
                    Load
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete saved design ${item.reportCode}`}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteSavedReport(item.reportCode)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PumpReportBudgetTab;
