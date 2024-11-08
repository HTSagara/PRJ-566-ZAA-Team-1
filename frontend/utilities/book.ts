import { createContext } from "react";
import { getUser } from "@/utilities/auth";
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
  setBooks: () => {},
});

const backendApiUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL;

// deleteHighlight function
const deleteHighlight = async (bookId: string, highlightId: string) => {
  const user = await getUser();
  if (!user || !user.accessToken) {
    console.log("Error: User or access token is missing");
    throw new Error("User not authenticated");
  }
  const url = `${backendApiUrl}/book/${bookId}/highlight/${highlightId}`;
  console.log("Constructed delete URL:", url); // Log the URL to ensure it's correct

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(`Failed to delete highlight: ${errorData.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting highlight:", error.message);
      throw error;
    } else {
      console.error("Unexpected error deleting highlight", error);
      throw new Error("Unexpected error occurred during deletion");
    }
  }
};

// Export everything
export { BookContext, type Book, deleteHighlight };
