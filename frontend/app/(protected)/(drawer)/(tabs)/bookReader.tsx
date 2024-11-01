import React, { useContext, useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { ReactReader } from "react-reader";
import { useRoute } from "@react-navigation/native";
import { getUser } from "@/utilities/auth";
import type { Rendition, Contents } from "epubjs";
import Section from "epubjs/types/section";

import Loading from "@/components/Loading";
import { AuthContext, type User } from "@/utilities/auth";

interface Selection {
  text: string;
  location: string;
  id: string;
  imgUrl?: string;
}

const BookReader: React.FC = () => {
  const user = useContext(AuthContext) as User;
  const ctxMenuRef = useRef<any>(null);

  const route = useRoute();
  const { bookId } = route.params as { bookId: string };

  const [location, setLocation] = useState<string | number>(0);
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Selection | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Saving highlight...");
  const [saveErrorMessage, setSaveErrorMessage] = useState("Error saving highlight.");

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [rendition, setRendition] = useState<Rendition | undefined>(undefined);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) {
      setError("No bookId provided");
      setLoading(false);
      return;
    }

    const fetchBook = async () => {
      try {
        // Get book URL
        let response = await fetch(`http://localhost:8000/book/${bookId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBookUrl(data.url);
        } else {
          console.error("Error fetching book:", response.statusText);
          setError("Failed to fetch book.");
        }

        // Get highlights
        const highlightsUrl = `http://localhost:8000/book/${bookId}/highlights`;
        response = await fetch(highlightsUrl, {
          method: "GET",
          headers: user.authorizationHeaders(),
        });

        if (response.status === 200) {
          const data = await response.json();
          setHighlights(data);
        } else {
          console.error("Failed to fetch book highlights.");
        }
      } catch (error) {
        console.error("Error fetching book:", error);
        setError("Error fetching book.");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  useEffect(() => {
    if (highlights && rendition) {
      // Add highlights to rendition
      highlights.forEach((highlight) => {
        rendition.annotations.add(
          "highlight",
          highlight.location,
          {},
          () => handleHighlightClick(highlight.id), // Add click handler with highlight ID
          "hl",
          {
            fill: "red",
            "fill-opacity": "0.5",
            "mix-blend-mode": "multiply",
          }
        );
      });
    }
  }, [highlights, rendition]);

  const fetchHighlightMetadata = async (highlightId: string) => {
    try {
      const url = `http://localhost:8000/book/${bookId}/highlight/${highlightId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: user.authorizationHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedHighlight(data); // Set the retrieved highlight data
        setModalVisible(true); // Open the modal
      } else {
        console.error("Failed to fetch highlight metadata:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching highlight metadata:", error);
    }
  };

  const handleHighlightClick = (highlightId: string) => {
    fetchHighlightMetadata(highlightId);
  };

  const handleHighlight = async () => {
    if (rendition && selection) {
      setSaveMessage("Saving highlight...");
      setModalVisible(true);

      try {
        const url = `http://localhost:8000/book/${bookId}/highlight`;
        const response = await fetch(url, {
          method: "POST",
          body: JSON.stringify(selection),
          headers: user.authorizationHeaders(),
        });

        if (response.status === 200) {
          setModalVisible(false);
          rendition.annotations.add(
            "highlight",
            selection.location,
            undefined,
            undefined,
            "hl",
            {
              fill: "red",
              "fill-opacity": "0.5",
              "mix-blend-mode": "multiply",
            }
          );

          rendition.getContents()[0]?.window?.getSelection()?.removeAllRanges();
          setSaveError(false);
        } else {
          console.error("Failed to save highlight", response);
          setSaveError(true);
        }
      } catch (error) {
        console.error("Failed to save highlight", error);
        setSaveError(true);
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleRenderImage = async () => {
    if (rendition && selection) {
      setSaveMessage("Visualizing highlight...");
      setModalVisible(true);

      try {
        const url = `http://localhost:8000/book/${bookId}/highlight?image=true`;
        const response = await fetch(url, {
          method: "POST",
          body: JSON.stringify(selection),
          headers: user.authorizationHeaders(),
        });

        if (response.status === 200) {
          setModalVisible(false);
          rendition.annotations.add(
            "highlight",
            selection.location,
            {},
            (e: MouseEvent) => console.log("click on selection", selection.location, e),
            "hl",
            {
              fill: "red",
              "fill-opacity": "0.5",
              "mix-blend-mode": "multiply",
            }
          );

          rendition.getContents()[0]?.window?.getSelection()?.removeAllRanges();
          setSaveError(false);
        } else {
          console.error("Failed to visualize highlight", response);
          setSaveError(true);
        }
      } catch (error) {
        console.error("Failed to visualize highlight", error);
        setSaveError(true);
      }
    }

    setContextMenu({ visible: false, x: 0, y: 0 });
  };

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
          epubInitOptions={{ openAs: "epub" }}
          location={location}
          locationChanged={(epubcfi: string) => setLocation(epubcfi)}
          getRendition={(rendition: Rendition) => setRendition(rendition)}
        />
      ) : (
        <Text>Book URL is not available.</Text>
      )}

      {contextMenu.visible && (
        <View
          style={[
            styles.contextMenu,
            { top: contextMenu.y, left: contextMenu.x },
          ]}
          ref={ctxMenuRef}
        >
          <TouchableOpacity style={styles.contextMenuItem} onPress={handleHighlight}>
            <Text>Highlight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contextMenuItem} onPress={handleRenderImage}>
            <Text>Visualize</Text>
          </TouchableOpacity>
        </View>
      )}

      {modalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            onPressOut={() => setModalVisible(false)}
          >
            <View style={styles.modalView}>
              {selectedHighlight?.imgUrl ? (
                <>
                  <Text>Highlight image:</Text>
                  <br ></br>
                  <Image
                    source={{ uri: selectedHighlight.imgUrl }}
                    style={{ width: 330, height: 330 }}
                    resizeMode="contain"
                  />
                </>
              ) : (
                <Text>No image generated for this highlight.</Text>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contextMenu: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "black",
    elevation: 5,
    zIndex: 9999,
    padding: 5,
  },
  contextMenuItem: {
    padding: 10,
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
});

export default BookReader;
