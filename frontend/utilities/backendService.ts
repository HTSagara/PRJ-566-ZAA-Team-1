import { Alert } from "react-native";
import { User } from "./authContext";

const backendURL = process.env.EXPO_PUBLIC_BACKEND_API_URL;

// Book interface
export interface Book {
  id: string;
  title: string;
  author: string;
  imgUrl?: string;
  type: string;
  size: number;
}

// Highlight interface
export interface Highlight {
  id: string;
  text: string;
  location: string;
  imgUrl?: string;
}

export interface Selection {
  id?: string;
  text: string;
  location: string;
  imgUrl?: string;
}

// This method will fetch all the books for the currently logged
export async function getAllBooks(user: User) {
  const response = await fetch(backendURL + `/books`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  // Check for 204 No Content and return an empty array if that's the case
  if (response.status === 204) {
    return [];
  } else if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    throw new Error("Failed to fetch books");
  }
}

// This method will fetch the book by bookId
export async function getBookByBookId(user: User, bookId: string) {
  let response = await fetch(backendURL + `/book/${bookId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data.url;
  } else {
    console.error("Error fetching book:", response.statusText);
    Alert.alert("Failed to fetch book.");
  }
}

// This method will upload the book to S3 and metadata to mongoDB
export async function uploadBookToDB(user: User, bookData: any) {
  const response = await fetch(backendURL + `/book`, {
    method: "POST",
    body: bookData,
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  if (response.status === 200) {
    console.log("Book uploaded successfully!");
    Alert.alert("Success", "Book uploaded successfully!");
    const newBookData = await response.json();
    return newBookData;
  } else {
    console.error("Failed to upload book", response);
    Alert.alert("Error", "Failed to upload book");
  }
}

// This method will get book details from mongoDB
export async function getBookMetaData(user: User, bookId: string) {
  const response = await fetch(backendURL + `/book/info/${bookId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    Alert.alert("Error", "Failed to fetch book details");
  }
}

// This method will delete the book from both S3 and mongoDB
export async function deleteUserSelectedBook(user: User, bookId: string) {
  const response = await fetch(backendURL + `/book/${bookId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    console.debug(data.message);
    return true;
  } else {
    const error = await response.json();
    console.log(`Exception while deleting book: ${error}.`);
    return false;
  }
}

// This method will get all the highlights for the user selected book
export async function getAllHighlightsByBookId(user: User, bookId: string) {
  const response = await fetch(backendURL + `/book/${bookId}/highlights`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  // Handle 204 No Content response by returning an empty array
  if (response.status === 204) {
    return [];
  } else if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    const error = await response.json();
    alert(`Error while getting book highlights: ${error.message}.`);
  }
}

// Delete highlight function
export async function deleteHighlight(
  user: User,
  bookId: string,
  highlightId: string
) {
  const response = await fetch(
    backendURL + `/book/${bookId}/highlight/${highlightId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.accessToken}`,
      },
    }
  );

  // throw error if bad response
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to delete highlight: ${errorData.message}`);
  }
}

// Delete highlight function
export async function deleteHighlightImage(
  user: User,
  bookId: string,
  highlightId: string
) {
  const response = await fetch(
    `${backendURL}/book/${bookId}/highlight/${highlightId}/image`,
    {
      method: "DELETE",
      headers: user.authorizationHeaders(),
    }
  );

  // throw error if bad response
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to delete highlight image: ${errorData.message}`);
  }
}

// Generate a new image for a highlight with no image
export async function generateHighlightImage(
  user: User,
  bookId: string,
  highlightId: string
) {
  const url = `${backendURL}/book/${bookId}/highlight/${highlightId}/generate`;
  const response = await fetch(url, {
    method: "POST",
    headers: user.authorizationHeaders(),
  });

  if (response.ok) {
    const data = await response.json();
    console.log("Image successfully generated:", data.imgUrl);
    return data.imgUrl;
  } else {
    const error = await response.json();
    console.error("Failed to generate highlight image:", error);
    throw new Error("Failed to generate highlight image.");
  }
}

// Regenerate the highlight image with a PUT request
export async function regenerateHighlightImage(
  user: User,
  bookId: string,
  highlightId: string
) {
  const url = `${backendURL}/book/${bookId}/highlight/${highlightId}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  if (response.ok) {
    console.log("Image regeneration succeeded");
    return true;
  } else {
    const error = await response.json();
    console.error("Image regeneration failed:", error);
    throw new Error("Failed to regenerate highlight image.");
  }
}

// Fetch the updated highlight data with a GET request
export async function fetchUpdatedHighlight(
  user: User,
  bookId: string,
  highlightId: string
) {
  const url = `${backendURL}/book/${bookId}/highlight/${highlightId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    console.log("Fetched updated highlight data successfully");
    return data;
  } else {
    const error = await response.json();
    console.error("Failed to fetch updated highlight data:", error);
    throw new Error("Failed to fetch updated highlight data.");
  }
}

// This method will create a new highlight for the user
export async function createUserHighlight(
  user: User,
  bookId: string,
  selection: Selection
) {
  const response = await fetch(backendURL + `/book/${bookId}/highlight`, {
    method: "POST",
    body: JSON.stringify(selection),
    headers: user.authorizationHeaders(),
  });

  if (response.status === 200) return true;
  else return false;
}

export async function updateBookSettings(
  user: User,
  bookId: string,
  settings: { font_size: string; dark_mode: boolean }
) {
  const response = await fetch(`${backendURL}/book/${bookId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.accessToken}`,
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to update book settings: ${errorData.message}`);
  }
}

// Fetch the settings for a specific book
export async function getBookSettings(user: User, bookId: string) {
  try {
    const response = await fetch(`${backendURL}/book/${bookId}/settings`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data; // Return the settings object (e.g., { fontSize, darkMode })
    } else {
      const errorData = await response.json();
      console.error("Failed to fetch book settings:", errorData.message);
      throw new Error("Failed to fetch book settings.");
    }
  } catch (error) {
    console.error("Error in getBookSettings:", error);
    throw error;
  }
}

export async function createCustomImage(
  user: User,
  bookId: string,
  highlightId: string,
  customText: string
) {
  const response = await fetch(
    backendURL + `/book/${bookId}/highlight/${highlightId}`,
    {
      method: "PUT",
      body: JSON.stringify(customText),
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
    }
  );

  if (response.status === 200) {
    console.log("Image regeneration succeeded");
    return true;
  } else {
    const error = await response.json();
    console.error("Image regeneration failed:", error);
    throw new Error("Failed to regenerate highlight image.");
  }
}
