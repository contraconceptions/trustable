import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogIn, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface AuthUser {
  id: string;
  username: string;
  discriminator?: string;
  avatarUrl?: string;
}

export function AuthButton() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ['/auth/user'],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/auth/logout');
      if (!response.ok) throw new Error('Logout failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/auth/user'] });
      window.location.href = '/';
    },
  });

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button 
        variant="default" 
        size="sm"
        onClick={() => window.location.href = '/auth/discord'}
      >
        <LogIn className="h-4 w-4 mr-2" />
        Login with Discord
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{user.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>
          <User className="h-4 w-4 mr-2" />
          {user.username}#{user.discriminator}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}