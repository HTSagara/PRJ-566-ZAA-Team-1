import React, { useState, useEffect, useContext } from "react";
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
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { RootStackParamList } from "./types"; // Import your defined types
import Loading from "@/components/Loading";
import { AuthContext, type User } from "@/utilities/authContext";
import { BookContext } from "@/utilities/bookContext";
import { getAllBooks, uploadBookToDB } from "@/utilities/backendService";

const { width } = Dimensions.get("window");

export default function LibraryScreen() {
  const user = useContext(AuthContext) as User;
  const { books, setBooks } = useContext(BookContext);

  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingBook, setUploadingBook] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const pickBookFile = async () => {
    console.debug("Inside library.tsx pickBookFile()");

    let result = await DocumentPicker.getDocumentAsync({
      type: [".epub"],
      copyToCacheDirectory: true,
    });

    if (result && result.output && result.output.length > 0) {
      setSelectedFile(result.assets[0]);
      console.debug("File selected: ", result.assets[0].name); // Log the file name
    } else {
      console.debug("File picking canceled or failed.");
    }
  };

  const uploadBook = async () => {
    console.debug("inside library uploadBook()");
    setUploadingBook(true);

    if (selectedFile && selectedFile.name.endsWith(".epub")) {
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

      //console log
      for (let [key, value] of formData.entries()) {
        console.debug(`${key}:`, value);
      }

      try {
        const newBookData = await uploadBookToDB(user, formData);
        setBooks([...books, newBookData]);
      } catch (error) {
        console.error("Error uploading book:", error);
        Alert.alert("Error", "An error occurred during upload.");
      } finally {
        setModalVisible(false);
        setUploadingBook(false);
        setSelectedFile(null);
      }
    } else {
      Alert.alert("Invalid file", "Please select a valid EPUB file.");
    }
  };

  useEffect(() => {
    const fetchBooks = async () => {
        setLoading(true);

        try {
          const data = await getAllBooks(user);
          setBooks(data);
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
      {books.length <= 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text>Library is empty...</Text>
          <Text>Upload a book to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("bookDetails", { bookId: item.id }); // Navigate to book details
              }}
              style={styles.cardContainer}
            >
              <View style={styles.card}>
                <Image
                  source={{
                    uri: item.imgUrl || "https://placehold.co/100x150",
                  }}
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
      )}

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
            {uploadingBook ? (
              <Loading message="Uploading book..." />
            ) : (
              <>
                <Text style={styles.modalText}>Upload a Book (EPUB)</Text>

                {/* Pick a Book File */}
                <TouchableOpacity
                  style={[styles.button, styles.buttonPick]}
                  onPress={pickBookFile}
                >
                  <Text style={styles.textStyle}>Pick a File</Text>
                </TouchableOpacity>

                {selectedFile && (
                  <Text>Selected File: {selectedFile.name}</Text>
                )}
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
                    onPress={() => {
                      setModalVisible(false);
                      setSelectedFile(null);
                    }}
                  >
                    <Text style={styles.textStyle}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
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
  cardList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: 350,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 50,
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
    marginTop: 15,
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
  buttonPick: {
    backgroundColor: "#28A745",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
