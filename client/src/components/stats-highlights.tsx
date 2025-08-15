import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Server, Award } from "lucide-react";

const highlights = [
  {
    icon: Users,
    value: "10,000+",
    label: "Active Users",
    description: "Across all Discord servers",
    color: "text-blue-400"
  },
  {
    icon: Server,
    value: "500+",
    label: "Discord Servers",
    description: "Building trust networks",
    color: "text-green-400"
  },
  {
    icon: Award,
    value: "50,000+",
    label: "Ratings Given",
    description: "Building community reputation",
    color: "text-purple-400"
  },
  {
    icon: TrendingUp,
    value: "99.9%",
    label: "Uptime",
    description: "Reliable 24/7 service",
    color: "text-yellow-400"
  }
];

export function StatsHighlights() {
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