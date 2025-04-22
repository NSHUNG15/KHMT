import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    fullName?: string;
    username?: string;
    image?: string;
  };
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const name = user.fullName || user.username || "User";
  
  return (
    <Avatar className={className}>
      {user.image && <AvatarImage src={user.image} alt={name} />}
      <AvatarFallback className="bg-primary text-primary-foreground">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
