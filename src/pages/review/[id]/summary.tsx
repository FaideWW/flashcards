import Navigation from "@/components/Navigation";
import { trpc } from "@/utils/trpc";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";

function formatTime(seconds: number): string {
  let secs = seconds;
  let mins = 0;
  let hrs = 0;
  if (seconds > 60) {
    mins = Math.floor(seconds / 60);
    secs = seconds % 60;
  }

  if (mins > 60) {
    hrs = Math.floor(hrs / 60);
    mins = mins % 60;
  }

  if (hrs > 0) {
    return `${hrs}:${mins > 10 ? mins : `0${mins}`}:${
      secs > 10 ? secs : `0${secs}`
    }`;
  }

  return `${mins}:${secs > 10 ? secs : `0${secs}`}`;
}

const ReviewSessionSummary: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  if (!id) {
    return <div>Session not found</div>;
  }
  const sessionId = id.toString();
  const { data, isLoading } = trpc.useQuery(
    ["review-session.by-id.summary", { id: sessionId }],
    {
      refetchOnWindowFocus: false,
    }
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>No session data found</div>;
  }

  console.log(data);
  const percentCorrect = useMemo(
    () =>
      data.reviews.filter((review) => review.timesIncorrect === 0).length /
      data.reviews.length,
    [data]
  );

  return (
    <div>
      <Navigation />
      <div className="w-1/2 mx-auto">
        <h1 className="text-4xl">Review Summary</h1>
        <div></div>
        <table className="w-full m-2 table-auto text-center text-sm">
          <thead>
            <tr>
              <th>Card</th>
              <th>Starting SRS stage</th>
              <th>Ending SRS stage</th>
              <th>Time taken</th>
              <th>Times incorrect</th>
              <th>Current streak</th>
              <th>Max streak</th>
            </tr>
          </thead>
          <tbody>
            {data.reviews.map((review) => {
              return (
                <tr
                  className={`${
                    review.timesIncorrect > 0 ? "bg-red-50" : "bg-green-50"
                  }`}
                >
                  <td>{review.item.card.front}</td>
                  <td>{review.startingSrsStage}</td>
                  <td>{review.endingSrsStage}</td>
                  <td>{formatTime(review.secondsElapsed)}</td>
                  <td>{review.timesIncorrect}</td>
                  <td>{review.item.currentStreak}</td>
                  <td>{review.item.maxStreak}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewSessionSummary;
