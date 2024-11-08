// src/types.ts
import { Highlight } from "./highlights";

export type RootStackParamList = {
  library: undefined; // No params for library
  bookDetails: { bookId: string };
  bookReader: { bookId: string, userHighlight?: Highlight };
  highlights: { bookId: string };
};
