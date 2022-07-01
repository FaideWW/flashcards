import { trpc } from "@/utils/trpc";
import Link from "next/link";

export default function FlashcardList() {
  const { data, isLoading } = trpc.useQuery(["card.all"]);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">List of cards</h2>
      <ul>
        {data?.map((card) => {
          return (
            <li key={card.id}>
              <Link href={`/cards/${card.id}`}>
                <a>
                  {card.front} / {card.back}
                </a>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
