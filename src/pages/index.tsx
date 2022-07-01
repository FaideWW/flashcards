import CreateFlashcardForm from "@/components/CreateFlashcardForm";
import FlashcardList from "@/components/FlashcardList";
import Navigation from "@/components/Navigation";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div>
      <Navigation />
      <h1 className="text-4xl font-bold underline text-center">Flashcards!</h1>
      <div className="flex flex-col">
        <h2 className="text-2xl text-center">Create a new flashcard</h2>
      </div>
      <CreateFlashcardForm />
      <FlashcardList />
    </div>
  );
};

export default Home;
