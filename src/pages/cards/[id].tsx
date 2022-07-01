import CardInfo from "@/components/CardInfo";
import Navigation from "@/components/Navigation";
import { trpc } from "@/utils/trpc";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";

const CardShow: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  if (!id) {
    return <div>Card not found</div>;
  }

  const cardId = id.toString();

  const queryClient = useQueryClient();
  const { data: card, isLoading: cardIsLoading } = trpc.useQuery([
    "card.by-id",
    { id: cardId },
  ]);

  const { data: item, isLoading: itemIsLoading } = trpc.useQuery(
    ["item.by-card", { cardId }],
    {
      retry: false,
    }
  );

  const addItem = trpc.useMutation(["item.create"]);

  const handleAddItem = async () => {
    await addItem.mutateAsync(
      {
        cardId,
      },
      {
        onSuccess(newItem) {
          queryClient.setQueryData(["item.by-card", { cardId }], newItem);
        },
      }
    );
  };

  if (cardIsLoading) {
    return <div>Loading ...</div>;
  }

  if (!card) return <div>Card not found</div>;

  let itemDisplay = null;
  if (itemIsLoading) {
    itemDisplay = <div>Loading...</div>;
  } else {
    if (item) {
      itemDisplay = (
        <div>
          <h2>Statistics</h2>
          <p>Current SRS stage: {item.currentSrsStage}</p>
          <p>Next review at: {item.nextAvailable.toLocaleString("en-US")}</p>
        </div>
      );
    } else {
      itemDisplay = (
        <button
          className="px-4 py-2 font-semibold bg-sky-500 text-white rounded-none shadow-sm"
          onClick={handleAddItem}
          disabled={addItem.isLoading}
        >
          Add to review queue
        </button>
      );
    }
  }

  return (
    <div>
      <Navigation />
      <div className="w-1/2 mx-auto">
        <CardInfo card={card} />
        {itemDisplay}
      </div>
    </div>
  );
};

export default CardShow;
