import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import type { RecentRating } from "@shared/schema";

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
    'from-discord-blue to-discord-green',
    'from-discord-green to-discord-yellow',
    'from-discord-red to-discord-blue',
    'from-discord-yellow to-discord-red',
    'from-discord-blue to-discord-yellow'
  ];
  const index = username.length % colors.length;
  return colors[index];
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const ratingDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - ratingDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

export default function RecentRatings() {
  const { data: recentRatings, isLoading } = useQuery({
    queryKey: ["/api/ratings/recent"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return (
    <Card className="bg-discord-gray border-discord-lightgray">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-discord-text">Recent Ratings</h3>
          <Button variant="ghost" className="text-discord-blue hover:text-discord-blue/80 text-sm font-medium">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))
          ) : recentRatings && recentRatings.length > 0 ? (
            recentRatings.map((rating: RecentRating) => (
              <div key={rating.id} className="flex items-center space-x-4 p-3 hover:bg-discord-dark rounded-lg transition-all duration-200">
                <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarGradient(rating.ratedUser.username)} rounded-full flex items-center justify-center`}>
                  <span className="text-white font-semibold text-sm">
                    {getInitials(rating.ratedUser.username)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-discord-text">
                      {rating.ratedUser.username}
                      {rating.ratedUser.discriminator && `#${rating.ratedUser.discriminator}`}
                    </span>
                    <span className="text-xs text-discord-muted">
                      {formatTimeAgo(rating.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex space-x-1">
                      {getStarDisplay(rating.rating)}
                    </div>
                    <span className="text-xs text-discord-muted">
                      from {rating.server.name}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-discord-muted">No recent ratings found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
