import { createContext } from "react";
import { Book } from "./backendService";

const BookContext = createContext<{
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}>({
  books: [],
  setBooks: () => {},
});

export { BookContext };
