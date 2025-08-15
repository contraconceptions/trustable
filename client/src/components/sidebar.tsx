import { Card } from "@/components/ui/card";
import { BarChart3, Users, Server, Shield, Settings } from "lucide-react";
import contraLogoImage from "@assets/contralogo_1755245922784.png";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", icon: BarChart3, active: true },
    { name: "User Ratings", icon: Users, active: false },
    { name: "Servers", icon: Server, active: false },
    { name: "Moderation", icon: Shield, active: false },
    { name: "Settings", icon: Settings, active: false },
  ];

  return (
    <aside className="w-64 bg-discord-dark fixed left-0 top-0 h-full border-r border-discord-lightgray z-40">
      <div className="p-6">
        {/* Bot Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <img 
            src={contraLogoImage} 
            alt="Contra Logo" 
            className="w-10 h-10 bg-white rounded-lg p-1"
          />
          <h1 className="text-xl font-bold text-discord-text">GamerRating</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href="#"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                item.active
                  ? "bg-discord-blue/10 text-discord-blue border-l-4 border-discord-blue"
                  : "text-discord-muted hover:text-discord-text hover:bg-discord-gray"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className={item.active ? "font-medium" : ""}>{item.name}</span>
            </a>
          ))}
        </nav>

        {/* Bot Status */}
        <Card className="mt-8 p-4 bg-discord-gray border-discord-lightgray">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-discord-muted">Bot Status</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-discord-green rounded-full animate-pulse"></div>
              <span className="text-xs text-discord-green font-medium">Online</span>
            </div>
          </div>
          <p className="text-xs text-discord-muted">Active in 247 servers</p>
        </Card>
      </div>
    </aside>
  );
}
