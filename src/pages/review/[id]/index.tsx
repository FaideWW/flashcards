import { trpc } from "@/utils/trpc";
import produce from "immer";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

enum ReviewStates {
  Unstarted = "unstarted",
  AnsweredIncorrect = "answered-incorrect",
  AnsweredCorrect = "answered-correct",
  Complete = "complete",
  Skipped = "skipped",
}

interface Item {
  id: string;
  currentSrsStage: number;
  currentStreak: number;
  maxStreak: number;
  card: Card;
}

interface Card {
  id: string;
  front: string;
  back: string;
  notes: string;
}

// interface Review {
//   itemId: string;
//   cardId: string;
//   secondsElapsed: number;
//   endingSrsStage: number;
//   timesIncorrect: number;
//   currentStreak: number;
//   maxStreak: number;
// }

interface Review {
  item: Item;
  status: ReviewStates;
  secondsElapsed: number;
  timesIncorrect: number;
}

function secondsSince(start: Date, end = new Date()) {
  return Math.ceil((end.getTime() - start.getTime()) / 1000);
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = array.slice();
  let currentIndex = array.length;
  let randomIndex = -1;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    let temp = newArray[currentIndex];
    newArray[currentIndex] = newArray[randomIndex];
    newArray[randomIndex] = temp;
  }

  return newArray;
}

const ReviewSession: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const completeSession = trpc.useMutation(["review-session.complete"]);

  if (!id) {
    return <div>Session not found</div>;
  }
  const [reviewMap, setReviewMap] = useState<Record<string, Review>>({});
  const [shuffledItemsRemaining, setShuffledItemsRemaining] = useState<Item[]>(
    []
  );

  const [guess, setGuess] = useState<string>("");
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  const sessionId = id.toString();

  const { isLoading } = trpc.useQuery(
    ["review-session.by-id", { id: sessionId }],
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      onSuccess(data) {
        if (!data) return;
        if (data.status === "COMPLETE") {
          return router.push(`${router.asPath}/summary`);
        }
        const shuffledItems = shuffleArray(data.items);
        setShuffledItemsRemaining(shuffledItems);
        const newReviewMap = shuffledItems.reduce<Record<string, Review>>(
          (map, item) => {
            map[item.id] = {
              item,
              status: ReviewStates.Unstarted,
              secondsElapsed: 0,
              timesIncorrect: 0,
            };
            return map;
          },
          {}
        );
        setReviewMap(newReviewMap);
      },
    }
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const item = shuffledItemsRemaining[0];
  const review = item ? reviewMap[item.id] : { status: ReviewStates.Unstarted };

  const isUnstarted = review.status === ReviewStates.Unstarted;
  const isCorrect = review.status === ReviewStates.AnsweredCorrect;
  const isIncorrect = review.status === ReviewStates.AnsweredIncorrect;

  const setState = (newState: ReviewStates) => {
    setReviewMap(
      produce(reviewMap, (draft) => {
        draft[item.id].status = newState;
      })
    );
  };

  if (shuffledItemsRemaining.length === 0) {
    return <div>No more items to review!</div>;
  }

  const submitGuess = () => {
    if (guess.trim().toLowerCase() === item.card.back.trim().toLowerCase()) {
      setReviewMap(
        produce(reviewMap, (draft) => {
          draft[item.id].status = ReviewStates.AnsweredCorrect;
          draft[item.id].secondsElapsed += secondsSince(startTime);
        })
      );
    } else {
      setState(ReviewStates.AnsweredIncorrect);
      setReviewMap(
        produce(reviewMap, (draft) => {
          draft[item.id].status = ReviewStates.AnsweredIncorrect;
          draft[item.id].timesIncorrect += 1;
          draft[item.id].secondsElapsed += secondsSince(startTime);
        })
      );
    }
  };

  const handleContinue = async () => {
    const nextShuffledItems = produce(shuffledItemsRemaining, (draft) => {
      if (isIncorrect) {
        draft.push(draft[0]);
      }
      draft.shift();
    });
    if (nextShuffledItems.length === 0) {
      // Use a mutation to complete the session
      await completeSession.mutateAsync({
        id: sessionId,
        endedAt: new Date().toISOString(),
        reviews: Object.values(reviewMap).map((review) => {
          let newStreak = review.item.currentStreak;
          let endingSrsStage = review.item.currentSrsStage;
          if (review.timesIncorrect === 0) {
            newStreak += 1;
            endingSrsStage += 1;
          } else {
            newStreak = 1;
            endingSrsStage -= review.timesIncorrect;
          }

          return {
            itemId: review.item.id,
            cardId: review.item.card.id,
            secondsElapsed: review.secondsElapsed,
            startingSrsStage: review.item.currentSrsStage,
            endingSrsStage: Math.max(0, endingSrsStage),
            timesIncorrect: review.timesIncorrect,
            item: {
              currentStreak: newStreak,
              maxStreak: Math.max(review.item.maxStreak, newStreak),
            },
          };
        }),
      });

      router.push(`${router.asPath}/summary`);
    }

    setState(ReviewStates.Unstarted);
    setShuffledItemsRemaining(nextShuffledItems);
    setStartTime(new Date());
    setGuess("");
  };

  const handleRetry = () => {
    setState(ReviewStates.Unstarted);
    setGuess("");
  };

  const handleSkip = () => {
    // Save time elapsed so we can retrieve it later
    setReviewMap(
      produce(reviewMap, (draft) => {
        draft[item.id].secondsElapsed += secondsSince(startTime);
        draft[item.id].status = ReviewStates.Skipped;
      })
    );

    const newItems = produce(shuffledItemsRemaining, (draft) => {
      // For dumb type reasons we can't combine these two operations
      draft.push(draft[0]);
      draft.shift();
    });

    setShuffledItemsRemaining(newItems);
    setStartTime(new Date());
    setGuess("");
  };

  let inputColor = "";
  if (isCorrect) inputColor = "bg-green-300";
  else if (isIncorrect) inputColor = "bg-red-300";

  return (
    <div className="">
      <div className="w-1/2 mx-auto flex justify-between items-end">
        <h1 className="text-4xl">Review</h1>
        <h2>{shuffledItemsRemaining.length} remaining</h2>
      </div>
      <div className="text-center text-8xl my-24">{item.card.front}</div>
      <div className="w-full mx-auto my-4">
        <input
          className={`w-full border border-slate-700 rounded-md p-2 text-3xl text-center ${inputColor}`}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={!isUnstarted}
        />
        <div className="flex justify-center my-2 gap-4">
          {isUnstarted && (
            <>
              <button
                className="rounded-md bg-sky-500 text-white py-2 w-20"
                onClick={submitGuess}
                disabled={!isUnstarted}
              >
                Submit
              </button>
              <button
                className="rounded-md border border-slate-500 text-slate-800 py-1 w-20"
                onClick={handleSkip}
                disabled={!isUnstarted}
              >
                Skip
              </button>
            </>
          )}
          {(isCorrect || isIncorrect) && (
            <>
              {isIncorrect && (
                <button
                  className="rounded-md border border-slate-500 text-slate-800 py-1 w-20"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              )}
              <button
                className="rounded-md bg-sky-500 text-white py-2 w-20"
                onClick={handleContinue}
              >
                Continue
              </button>
            </>
          )}
        </div>
        {isCorrect && (
          <div className="w-full py-2 bg-green-300 text-center">Correct!</div>
        )}
        {isIncorrect && (
          <div className="w-full py-2 bg-red-300 text-center">Incorrect!</div>
        )}
        {!isUnstarted && (
          <>
            <button
              className="w-full block bg-slate-50 hover:bg-slate-100"
              onClick={() => setShowAnswer((showAnswer) => !showAnswer)}
            >
              {showAnswer ? "Hide" : "Show"} Answer
            </button>
          </>
        )}
        {showAnswer && (
          <div className="w-1/2 mx-auto bg-gray-50 p-4 my-4">
            <h2 className="text-4xl mb-4">{item.card.back}</h2>
            <h3 className="font-bold text-lg">Notes</h3>
            <div>{item.card.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSession;
