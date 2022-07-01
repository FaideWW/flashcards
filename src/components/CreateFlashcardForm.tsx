import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const cardFormSchema = z
  .object({
    front: z.string().min(1, { message: "Required" }),
    back: z.string().min(1, { message: "Required" }),
  })
  .required();

type CardFormSchema = z.infer<typeof cardFormSchema>;

export default function CreateFlashcardForm() {
  const utils = trpc.useContext();
  const createCard = trpc.useMutation("card.create", {
    async onSuccess() {
      await utils.invalidateQueries(["card.all"]);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardFormSchema>({ resolver: zodResolver(cardFormSchema) });
  console.log(errors);

  const createFlashcard = async (data: CardFormSchema) => {
    try {
      await createCard.mutateAsync(data);
    } catch {}
  };

  const spanClassname = "block text-sm font-medium text-slate-700";
  const inputClassname = "";

  return (
    <form
      onSubmit={handleSubmit(createFlashcard)}
      className="flex flex-col gap-1 w-64 mx-auto"
    >
      <label htmlFor="create-card-front" className="block">
        <span className={spanClassname}>Front of card</span>
      </label>
      <input
        className={inputClassname}
        type="text"
        id="create-card-front"
        {...register("front")}
        disabled={isSubmitting}
      />
      {errors.front && <p>{errors.front?.message}</p>}
      <label htmlFor="create-card-back" className="block">
        <span className={spanClassname}>Back of card</span>
      </label>
      <input
        className={inputClassname}
        type="text"
        id="create-card-back"
        {...register("back")}
        disabled={isSubmitting}
      />
      {errors.back && <p>{errors.back?.message}</p>}
      <button
        className="px-4 py-2 font-semibold bg-sky-500 text-white rounded-none shadow-sm"
        type="submit"
        disabled={isSubmitting}
      >
        Create
      </button>
    </form>
  );
}
