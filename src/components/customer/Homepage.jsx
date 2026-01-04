import { useState, useEffect } from 'react';
import { ServiceCard } from './ServiceCard';
// Assuming types.js exports 'services'
import { services as defaultServiceList } from '../../lib/types';
import { UserReviews } from './UserReviews';
import { Card } from '../ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from '../ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

// Import your custom local images
import wheatImg from '../../assets/Wheat and Flour.png';
import gramImg from '../../assets/Gram and pulses.png';
import riceImg from '../../assets/Rice.png';
import spicesImg from '../../assets/Spices.png';
import cottonImg from '../../assets/cotton.png';
import convenienceImg from '../../assets/convienece serviecs.png';

// Import hero carousel images
import hero1 from '../../assets/hero-carousel-1.png';
import hero2 from '../../assets/hero-carousel-2.png';
import hero3 from '../../assets/hero-carousel-3.png';
import hero4 from '../../assets/hero-carousel-4.png';
import heroBg from '../../assets/hero-background.png';

const HERO_SLIDES = [
  { img: hero1, title: "Apka Bhrosa Apki Apni Chakki" },
  { img: hero2, title: "Milawat Se Azadi, Bharosay Ki Guarantee" },
  { img: hero3, title: "Purani Chakki, Naya Digital Andaz" },
  { img: hero4, title: "Chakki Jo Samjhay Apki Zarurat" },
  { img: heroBg, title: "Apna Dana, Apni Pehchan" },
];

const CATEGORIES = [
  {
    id: 'wheat',
    labelKey: 'Wheat & Flour',
    imageUrl: wheatImg,
    overlayColor: 'bg-amber-600/30',
  },
  {
    id: 'gram',
    labelKey: 'Gram & Pulses',
    imageUrl: gramImg,
    overlayColor: 'bg-yellow-600/30',
  },
  {
    id: 'rice',
    labelKey: 'Rice Products',
    imageUrl: riceImg,
    overlayColor: 'bg-emerald-600/30',
  },
  {
    id: 'spices',
    labelKey: 'Spices',
    imageUrl: spicesImg,
    overlayColor: 'bg-red-600/40',
  },
  {
    id: 'cotton',
    labelKey: 'Cotton & Quilts',
    imageUrl: cottonImg,
    overlayColor: 'bg-indigo-600/40',
  },
  {
    id: 'service',
    labelKey: 'Convenience Services',
    imageUrl: convenienceImg,
    overlayColor: 'bg-blue-600/40',
  }
];

export function Homepage() {
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadServices = () => {
      const stored = localStorage.getItem('services');
      if (stored) {
        setServices(JSON.parse(stored));
      } else {
        localStorage.setItem('services', JSON.stringify(defaultServiceList));
        setServices(defaultServiceList);
      }
    };

    loadServices();
  }, []);

  const getServicesByCategory = (categoryId) => {
    if (categoryId === 'service') {
      return services.filter(s => s.category === 'service');
    }

    return services.filter(service => {
      const name = service.name.toLowerCase();
      return (
        service.category === categoryId ||
        name.includes(categoryId) ||
        (categoryId === 'wheat' && (name.includes('wheat') || name.includes('atta') || name.includes('flour'))) ||
        (categoryId === 'gram' && (name.includes('gram') || name.includes('besan') || name.includes('chana'))) ||
        (categoryId === 'rice' && (name.includes('rice') || name.includes('basmati'))) ||
        (categoryId === 'spices' && (name.includes('spice') || name.includes('masala') || name.includes('mirch'))) ||
        (categoryId === 'cotton' && (name.includes('cotton') || name.includes('roi') || name.includes('quilt')))
      );
    });
  };

  const getOtherServices = () => {
    return services.filter(service => !service.category);
  };

  const displayedServices = selectedCategory
    ? (selectedCategory === 'other' ? getOtherServices() : getServicesByCategory(selectedCategory))
    : [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: false,
            }),
          ]}
          className="w-full h-full relative"
        >
          <CarouselContent className="ml-0 h-full">
            {HERO_SLIDES.map((slide, index) => (
              <CarouselItem
                key={index}
                className="pl-0 relative bg-stone-900 overflow-hidden h-full"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 hover:scale-110"
                  style={{ backgroundImage: `url(${slide.img})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
                </div>

                {/* Text Content */}
                <div className="relative h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 z-10">
                  <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-7xl mb-4 px-4 font-bold tracking-tight drop-shadow-2xl max-w-4xl leading-tight">
                    {t(slide.title)}
                  </h1>
                  <p className="text-white/90 text-base sm:text-lg md:text-2xl max-w-2xl px-4 font-medium drop-shadow-lg leading-relaxed">
                    {t("Premium quality flour, spices, and cotton services. Ground fresh daily.")}
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* ✅ CORRECTLY PLACED INDICATOR DOTS — inside Carousel */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
            <CarouselDots />
          </div>
        </Carousel>
      </section>

      {/* Our Services Section */}
      <section className="py-8 sm:py-12 md:py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          {!selectedCategory ? (
            <>
              <h2 className="text-center mb-6 sm:mb-8 md:mb-10 text-3xl font-bold text-foreground">
                {t('Our Services')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {CATEGORIES.map((category) => (
                  <Card
                    key={category.id}
                    className="cursor-pointer rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 group relative overflow-hidden w-full"
                    style={{ height: '300px' }}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                      style={{ backgroundImage: `url(${category.imageUrl})` }}
                    />
                    <div className={`absolute inset-0 ${category.overlayColor} group-hover:opacity-70 transition-opacity duration-300`} />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
                    <div className="relative h-full flex items-center justify-center px-6">
                      <h3 className="text-xl md:text-2xl font-bold text-white text-center drop-shadow-2xl leading-tight">
                        {t(category.labelKey)}
                      </h3>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-2 hover:bg-secondary"
                >
                  <ArrowLeft className="h-4 w-4" /> {t('Back to Categories')}
                </Button>
                <h2 className="text-2xl font-bold text-foreground">
                  {t(CATEGORIES.find(c => c.id === selectedCategory)?.labelKey || '')}
                </h2>
              </div>

              {displayedServices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                  {displayedServices.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-secondary/30 rounded-lg">
                  <p>{t('No products found in this category.')}</p>
                  <Button variant="link" onClick={() => setSelectedCategory(null)}>
                    {t('Back to Categories')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <UserReviews />

      {/* Why Choose Us Section */}
      <section className="py-8 sm:py-12 md:py-16 px-4 bg-secondary/20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-4 sm:mb-6 text-3xl font-bold text-foreground">
            {t('Why Choose')} Apni Atta Chakki?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mt-6 sm:mt-8">
            <div className="p-5 sm:p-6 bg-card rounded-lg shadow-sm">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🌾</div>
              <h4 className="mb-2 text-xl font-semibold text-foreground">{t('Pure & Fresh')}</h4>
              <p className="text-muted-foreground text-sm sm:text-base">{t('Grains ground fresh daily with no additives.')}</p>
            </div>
            <div className="p-5 sm:p-6 bg-card rounded-lg shadow-sm">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🧵</div>
              <h4 className="mb-2 text-xl font-semibold text-foreground">{t('Traditional Services')}</h4>
              <p className="text-muted-foreground text-sm sm:text-base">{t('Expert Cotton Penja and Quilt filling services.')}</p>
            </div>
            <div className="p-5 sm:p-6 bg-card rounded-lg shadow-sm sm:col-span-2 md:col-span-1">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🚚</div>
              <h4 className="mb-2 text-xl font-semibold text-foreground">{t('Convenience')}</h4>
              <p className="text-muted-foreground text-sm sm:text-base">{t('Home pickup and delivery available.')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}