import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  View,
  FlatList,
  ListRenderItem,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";


// Define the book type
interface Book {
  id: string;
  title: string;
  author: string;
  image: string;
}

const { width } = Dimensions.get("window"); // screen width for dynamic card sizing

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch book data from JSON 
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch('../dummy_books.json');
        const data = await response.json();
        setBooks(data);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleUpload = () => {
    // logic for uploading a book
    console.log("Upload a book button pressed");
  };

  const handleCardClick = (title: string) => {
    //logic for clicking a card
    console.log(`The book card, title: "${title}" has been clicked`);
  };

  // Card book definition
  const renderBookCard: ListRenderItem<Book> = ({ item }) => (
    <TouchableOpacity onPress={() => handleCardClick(item.title)} style={styles.cardContainer}>
      <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.bookImage} resizeMode="contain" />
        <View style={styles.cardContent}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <Text style={styles.bookAuthor}>{item.author}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#007BFF" />;
  }

  return (
<ParallaxScrollView
  headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
  headerImage={
    <Ionicons size={310} name="code-slash" style={styles.headerImage} />
  }
>
  <View style={styles.headerRight}>
    <TouchableOpacity onPress={handleUpload} style={styles.uploadButton}>
      <Text style={styles.buttonText}>Upload a book</Text>
    </TouchableOpacity>
  </View>

  {/* Centered Title and Subtitle */}
  <ThemedView style={styles.centeredContainer}>
    <ThemedText type="title" style={styles.centeredText}>Book Library</ThemedText>
  </ThemedView>

  {/* Book cards list */}
  <FlatList
    data={books}
    renderItem={renderBookCard}
    keyExtractor={(item) => item.id}
    contentContainerStyle={styles.cardList}
    numColumns={5} // Display 5 cards per row
  />
</ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,  // Optional: Add some spacing from the top
    marginBottom: 20,  // Optional: Add some spacing before the content
  },
  centeredText: {
    textAlign: 'center',
    fontSize: 20,  // Adjust size as necessary
    paddingHorizontal: 16,  // Optional: Add padding to avoid touching screen edges
  },
  headerRight: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  cardList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: "space-between", // Ensures even spacing between the cards
  },
  cardContainer: {
    flex: 1,
    margin: 5, // Adjusts margin for space between cards
    maxWidth: (width / 5) - 10, // Ensures the card width fits dynamically for 5 columns
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    flexDirection: "column",
    alignItems: "center",
    aspectRatio: 0.65, // Enforce consistent card aspect ratio
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookImage: {
    width: "100%",
    height: "70%", // Image takes 70% of the card height
    resizeMode: "contain", // Ensures the full image is visible without being cropped
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  bookTitle: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  bookAuthor: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
  },
});