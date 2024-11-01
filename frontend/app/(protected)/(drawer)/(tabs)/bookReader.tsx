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
  imgUrl?: string;
}

const BookReader: React.FC = () => {
  const user = useContext(AuthContext) as User;

  const ctxMenuRef = useRef<any>(null);

  const route = useRoute();
  const { bookId } = route.params as { bookId: string };

  const [location, setLocation] = useState<string | number>(0);
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Selection[]>([])
  const [loading, setLoading] = useState(true); // Handle loading
  const [error, setError] = useState<string | null>(null); // Handle error
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [saveError, setSaveError] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("Saving highlight..." );
  const [saveErrorMessage, setSaveErrorMessage] = useState<string>("Error saving highlight.");

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [rendition, setRendition] = useState<Rendition | undefined>(undefined);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!bookId) {
      setError("No bookId provided");
      setLoading(false);
      return;
    }

    // Fetch the book
    const fetchBook = async () => {
      try {

        // Get book url
        let response = await fetch(`http://localhost:8000/book/${bookId}`, {
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

        // Get book highlights
        const url = `http://localhost:8000/book/${bookId}/highlights`;
        response = await fetch(url, {
          method: "GET",
          headers: user.authorizationHeaders(),
        });

        if (response.status == 200) {
          const data = await response.json();
          setHighlights(data);
        }
        else {
          console.error("Either failed to fetch book highlights or there are no highlights for the book");
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

      // Populate book highlights in rendition
      highlights.forEach(highlight => {
        rendition.annotations.add(
          "highlight",
          highlight.location,
          undefined,
          undefined,
          "hl",
          {
            fill: "red",
            "fill-opacity": "0.5",
            "mix-blend-mode": "multiply",
          }
        );
      })

      function setContextMenuHandler(_: Section, view: any) {
        const iframe = view.iframe as HTMLIFrameElement | null;
        const iframeDoc = iframe?.contentDocument;
        const iframeWindow = iframe?.contentWindow;

        if (iframeDoc && iframeWindow) {
          function contextMenuHandler(event: MouseEvent) {
            event.preventDefault();
            const textSelection = iframeWindow?.getSelection();
            if (textSelection && textSelection.toString().length > 0) {
              const x = event.screenX - window.screenX + 5;
              const y = event.screenY - window.screenY - 275;
              setContextMenu({ visible: true, x, y });
            }
          }

          function dismissMenuHandler(e: MouseEvent) {
            const menu = ctxMenuRef.current as HTMLElement;
            if (menu && !menu.contains(e.target as Node) && e.button == 0) {
              setContextMenu({ visible: false, x: 0, y: 0 });
            }
          }

          iframeDoc.addEventListener("contextmenu", contextMenuHandler);
          iframeDoc.addEventListener("mousedown", dismissMenuHandler);
        } else {
          console.error("Unable to find epubjs iframe");
        }
      }

      function setRenderSelection(cfiRange: string, _: Contents) {
        if (rendition) {
          const selection: Selection = {
            text: rendition.getRange(cfiRange).toString(),
            location: cfiRange,
          };
          setSelection(selection);
        }
      }

      rendition.on("rendered", setContextMenuHandler);
      rendition.on("selected", setRenderSelection);

      return () => {
        rendition?.off("rendered", setContextMenuHandler);
        rendition?.off("selected", setRenderSelection);
      };
    }
  }, [setSelection, rendition]);

  const handleHighlight = async () => {
    if (rendition && selection) {
      setSaveMessage("Saving highlight...")
      setSaveErrorMessage("Error saving highlight.")
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

          // getContents() actually returns Contents[] and not Contents
          // @ts-ignore: because return type of getContents() is outdated
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
      setSaveMessage("Visualizing highlight...")
      setSaveErrorMessage("Error saving highlight.")
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
            (e: MouseEvent) =>
              console.log("click on selection", selection.location, e),
            "hl",
            {
              fill: "red",
              "fill-opacity": "0.5",
              "mix-blend-mode": "multiply",
            }
          );

          // getContents() actually returns Contents[] and not Contents
          // @ts-ignore: because return type of getContents() is outdated
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
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={handleHighlight}
          >
            <Text>Highlight</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={handleRenderImage}
          >
            <Text>Visualize</Text>
          </TouchableOpacity>
        </View>
      )}

      {generatedImageUrl && (
        <View style={{ margin: 20 }}>
          <Text>Generated Image:</Text>
          <Image
            source={{ uri: generatedImageUrl }}
            style={{ width: 200, height: 200 }}
            resizeMode="contain"
          />
        </View>
      )}

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
            {!saveError ? (
              <Loading message={saveMessage}/>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {setModalVisible(false); setSaveError(false);}}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
                <Text>{saveErrorMessage}</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
});

export default BookReader;
