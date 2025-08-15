import { Card } from "@/components/ui/card";
import featureIconsImage from "@assets/generated_images/Feature_icons_set_f5ad3eed.png";
import { Network, Star, BarChart3, MessageSquare, UserCheck, Shield } from "lucide-react";

const features = [
  {
    icon: Network,
    title: "Cross-Server Network",
    description: "Reputation follows users across all Discord servers with the bot installed"
  },
  {
    icon: Star,
    title: "Interactive Ratings",
    description: "1-3 star system with buttons, modals, and detailed feedback forms"
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Live dashboard with personal stats, leaderboards, and server insights"
  },
  {
    icon: MessageSquare,
    title: "Discord Integration",
    description: "Slash commands, context menus, and rich embeds with modern Discord API"
  },
  {
    icon: UserCheck,
    title: "User Profiles",
    description: "Comprehensive reputation profiles with badges, titles, and achievement tracking"
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description: "OAuth authentication, rate limiting, and admin moderation tools"
  }
];

export function FeaturesShowcase() {
  return (
    <Card className="bg-discord-dark border-discord-border p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-discord-text mb-2">Powerful Features</h2>
        <p className="text-discord-muted">Everything you need for a comprehensive reputation system</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div key={index} className="text-center group hover:scale-105 transition-transform duration-200">
              <div className="bg-discord-blue/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-discord-blue/20 transition-colors">
                <IconComponent className="w-8 h-8 text-discord-blue" />
              </div>
              <h3 className="font-semibold text-discord-text mb-2">{feature.title}</h3>
              <p className="text-sm text-discord-muted leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-discord-blue/20 to-purple-500/20 rounded-lg p-4 border border-discord-blue/30">
          <p className="text-discord-text font-medium">
            Join the cross-server reputation network and build trust across Discord communities
          </p>
        </div>
      </div>
    </Card>
  );
}