import React, { useContext, useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  TextInput,
} from "react-native";
import { ReactReader } from "react-reader";
import { useRoute } from "@react-navigation/native";
import type { Rendition, Contents } from "epubjs";
import Section from "epubjs/types/section";
import Icon from "react-native-vector-icons/FontAwesome";
import { AuthContext, type User } from "@/utilities/authContext";
import {
  Highlight,
  regenerateHighlightImage,
  fetchUpdatedHighlight,
  getAllHighlightsByBookId,
  getBookByBookId,
} from "@/utilities/backendService";
import Loading from "@/components/Loading";

interface Selection {
  id?: string;
  text: string;
  location: string;
  imgUrl?: string;
}

const BookReader: React.FC = () => {
  const user = useContext(AuthContext) as User;
  const ctxMenuRef = useRef<any>(null);

  const route = useRoute();
  const { bookId, userHighlight } = route.params as {
    bookId: string;
    userHighlight: Highlight;
  };

  const [location, setLocation] = useState<string | number>(0);
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [imageModalVisible, setImageModalVisible] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>("Saving highlight...");
  const [saveErrorMessage, setSaveErrorMessage] = useState<string>(
    "Error saving highlight."
  );
  const [selectedHighlight, setSelectedHighlight] = useState<Selection | null>(
    null
  );
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
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const imageURL = selectedHighlight?.imgUrl;
  const highlightId = imageURL?.split("/").pop()?.replace(".png", "");

  // Fetch book data
  useEffect(() => {
    if (!bookId) {
      setError("No bookId provided");
      setLoading(false);
      return;
    }

    const fetchBook = async () => {
      try {
        const response = await getBookByBookId(user, bookId);
        setBookUrl(response);

        const data = await getAllHighlightsByBookId(user, bookId);
        setHighlights(data);

        if (userHighlight && userHighlight.location) {
          setLocation(userHighlight.location);
        }
      } catch (error) {
        console.error("Error fetching book:", error);
        setError("Error fetching book.");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId, user]);

  // Adding highlights
  useEffect(() => {
    if (highlights && rendition) {
      highlights.forEach((highlight) => {
        rendition.annotations.add(
          "highlight",
          highlight.location,
          {},
          () => handleHighlightClick(highlight),
          "hl",
          {
            fill: "red",
            "fill-opacity": "0.5",
            "mix-blend-mode": "multiply",
          }
        );
      });

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
            if (menu && !menu.contains(e.target as Node) && e.button === 0) {
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
  }, [setSelection, rendition, highlights]);

  const handleRegenerate = async () => {
    if (!selectedHighlight || !selectedHighlight.imgUrl) return;

    try {
      const imgUrl = selectedHighlight.imgUrl;
      const highlightId = imgUrl.split("/").pop()?.replace(".png", "");

      if (!highlightId) {
        console.error("Unable to extract highlight ID from imgUrl:", imgUrl);
        return;
      }

      setModalVisible(true);

      const putSuccess = await regenerateHighlightImage(
        user,
        bookId,
        highlightId
      );
      if (putSuccess) {
        const updatedHighlight = await fetchUpdatedHighlight(
          user,
          bookId,
          highlightId
        );

        const timestampedUrl = `${updatedHighlight.imgUrl}?t=${new Date().getTime()}`;

        setHighlights(
          highlights.map((h) =>
            h.location === selectedHighlight.location
              ? { ...h, imgUrl: timestampedUrl }
              : h
          )
        );
        setSelectedHighlight({ ...updatedHighlight, imgUrl: timestampedUrl });
      }
    } catch (error) {
      console.error(
        "Error in regenerating image or fetching updated highlight:",
        error
      );
    } finally {
      setModalVisible(false);
    }
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
          // @ts-ignore: DO NOT REMOVE THIS COMMENT
          // This annotation was added because typescript throws an error
          //   for getContents()[0]
          // The return type for getContents() is outdated and actually returns
          //   Contents[] instead of Contents
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

  // Function to handle delete image highlight
  const deleteImageHighlight = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch(
        `http://localhost:8000/book/${bookId}/highlight/${highlightId}/image`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );
  
      if (response.ok) {
        setHighlights((prevHighlights) =>
          prevHighlights.map((item) =>
            item.id === highlightId ? { ...item, imgUrl: undefined } : item
          )
        );
        setImageModalVisible(false); // Close the modal
      } else {
        const errorData = await response.json();
        setError(`Error removing image: ${errorData.message}`);
      }
    } catch (err) {
      console.log(`Exception while calling the delete API: ${err}.`);
      setError("Error removing image.");
    } finally {
      setLoading(false);
    }
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

        if (response.ok) {
          const data = await response.json();
          setGeneratedImageUrl(data.imgUrl || null);
          setHighlights([...highlights, { ...selection, imgUrl: data.imgUrl }]);
        } else {
          console.error("Failed to visualize highlight", response);
          setSaveError(true);
        }
      } catch (error) {
        console.error("Failed to visualize highlight", error);
        setSaveError(true);
      } finally {
        setModalVisible(false);
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleHighlightClick = (highlight: Selection) => {
    setSelectedHighlight(highlight);
    setImageModalVisible(true);
  };

  const applySettings = () => {
    if (rendition) {
        // Apply font size directly
        rendition.themes.fontSize(`${fontSize}px`);

        // Register and apply the custom theme for dark/light mode and font color
        rendition.themes.register("custom", {
            "html, body": {
                color: isDarkMode ? "#FFFFFF" : "#000000",
                background: isDarkMode ? "#000000" : "#FFFFFF",
            },
        });
        rendition.themes.select("custom");
    }

    setSettingsModalVisible(false);
};

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading book...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{error}</Text>
      </View>
    );
  }

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

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setSettingsModalVisible(true)}
      >
        <Icon name="cog" size={24} color="white" />
      </TouchableOpacity>

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

      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={(value) => setIsDarkMode(value)}
            />
            <Text>Font Size</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(fontSize)}
              onChangeText={(value) => setFontSize(parseFloat(value) || 16)}
            />
            <TouchableOpacity onPress={applySettings}>
              <Text style={styles.closeButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {selectedHighlight?.imgUrl ? (
              <>
                <View style={styles.imageHeader}>
                  <Text>Generated image:</Text>
                  <TouchableOpacity onPress={deleteImageHighlight}>
                    <Icon
                      name="trash"
                      size={24}
                      style={{ color: "gray", marginHorizontal: 10 }}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleRegenerate()}>
                    <Icon
                      name="refresh"
                      size={16}
                      color="#000000"
                      style={styles.refreshIcon}
                    />
                  </TouchableOpacity>
                </View>
                <Image
                  source={{ uri: selectedHighlight.imgUrl }}
                  style={{ width: 325, height: 325 }}
                  resizeMode="contain"
                />
              </>
            ) : (
              <Text>No image available for this highlight.</Text>
            )}
            <TouchableOpacity onPress={() => setImageModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            {!saveError ? (
              <Loading message={saveMessage} />
            ) : (
              <>
                <Text>{saveErrorMessage}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setSaveError(false);
                  }}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
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
  settingsButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 25,
    zIndex: 1,
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
  },
  imageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    width: "80%",
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    marginTop: 20,
    color: "blue",
    fontWeight: "bold",
  },
  refreshIcon: {
    marginLeft: 8,
  },
  trashIcon: {
    width: 24,
    height: 24,
    marginLeft: 10,
  },
});

export default BookReader;
