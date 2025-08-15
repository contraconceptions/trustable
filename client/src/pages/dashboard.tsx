import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import StatsGrid from "@/components/stats-grid";
import RecentRatings from "@/components/recent-ratings";
import TopRatedUsers from "@/components/top-rated-users";
import BotCommands from "@/components/bot-commands";
import QuickActions from "@/components/quick-actions";
import { AuthButton } from "@/components/auth-button";
import { PersonalStats } from "@/components/personal-stats";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: user } = useQuery({
    queryKey: ['/auth/user'],
    retry: false,
  });

  return (
    <div className="flex min-h-screen bg-discord-darker">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-discord-text mb-2">Dashboard</h1>
            <p className="text-discord-muted">Monitor your bot's performance and user ratings across all servers</p>
          </div>
          <div className="flex items-center gap-4">
            <AuthButton />
            <Button className="bg-discord-blue hover:bg-discord-blue/80 text-white font-medium">
              <Plus className="w-4 h-4 mr-2" />
              Invite Bot
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="overview">Server Overview</TabsTrigger>
            <TabsTrigger value="personal" disabled={!user}>My Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <StatsGrid stats={stats} isLoading={statsLoading} />

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <RecentRatings />
              <TopRatedUsers />
            </div>

            {/* Commands Guide & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <BotCommands />
              <QuickActions />
            </div>
          </TabsContent>
          
          <TabsContent value="personal" className="space-y-8">
            {user ? (
              <PersonalStats />
            ) : (
              <div className="text-center py-12">
                <p className="text-discord-muted mb-4">Please log in to view your personal statistics</p>
                <AuthButton />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
