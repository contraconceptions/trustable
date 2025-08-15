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
import { FeaturesShowcase } from "@/components/features-showcase";

import { StatsHighlights } from "@/components/stats-highlights";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import heroBannerImage from "@assets/generated_images/Dashboard_hero_banner_88642e6a.png";
import contraLogoImage from "@assets/contralogo_1755245922784.png";

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
        {/* Hero Banner */}
        <div className="relative mb-8 rounded-lg overflow-hidden bg-gradient-to-r from-discord-blue via-purple-600 to-indigo-600">
          <div className="absolute inset-0 bg-black/20 flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <img 
                src={contraLogoImage} 
                alt="Contra Logo" 
                className="w-16 h-16 bg-white rounded-lg p-2"
              />
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Trustable Dashboard</h1>
                <p className="text-gray-200 text-lg">Monitor your bot's performance and user ratings across all servers</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <AuthButton />
              <Button 
                onClick={() => {
                  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
                  if (!clientId || clientId === 'YOUR_BOT_CLIENT_ID') {
                    alert('Bot client ID not configured. Please contact the administrator.');
                    return;
                  }
                  const permissions = '2147483648'; // Send Messages, Use Slash Commands
                  const scope = 'bot%20applications.commands';
                  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scope}`;
                  window.open(inviteUrl, '_blank');
                }}
                className="bg-discord-blue hover:bg-discord-blue/80 text-white font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Invite Bot
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="overview">Server Overview</TabsTrigger>
            <TabsTrigger value="personal" disabled={!user}>My Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            {/* Network Statistics Highlights */}
            <StatsHighlights />
            
            {/* Stats Cards */}
            <StatsGrid stats={stats} isLoading={statsLoading} />

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <RecentRatings />
              <TopRatedUsers />
            </div>

            {/* Commands Guide & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <BotCommands />
              <QuickActions />
            </div>
            
            {/* Features Showcase */}
            <FeaturesShowcase />
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
