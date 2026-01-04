import { Languages } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';

export function LanguageToggle({ className }) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-3 min-w-[80px] justify-center border-input bg-transparent hover:bg-accent hover:text-accent-foreground ${className}`}
          >
            <Languages className="h-4 w-4" />
            <span className="font-semibold text-xs">
              {i18n.language === 'en' ? 'English' : 'اردو'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Switch to {i18n.language === 'en' ? 'Urdu' : 'English'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}