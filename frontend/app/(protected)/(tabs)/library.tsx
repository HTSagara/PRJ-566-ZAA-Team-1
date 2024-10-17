import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  TextInput,
  Button,
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
import { StackNavigationProp } from "@react-navigation/stack";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system"; // This is used to get the file as a blob
import { Platform } from "react-native";

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
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [title, setTitle] = useState<string>(""); // State for Title
  const [author, setAuthor] = useState<string>(""); // State for Author

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Fetch books from the API
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

  // Function to pick a PDF or EPUB book file
  const pickBookFile = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/epub+zip"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      // Handle case when the user cancels the document picker
      console.log("File picking canceled or failed.");
    } else if (result.assets && result.assets.length > 0) {
      const { uri, name } = result.assets[0]; // Extract uri and name from the first selected asset
      setSelectedFile({ uri, name });
      console.log("File selected: ", name); // Log the file name
    }
  };

  // Function to upload the book file with metadata
  const uploadBook = async () => {
    if (
      selectedFile &&
      (selectedFile.name.endsWith(".pdf") ||
        selectedFile.name.endsWith(".epub"))
    ) {
      const formData = new FormData();

      // Convert the file URI to a Blob using fetch
      const fileBlob = await fetch(selectedFile.uri)
        .then((response) => response.blob())
        .catch((error) => {
          console.error("Error converting file to blob:", error);
          return null;
        });

      if (!fileBlob) {
        Alert.alert("Error", "Failed to process the selected file.");
        return;
      }

      // Append the file Blob to FormData
      formData.append("file", fileBlob, selectedFile.name);

      // Append metadata
      formData.append("title", title);
      formData.append("author", author);

      // Log the formData for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const user = await getUser();
      if (!user) {
        Alert.alert("Error", "No user was found");
        return;
      }

      // Send the FormData to the backend
      const response = await fetch("http://localhost:8000/book", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert("Success", "Book uploaded successfully!");
        setModalVisible(false);
        // Optionally, refresh the book list here
      } else {
        Alert.alert("Error", "Failed to upload the book.");
      }
    } else {
      Alert.alert("Error", "Please select a valid PDF or EPUB file.");
    }
  };

  // Function to navigate to BookReader with the selected book ID
  const handleBookPress = (bookId: string) => {
    console.log("Selected book id: " + bookId);
    navigation.navigate("bookReader", { bookId });
  };

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
            onPress={() => handleBookPress(item.id)}
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
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Upload a Book (PDF or EPUB)</Text>

            {/* Input for Title */}
            <TextInput
              placeholder="Enter book title"
              value={title}
              onChangeText={(text) => setTitle(text)}
              style={styles.input}
            />

            {/* Input for Author */}
            <TextInput
              placeholder="Enter author"
              value={author}
              onChangeText={(text) => setAuthor(text)}
              style={styles.input}
            />

            {/* Pick a Book File */}
            <Button title="Pick a File" onPress={pickBookFile} />
            {selectedFile && <Text>Selected File: {selectedFile.name}</Text>}
            <br></br>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={uploadBook}
              >
                <Text style={styles.textStyle}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Add Modal content here */}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    width: "100%",
  },
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: 300,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: "#007BFF",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
