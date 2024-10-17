// src/types.ts
export type RootStackParamList = {
  library: undefined; // No params for library
  bookdetails: { bookId: string };
  bookReader: { bookId: string };
};
