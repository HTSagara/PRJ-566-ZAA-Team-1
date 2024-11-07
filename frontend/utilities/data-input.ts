import { createContext } from "react";

interface Book {
  id: string;
  title: string;
  author: string;
  imgUrl?: string;
  type: string;
  size: number;
}

const BookContext = createContext<{
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}>({
  books: [],
  setBooks: () => { },
});


//defining highlight interface
export interface Highlight {
  id: string;
  text: string;
  location: string;
  imgUrl?: string;
}

export { BookContext, type Book };
