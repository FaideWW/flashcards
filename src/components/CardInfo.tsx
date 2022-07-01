interface Card {
  id: string;
  front: string;
  back: string;
}

interface Item {
  currentSrsStage: number;
  nextAvailable: Date;
  timesReviewed: number;
}

export default function CardInfo({ card }: { card: Card }) {
  return (
    <div>
      <h1 className="text-4xl">Card</h1>
      <div className="my-8">
        <h2>id</h2>
        {card.id}
      </div>
      <div className="my-8">
        <h2>Front</h2>
        <div className="text-8xl font-bold text-center whitespace-nowrap">
          {card.front}
        </div>
      </div>
      <div className="my-8">
        <h2>Back</h2>
        <div className="text-8xl font-bold text-center whitespace-nowrap">
          {card.back}
        </div>
      </div>
    </div>
  );
}
