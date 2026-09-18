import React, { useState, useMemo } from "react";
import {
    Calculator,
    Droplets,
    TrendingUp,
    DollarSign,
    ArrowRight,
    Info,
    CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CROP_DATA = {
    maize: { name: "Maize", yieldIncrease: 35, waterSaving: 45, profitPerAcre: 50000 },
    tomatoes: { name: "Tomatoes", yieldIncrease: 80, waterSaving: 60, profitPerAcre: 150000 },
    cabbage: { name: "Cabbage", yieldIncrease: 50, waterSaving: 50, profitPerAcre: 80000 },
    onions: { name: "Onions", yieldIncrease: 60, waterSaving: 55, profitPerAcre: 120000 },
    other: { name: "Other Crops", yieldIncrease: 40, waterSaving: 50, profitPerAcre: 70000 },
};

export const IrrigationROICalculator = () => {
    const [acres, setAcres] = useState([1]);
    const [crop, setCrop] = useState("maize");

    const calculations = useMemo(() => {
        const data = CROP_DATA[crop as keyof typeof CROP_DATA];
        const acreVal = acres[0];

        // Estimated traditional yield vs smart drip yield
        const additionalProfit = (data.profitPerAcre * (data.yieldIncrease / 100)) * acreVal;
        const waterSavedLiters = acreVal * 500000 * (data.waterSaving / 100); // 500k liters approx per acre season
        const systemCost = acreVal * 120000; // Rough estimate KES 120k per acre
        const paybackMonths = (systemCost / (additionalProfit / 4)); // Assuming 4 months per season

        return {
            additionalProfit,
            waterSavedLiters,
            yieldIncrease: data.yieldIncrease,
            waterSaving: data.waterSaving,
            paybackMonths: Math.round(paybackMonths * 10) / 10,
        };
    }, [acres, crop]);

    return (
        <Card className="w-full max-w-4xl mx-auto border border-border shadow-2xl bg-background overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5">
                {/* Inputs Section */}
                <div className="lg:col-span-2 p-6 sm:p-8 bg-muted/30 border-r border-border">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Calculator className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground leading-tight">ROI Calculator</h3>
                            <p className="text-sm text-muted-foreground">Estimate your farm's potential</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold text-foreground">Land Size (Acres)</Label>
                                <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                                    {acres[0]} {acres[0] === 1 ? "Acre" : "Acres"}
                                </Badge>
                            </div>
                            <Slider
                                value={acres}
                                onValueChange={setAcres}
                                max={20}
                                min={0.5}
                                step={0.5}
                                className="py-4"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                <span>0.5 Acre</span>
                                <span>20 Acres</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-foreground">Target Crop</Label>
                            <Select value={crop} onValueChange={setCrop}>
                                <SelectTrigger className="w-full bg-background border-border">
                                    <SelectValue placeholder="Select crop" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(CROP_DATA).map(([key, data]) => (
                                        <SelectItem key={key} value={key}>
                                            {data.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3">
                            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                Results are based on average Kenyan agricultural data and DripTech system efficiency benchmarks.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-3 p-6 sm:p-8 bg-background relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-0" />

                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8 relative z-10">Estimated Seasonal Impact</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                        {/* Profit Card */}
                        <div className="bg-muted/30 p-5 rounded-2xl border border-border group transition-all hover:border-primary/30">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold text-muted-foreground uppercase">Extra Profit</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-foreground mb-1">
                                KSh {calculations.additionalProfit.toLocaleString()}
                            </div>
                            <div className="text-xs font-semibold text-primary flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                +{calculations.yieldIncrease}% higher yield
                            </div>
                        </div>

                        {/* Water Saving Card */}
                        <div className="bg-muted/30 p-5 rounded-2xl border border-border transition-all hover:border-primary/30">
                            <div className="flex items-center gap-2 mb-3">
                                <Droplets className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold text-muted-foreground uppercase">Water Saved</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-foreground mb-1">
                                {calculations.waterSavedLiters.toLocaleString()} L
                            </div>
                            <div className="text-xs font-semibold text-primary flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {calculations.waterSaving}% more efficient
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-border relative z-10">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Payback Period</div>
                                <div className="text-2xl font-black text-foreground flex items-baseline gap-2">
                                    ~{calculations.paybackMonths}
                                    <span className="text-sm font-bold text-muted-foreground">Seasons</span>
                                </div>
                            </div>
                            <Button
                                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 rounded-xl font-bold text-base shadow-xl transition-all hover:translate-x-1"
                                onClick={() => window.location.href = '/contact'}
                            >
                                Get Custom Plan
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default IrrigationROICalculator;
