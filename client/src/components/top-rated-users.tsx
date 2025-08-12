import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import type { TopRatedUser } from "@shared/schema";

function getStarDisplay(rating: number) {
  return Array.from({ length: 3 }, (_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${i < rating ? 'text-discord-yellow fill-current' : 'text-discord-muted'}`}
    />
  ));
}

function getInitials(username: string): string {
  return username.split('#')[0].slice(0, 2).toUpperCase();
}

function getAvatarGradient(username: string): string {
  const colors = [
    'from-discord-green to-discord-blue',
    'from-discord-blue to-discord-green',
    'from-discord-yellow to-discord-red',
    'from-discord-red to-discord-blue',
    'from-discord-blue to-discord-yellow'
  ];
  const index = username.length % colors.length;
  return colors[index];
}

function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

export default function TopRatedUsers() {
  const { data: topUsers, isLoading } = useQuery<TopRatedUser[]>({
    queryKey: ["/api/users/top"],
    refetchInterval: 60000, // Refresh every minute
  });

  return (
    <Card className="bg-discord-gray border-discord-lightgray">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-discord-text">Top Rated Users</h3>
          <Button variant="ghost" className="text-discord-blue hover:text-discord-blue/80 text-sm font-medium">
            View Leaderboard
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))
          ) : topUsers && topUsers.length > 0 ? (
            topUsers.map((user: TopRatedUser) => {
              const avgRating = parseFloat(user.averageRating || '0');
              return (
                <div key={user.id} className="flex items-center space-x-4 p-3 hover:bg-discord-dark rounded-lg transition-all duration-200">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-discord-yellow to-discord-green text-discord-text font-bold text-sm">
                    <span>{getRankBadge(user.rank)}</span>
                  </div>
                  <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient(user.username)} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-semibold text-sm">
                      {getInitials(user.username)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-discord-text">
                        {user.username}
                        {user.discriminator && `#${user.discriminator}`}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-discord-yellow fill-current" />
                        <span className="font-semibold text-discord-text">
                          {avgRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-discord-muted">
                      Based on {user.totalRatings} ratings across {user.serverCount} servers
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-discord-muted">No rated users found</p>
              <p className="text-xs text-discord-muted mt-1">Users need at least 5 ratings to appear on the leaderboard</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
