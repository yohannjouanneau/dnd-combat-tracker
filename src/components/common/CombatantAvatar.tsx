import { useState } from 'react';
import { User } from 'lucide-react';

type Props = {
  imageUrl?: string;
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
};

export default function CombatantAvatar({ imageUrl, name, color, size = 'md' }: Props) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Get initials from name (max 2 characters)
  const getInitials = () => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Show image if URL exists and hasn't errored
  if (imageUrl && !imageError) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg flex-shrink-0 overflow-hidden border-2`}
        style={{ borderColor: color }}
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback to initials or icon
  return (
    <div 
      className={`${sizeClasses[size]} rounded-lg flex-shrink-0 flex items-center justify-center font-bold border-2`}
      style={{ 
        backgroundColor: `${color}20`,
        borderColor: color,
        color: color
      }}
    >
      {name ? getInitials() : <User className={iconSizes[size]} />}
    </div>
  );
}