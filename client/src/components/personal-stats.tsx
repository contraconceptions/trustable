import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Star, Trophy, Users, Calendar } from 'lucide-react';

interface PersonalData {
  id: string;
  username: string;
  totalRatings: number;
  averageRating: string;
  ratingsReceived: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    raterUser: {
      username: string;
    };
    server: {
      name: string;
    };
  }>;
  createdAt: string;
}

export function PersonalStats() {
  const { data: personalData, isLoading, error } = useQuery<PersonalData>({
    queryKey: ['/api/me'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error || !personalData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Please log in to view your personal statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const avgRating = parseFloat(personalData.averageRating || '0');
  const ratingProgress = (avgRating / 3) * 100;
  
  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0]; // Index 0 unused, 1-3 for star ratings
  personalData.ratingsReceived.forEach(r => ratingCounts[r.rating]++);

  const getRatingBadge = (rating: number, count: number) => {
    if (count < 5) return { badge: '🆕', title: 'New Player' };
    if (rating >= 2.8) return { badge: '🏆', title: 'Champion' };
    if (rating >= 2.5) return { badge: '🥇', title: 'Gold Star Player' };
    if (rating >= 2.0) return { badge: '🥈', title: 'Silver Player' };
    if (rating >= 1.5) return { badge: '🥉', title: 'Bronze Player' };
    return { badge: '📈', title: 'Growing Player' };
  };

  const { badge, title } = getRatingBadge(avgRating, personalData.totalRatings);
  const serverCount = Array.from(new Set(personalData.ratingsReceived.map(r => r.server.name))).length;

  return (
    <div className="space-y-6">
      {/* Personal Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Reputation Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{badge}</span>
                <Badge variant="secondary">{title}</Badge>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(avgRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
                <span className="ml-2 font-semibold">
                  {avgRating.toFixed(2)}/3.0
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{personalData.totalRatings}</div>
              <div className="text-sm text-muted-foreground">Total Ratings</div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Rating Progress</span>
              <span>{avgRating.toFixed(1)}/3.0</span>
            </div>
            <Progress value={ratingProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Rating Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span>⭐⭐⭐</span>
                <span>Excellent</span>
              </span>
              <Badge variant="outline">{ratingCounts[3]}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span>⭐⭐</span>
                <span>Good</span>
              </span>
              <Badge variant="outline">{ratingCounts[2]}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span>⭐</span>
                <span>Poor</span>
              </span>
              <Badge variant="outline">{ratingCounts[1]}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Active Servers</span>
              <Badge variant="outline">{serverCount}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Member Since</span>
              <span className="text-sm text-muted-foreground">
                {new Date(personalData.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Ratings */}
      {personalData.ratingsReceived.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Ratings Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {personalData.ratingsReceived
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((rating) => (
                  <div key={rating.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1, 2, 3].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{rating.raterUser.username}</span>
                        <Badge variant="outline" className="text-xs">
                          {rating.server.name}
                        </Badge>
                      </div>
                      {rating.comment && (
                        <p className="text-sm text-muted-foreground">{rating.comment}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}