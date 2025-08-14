import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Star, Server, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@shared/schema";

interface StatsGridProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  const statCards = [
    {
      title: "Total Users Rated",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "discord-blue",
      change: "+12.3%"
    },
    {
      title: "Total Ratings Given",
      value: stats?.totalRatings || 0,
      icon: Star,
      color: "discord-green",
      change: "+8.7%"
    },
    {
      title: "Active Servers",
      value: stats?.activeServers || 0,
      icon: Server,
      color: "discord-yellow",
      change: "+5.2%"
    },
    {
      title: "Average Rating",
      value: stats?.averageRating ? Number(stats.averageRating).toFixed(1) : "0.0",
      icon: TrendingUp,
      color: "discord-blue",
      change: "2.8"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-discord-gray p-6 border-discord-lightgray hover:border-discord-blue/50 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              stat.color === 'discord-blue' ? 'bg-discord-blue/10' :
              stat.color === 'discord-green' ? 'bg-discord-green/10' :
              stat.color === 'discord-yellow' ? 'bg-discord-yellow/10' :
              'bg-discord-blue/10'
            }`}>
              <stat.icon className={`text-xl w-6 h-6 ${
                stat.color === 'discord-blue' ? 'text-discord-blue' :
                stat.color === 'discord-green' ? 'text-discord-green' :
                stat.color === 'discord-yellow' ? 'text-discord-yellow' :
                'text-discord-blue'
              }`} />
            </div>
            <span className="text-xs text-discord-green font-medium">
              {stat.change}
            </span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-discord-text mb-1">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </h3>
              <p className="text-discord-muted text-sm">{stat.title}</p>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
