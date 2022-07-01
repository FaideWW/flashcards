import FlashcardList from "@/components/FlashcardList";
import Navigation from "@/components/Navigation";
import { NextPage } from "next";

const CardsPage: NextPage = () => {
  return (
    <div>
      <Navigation />
      <FlashcardList />
    </div>
  );
};

export default CardsPage;
