import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getUser } from "@/utilities/auth";
import { RootStackParamList } from "./types"; // Import your defined types
import { StackNavigationProp } from "@react-navigation/stack"; // Import the navigation prop types

// Define the book type
interface Book {
  id: string;
  title: string;
  author: string;
  image?: string;
}

const { width } = Dimensions.get("window");

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Explicitly type the navigation object
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Fetch book data from the API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const user = await getUser();
        if (!user) {
          Alert.alert("Error", "No user was found");
          return;
        }

        const response = await fetch("http://localhost:8000/books", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBooks(data);
        } else {
          console.error("Error fetching books:", response.statusText);
          Alert.alert("Error", "Failed to fetch books");
        }
      } catch (error) {
        console.error("Error fetching books:", error);
        Alert.alert("Error", "An error occurred while fetching books.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading books...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.uploadButton}
        >
          <Text style={styles.buttonText}>Upload a book</Text>
        </TouchableOpacity>
      </View>

      {/* Book cards list */}
      <FlatList
        data={books}
        renderItem={({ item }) => (
          <TouchableOpacity
          onPress={() => {
            navigation.navigate("bookdetails", { bookId: item.id }); // Correctly pass bookId
          }}
            style={styles.cardContainer}
          >
            <View style={styles.card}>
              <Image
                source={{ uri: item.image || "https://placehold.co/100x150" }}
                style={styles.bookImage}
                resizeMode="contain"
              />
              <View style={styles.cardContent}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cardList}
        numColumns={5}
      />

      {/* Modal for file upload */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Add Modal content here */}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerRight: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  cardList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  cardContainer: {
    flex: 1,
    margin: 5,
    maxWidth: width / 5 - 10,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    flexDirection: "column",
    alignItems: "center",
    aspectRatio: 0.65,
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
    height: "70%",
    resizeMode: "contain",
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
