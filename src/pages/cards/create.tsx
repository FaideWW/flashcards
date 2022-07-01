import CreateFlashcardForm from "@/components/CreateFlashcardForm";
import Navigation from "@/components/Navigation";
import { NextPage } from "next";

const CreateCard: NextPage = () => {
  return (
    <div>
      <Navigation />
      <CreateFlashcardForm />
    </div>
  );
};

export default CreateCard;
