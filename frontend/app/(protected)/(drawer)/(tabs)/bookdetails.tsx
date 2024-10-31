import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  Button,
  Modal,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { getUser } from "@/utilities/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { router } from "expo-router";

// Define the types for the book object and route params
interface Book {
  title: string;
  author: string;
  imgUrl?: string;
  type: string;
  size: number;
}

export default function BookDetailsScreen() {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [isStarred, setIsStarred] = useState(false);
  const [isClocked, setIsClocked] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [modelVisible, setModelVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "bookReader">>();
  const { bookId } = route.params;
  const backendURL = process.env.EXPO_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const user = await getUser();
        if (!user) {
          Alert.alert("Error", "No user found");
          return;
        }

        const response = await fetch(
          `http://localhost:8000/book/info/${bookId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setBook(data);
        } else {
          Alert.alert("Error", "Failed to fetch book details");
        }
      } catch (error) {
        Alert.alert("Error", "An error occurred while fetching book details.");
      } finally {
        setLoading(false);
      }
    };

    const fetchStoredData = async () => {
      try {
        const storedNotes = await AsyncStorage.getItem(`notes_${bookId}`);
        if (storedNotes) setNotes(storedNotes);

        const storedStarred = await AsyncStorage.getItem(`isStarred_${bookId}`);
        if (storedStarred) setIsStarred(JSON.parse(storedStarred));

        const storedClocked = await AsyncStorage.getItem(`isClocked_${bookId}`);
        if (storedClocked) setIsClocked(JSON.parse(storedClocked));

        const storedChecked = await AsyncStorage.getItem(`isChecked_${bookId}`);
        if (storedChecked) setIsChecked(JSON.parse(storedChecked));
      } catch (error) {
        console.error("Failed to load data from AsyncStorage:", error);
      }
    };

    fetchBookDetails();
    fetchStoredData();
  }, [bookId]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!book) {
    return <Text>No book details available</Text>;
  }

  const formatFileSize = (size: number) => {
    if (size >= 1048576) {
      return `${(size / 1048576).toFixed(2)} MB`;
    } else if (size >= 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    }
    return `${size} Bytes`;
  };

  const handleNotesChange = async (text: string) => {
    setNotes(text);
    try {
      await AsyncStorage.setItem(`notes_${bookId}`, text);
    } catch (error) {
      console.error("Failed to save notes to AsyncStorage:", error);
    }
  };

  const toggleStar = async () => {
    const newState = !isStarred;
    setIsStarred(newState);
    await AsyncStorage.setItem(`isStarred_${bookId}`, JSON.stringify(newState));
  };

  const toggleClock = async () => {
    const newState = !isClocked;
    setIsClocked(newState);
    if (newState) setIsChecked(false);
    await AsyncStorage.setItem(`isClocked_${bookId}`, JSON.stringify(newState));
    await AsyncStorage.setItem(`isChecked_${bookId}`, JSON.stringify(false));
  };

  const toggleCheck = async () => {
    const newState = !isChecked;
    setIsChecked(newState);
    if (newState) setIsClocked(false);
    await AsyncStorage.setItem(`isChecked_${bookId}`, JSON.stringify(newState));
    await AsyncStorage.setItem(`isClocked_${bookId}`, JSON.stringify(false));
  };

  const handleDeleteAction = async () => {
    setModelVisible(true);
  };

  const handleConfirm = async () => {
    setModelVisible(false);
    try {
      const user = await getUser();
      if (!user) {
        Alert.alert("Error", "No user found");
        return;
      }

      const response = await fetch(backendURL + `/book/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        router.navigate("./library");
      } else {
        const error = await response.json();
        alert(`Error while deleting book: ${error.message}`);
      }
    } catch (err) {
      console.log(`Exception while deleting book: ${err}`);
      Alert.alert("Error", "Failed to delete book");
    }
  };

  const handleCancel = () => {
    setModelVisible(false);
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Document</Text>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("bookReader", { bookId });
          }}
        >
          <Text style={styles.readButton}>Read</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={modelVisible}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>
              {"Are you sure you want to Delete this book?"}
            </Text>
            <View style={styles.buttonContainer}>
              <Button title="Confirm" onPress={handleConfirm} />
              <Button title="Cancel" onPress={handleCancel} />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bookImageContainer}>
        <Image
          source={{ uri: book.imgUrl || "https://placehold.co/300x450" }}
          style={styles.bookImage}
        />
      </View>

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>by {book.author}</Text>

        <View style={styles.actionIcons}>
          <TouchableOpacity onPress={toggleStar}>
            <Icon
              name="star"
              size={24}
              style={{
                color: isStarred ? "blue" : "gray",
                marginHorizontal: 10,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleClock}>
            <Icon
              name="clock-o"
              size={24}
              style={{
                color: isClocked ? "blue" : "gray",
                marginHorizontal: 10,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleCheck}>
            <Icon
              name="check"
              size={24}
              style={{
                color: isChecked ? "blue" : "gray",
                marginHorizontal: 10,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteAction}>
            <Icon
              name="trash"
              size={24}
              style={{ color: "gray", marginHorizontal: 10 }}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.bookMeta}>Last time read: (Date and Time)</Text>
        <Text style={styles.bookMeta}>
          File Type: {book.type}, Size: {formatFileSize(book.size)}
        </Text>
      </View>

      <View style={styles.notesSection}>
        <Text style={styles.notesHeader}>Notes:</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          placeholder="Write your notes here..."
          value={notes}
          onChangeText={handleNotesChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  readButton: {
    fontSize: 18,
    color: "#007BFF",
  },
  bookImageContainer: {
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  bookImage: {
    width: 200,
    height: 300,
    resizeMode: "contain",
  },
  bookInfo: {
    alignItems: "flex-start",
    marginVertical: 20,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  bookAuthor: {
    fontSize: 18,
    color: "#666",
    marginBottom: 10,
  },
  actionIcons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginVertical: 10,
    width: "80%",
  },
  icon: {
    marginHorizontal: 10,
  },
  bookMeta: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  notesSection: {
    marginTop: 20,
  },
  notesHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    color: "#333",
    minHeight: 100,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: 350,
    padding: 30,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
