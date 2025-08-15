import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Server, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@shared/schema";

export function StatsHighlights() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000,
  });

  const { data: botStatus } = useQuery({
    queryKey: ['/api/bot/status'],
    refetchInterval: 30000,
  });

  const highlights = [
    {
      icon: Users,
      value: stats?.totalUsers ? `${stats.totalUsers.toLocaleString()}` : "0",
      label: "Active Users",
      description: "Across all Discord servers",
      color: "text-blue-400"
    },
    {
      icon: Server,
      value: botStatus?.guildCount ? `${botStatus.guildCount}` : "0",
      label: "Discord Servers",
      description: "Building trust networks", 
      color: "text-green-400"
    },
    {
      icon: Award,
      value: stats?.totalRatings ? `${stats.totalRatings.toLocaleString()}` : "0",
      label: "Ratings Given",
      description: "Building community reputation",
      color: "text-purple-400"
    },
    {
      icon: TrendingUp,
      value: botStatus?.status === 'online' ? "99.9%" : "Offline",
      label: "Uptime",
      description: "Reliable 24/7 service",
      color: botStatus?.status === 'online' ? "text-yellow-400" : "text-red-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {highlights.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="bg-discord-dark border-discord-border p-4 text-center hover:bg-discord-dark/80 transition-colors">
            <div className={`inline-flex p-3 rounded-full bg-discord-darker/50 mb-3`}>
              <IconComponent className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-discord-text mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-discord-text mb-1">{stat.label}</div>
            <div className="text-xs text-discord-muted">{stat.description}</div>
          </Card>
        );
      })}
    </div>
  );
}