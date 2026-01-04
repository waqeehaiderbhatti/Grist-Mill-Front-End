import { Rating } from 'react-simple-star-rating';

export function StarRating({ rating }) {
  return (
    <Rating
      initialValue={rating}
      readonly
      size={20}
      fillColor="var(--primary)"
      emptyColor="#d9cfc1"
      SVGstyle={{ display: 'inline' }} 
    />
  );
}