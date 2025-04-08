import React from 'react';
import { Button } from './ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  subtitle: string;
  showBackButton?: boolean;
  backButtonDestination?: string;
}

const Header = ({
  title,
  subtitle,
  showBackButton = false,
  backButtonDestination,
}: HeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (backButtonDestination) {
      router.push(backButtonDestination);
    } else {
      router.back();
    }
  };

  return (
    <div className="mb-5 flex items-center">
      {showBackButton && (
        <Button
          variant="ghost"
          className="p-0 mr-4 hover:bg-transparent"
          onClick={handleBack}
        >
          <ChevronLeft className="w-6 h-6 text-primary-700" />
        </Button>
      )}
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

export default Header;
