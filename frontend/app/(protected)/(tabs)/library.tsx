import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  TextInput, // Import TextInput for input fields
  View,
  FlatList,
  ListRenderItem,
  ActivityIndicator,
  Dimensions,
  Modal,
  Button,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system'; // This is used to get the file as a blob
import { Platform } from "react-native";

// Define the book type
interface Book {
  id: string;
  title: string;
  author: string;
  image: string;
}

const { width } = Dimensions.get("window");

export default function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null); // State for Image File
  const [title, setTitle] = useState<string>(""); // State for Title
  const [author, setAuthor] = useState<string>(""); // State for Author

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

  // Function to open modal
  const handleUpload = () => {
    setModalVisible(true);
  };

 // Function to pick a PDF or EPUB book file
  const pickBookFile = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/epub+zip"],
      copyToCacheDirectory: true,
    });

    if (result && result.output && result.output.length > 0) {
      setSelectedFile(result.assets[0]);
      console.log("File selected: ", result.assets[0].name);  // Log the file name
    } else {
      console.log("File picking canceled or failed.");
    }
  };
  // Function to pick an image file
  const pickImageFile = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: ["image/*"],
      copyToCacheDirectory: true,
    });

    if (result && result.output && result.output.length > 0) {
      setSelectedImage(result.assets[0]);
      console.log("Image selected: ", result.assets[0].name);  // Log the image name
    } else {
      console.log("Image picking canceled or failed.");
    }
  };
  
  // Function to upload the book file with metadata
  const uploadBook = async () => {
    if (selectedFile && (selectedFile.name.endsWith(".pdf") || selectedFile.name.endsWith(".epub"))) {
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
  
      // Check if an image file is selected and convert it to Blob similarly
      if (selectedImage) {
        const imageBlob = await fetch(selectedImage.uri)
          .then((response) => response.blob())
          .catch((error) => {
            console.error("Error converting image to blob:", error);
            return null;
          });
  
        if (imageBlob) {
          formData.append("image", imageBlob, selectedImage.name);
        }
      }
      
      //console log
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      try {
        const response = await fetch("http://localhost:8000/book", {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data", // Ensure multipart form data
          },
        });
  
        if (response.status === 200) {
          Alert.alert("Success", "Book uploaded successfully!");
        } else {
          Alert.alert("Error", "Failed to upload book");
        }
      } catch (error) {
        console.error("Error uploading book:", error);
        Alert.alert("Error", "An error occurred during upload.");
      } finally {
        setModalVisible(false);
        setSelectedFile(null); // Reset selected file after upload
        setSelectedImage(null); // Reset selected image
        setTitle(""); // Reset title
        setAuthor(""); // Reset author
      }
    } else {
      Alert.alert("Invalid file", "Please select a valid PDF or EPUB file.");
    }
  };
  





  return (
    <View style={styles.container}>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={handleUpload} style={styles.uploadButton}>
          <Text style={styles.buttonText}>Upload a book</Text>
        </TouchableOpacity>
      </View>
  
      {/* Book cards list */}
      <FlatList
        data={books}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => console.log(item.title)} style={styles.cardContainer}>
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.bookImage} resizeMode="contain" />
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

            {/* Pick an Image */}
            <Button title="Pick a Book Cover" onPress={pickImageFile} />
            {selectedImage && <Text>Selected Book Cover: {selectedImage.name}</Text>}
            <br></br>
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
      </Modal>
    </View>
  );
}


// css
const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerRight: {
    position: 'absolute',
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