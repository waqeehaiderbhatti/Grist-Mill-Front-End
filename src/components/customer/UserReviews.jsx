import { Card } from '../ui/card';
import { StarRating } from './StarRating';
import { motion } from 'framer-motion';

// Mock review data
const reviews = [
  {
    name: 'Ahmed A.',
    rating: 5,
    comment: "Incredible quality! The wheat grinding is perfect every time. Fast delivery and always fresh.",
  },
  {
    name: 'Fatima K.',
    rating: 4,
    comment: "My go-to for the 10kg Atta Bag. Consistent quality and saves me a trip to the market. Highly recommend.",
  },
  {
    name: 'Bilal M.',
    rating: 5,
    comment: "The multigrain atta is fantastic and so healthy. The staff is always friendly during pickup.",
  },
];

// Animation variants for Framer Motion
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function UserReviews() {
  return (
    <motion.section 
      className="py-8 sm:py-12 md:py-16 px-4 bg-secondary"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-center mb-6 sm:mb-8 md:mb-10 text-foreground">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {reviews.map((review, index) => (
            <Card key={index} className="p-6 flex flex-col gap-4 bg-card">
              <StarRating rating={review.rating} />
              <p className="text-foreground italic">"{review.comment}"</p>
              <p className="text-sm text-muted-foreground font-medium">- {review.name}</p>
            </Card>
          ))}
        </div>
      </div>
    </motion.section>
  );
}