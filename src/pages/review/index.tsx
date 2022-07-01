import Navigation from "@/components/Navigation";
import { trpc } from "@/utils/trpc";
import { NextPage } from "next";
import { useRouter } from "next/router";

const ReviewPage: NextPage = () => {
  const { data, isLoading } = trpc.useQuery(["item.ready-for-review-ids"]);

  const startReviewSession = trpc.useMutation(["review-session.create"]);
  const router = useRouter();

  const handleStartSession = async () => {
    if (!data || data.length === 0) return;
    const session = await startReviewSession.mutateAsync({
      itemIds: data.map(({ id }) => id),
    });

    router.push(`/review/${session.id}`);
  };

  let reviewAction = null;
  if (isLoading) {
    reviewAction = <div>Loading...</div>;
  } else if (data) {
    if (data?.length === 0) {
      reviewAction = <button disabled>No items ready to review</button>;
    } else {
      reviewAction = (
        <button onClick={handleStartSession}>
          Start Review ({data.length} items)
        </button>
      );
    }
  } else {
    reviewAction = <div>Something went wrong</div>;
  }

  return (
    <div>
      <Navigation />
      {reviewAction}
    </div>
  );
};

export default ReviewPage;
