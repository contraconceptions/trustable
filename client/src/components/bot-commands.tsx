import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star, Search, List, Shield } from "lucide-react";

const commands = [
  {
    name: "/rate",
    description: "Rate a user 1-3 stars",
    example: '/rate @username 3 "Great teammate!"',
    icon: Star,
    color: "discord-blue"
  },
  {
    name: "/rating",
    description: "Check user's rating",
    example: "/rating @username",
    icon: Search,
    color: "discord-green"
  },
  {
    name: "/leaderboard",
    description: "View top rated users",
    example: "/leaderboard",
    icon: List,
    color: "discord-yellow"
  },
  {
    name: "/moderate",
    description: "Mod only - manage ratings",
    example: "/moderate remove @user",
    icon: Shield,
    color: "discord-red"
  }
];

export default function BotCommands() {
  return (
    <div className="lg:col-span-2">
      <Card className="bg-discord-gray border-discord-lightgray">
        <CardHeader>
          <h3 className="text-xl font-semibold text-discord-text">Available Commands</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commands.map((command, index) => (
              <div key={index} className="bg-discord-dark p-4 rounded-lg border border-discord-lightgray">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 bg-${command.color}/10 rounded`}>
                    <command.icon className={`text-${command.color} w-5 h-5`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-discord-text">{command.name}</h4>
                    <p className="text-xs text-discord-muted">{command.description}</p>
                  </div>
                </div>
                <div className="bg-discord-darker p-3 rounded font-mono text-sm text-discord-text">
                  {command.example}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
