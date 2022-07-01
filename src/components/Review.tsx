export interface ReviewItem {
  currentSrsStage: number;
}

export interface Card {
  front: string;
  back: string;
  notes: string;
}

export interface ReviewProps {
  item: ReviewItem;
  card: Card;
  onAnswer: (correct: boolean) => void;
  onSkip: () => void;
}

export default function Review(_: ReviewProps) {
  return <div>Review</div>;
}
