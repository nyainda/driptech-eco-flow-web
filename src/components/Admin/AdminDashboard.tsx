
import RealDataDashboard from "./RealDataDashboard";
import AnalyticsDashboard from "./Analytics/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Business Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Website Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <RealDataDashboard />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
