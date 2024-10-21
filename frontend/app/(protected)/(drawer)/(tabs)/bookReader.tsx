import React, { useState, useEffect } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { ReactReader } from "react-reader";
import { useRoute } from "@react-navigation/native";
import { getUser } from "@/utilities/auth";

const BookReader: React.FC = () => {
  const route = useRoute();
  const { bookId } = route.params as { bookId: string };

  const [location, setLocation] = useState<string | number>(0);
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Handle loading
  const [error, setError] = useState<string | null>(null); // Handle error

  useEffect(() => {
    if (!bookId) {
      setError("No bookId provided");
      setLoading(false);
      return;
    }

    // Fetch the book URL
    const fetchBookUrl = async () => {
      try {
        const user = await getUser();
        if (!user) {
          Alert.alert("Error", "No user was found");
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/book/${bookId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBookUrl(data.url); // Set the pre-signed URL returned from the backend
        } else {
          console.error("Error fetching book:", response.statusText);
          setError("Failed to fetch book.");
        }
      } catch (error) {
        console.error("Error fetching book:", error);
        setError("Error fetching book.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookUrl();
  }, [bookId]);

  // Show loading indicator while fetching
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading book...</Text>
      </View>
    );
  }

  // Show error message if something goes wrong
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{error}</Text>
      </View>
    );
  }

  // Display the ReactReader only when the bookUrl is ready
  return (
    <View style={{ flex: 1 }}>
      {bookUrl ? (
        <ReactReader
          url={bookUrl}
          epubInitOptions={{openAs: 'epub'}}
          location={location}
          locationChanged={(epubcfi: string) => setLocation(epubcfi)}
        />
      ) : (
        <Text>Book URL is not available.</Text>
      )}
    </View>
  );
};

export default BookReader;
