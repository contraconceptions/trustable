import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, Download, FileText, Book, Bug, ExternalLink } from "lucide-react";

export default function QuickActions() {
  const handleInviteBot = () => {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || 'YOUR_BOT_CLIENT_ID';
    const permissions = '2147483648'; // Send Messages, Use Slash Commands
    const scope = 'bot%20applications.commands';
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scope}`;
    window.open(inviteUrl, '_blank');
  };

  const handleExportData = () => {
    // This would typically trigger a data export API call
    console.log('Export data clicked');
  };

  const handleViewLogs = () => {
    // This would navigate to logs or open a modal
    console.log('View logs clicked');
  };

  return (
    <Card className="bg-discord-gray border-discord-lightgray">
      <CardHeader>
        <h3 className="text-xl font-semibold text-discord-text">Quick Actions</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={handleInviteBot}
            className="w-full bg-discord-blue hover:bg-discord-blue/80 text-white py-3 px-4 font-medium"
          >
            <Link className="w-4 h-4 mr-2" />
            Generate Invite Link
          </Button>
          
          <Button 
            onClick={handleExportData}
            variant="outline"
            className="w-full bg-discord-gray hover:bg-discord-lightgray text-discord-text py-3 px-4 font-medium border-discord-lightgray"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          
          <Button 
            onClick={handleViewLogs}
            variant="outline"
            className="w-full bg-discord-gray hover:bg-discord-lightgray text-discord-text py-3 px-4 font-medium border-discord-lightgray"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Activity Logs
          </Button>
          
          <div className="border-t border-discord-lightgray pt-4 mt-6">
            <h4 className="font-medium text-discord-text mb-3">Support</h4>
            <div className="space-y-2">
              <a 
                href="#" 
                className="flex items-center text-discord-muted hover:text-discord-blue text-sm transition-colors duration-200"
              >
                <Book className="w-4 h-4 mr-2" />
                Documentation
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              <a 
                href="#" 
                className="flex items-center text-discord-muted hover:text-discord-blue text-sm transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Support Server
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              <a 
                href="#" 
                className="flex items-center text-discord-muted hover:text-discord-blue text-sm transition-colors duration-200"
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Issue
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
