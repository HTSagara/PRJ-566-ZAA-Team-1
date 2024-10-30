import React, { useContext, useState, useEffect, useRef } from "react";
import { Modal, View, Text, Alert, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { ReactReader } from "react-reader";
import { useRoute } from "@react-navigation/native";
import { getUser } from "@/utilities/auth";
import type { Rendition, Contents } from "epubjs";
import Section from "epubjs/types/section";

import Loading from "@/components/Loading";
import { AuthContext, type User } from "@/utilities/auth";

interface Selection {
  text: string
  location: string
}

const BookReader: React.FC = () => {

  const user = useContext(AuthContext) as User;
  const ctxMenuRef = useRef<any>(null);

  const route = useRoute();
  const { bookId } = route.params as { bookId: string };

  const [location, setLocation] = useState<string | number>(0);
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Handle loading
  const [error, setError] = useState<string | null>(null); // Handle error
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [saveHighlightError, setSaveHighlightError] = useState<boolean>(false);

  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });
  const [selection, setSelection] = useState<Selection | null>(null)
  const [rendition, setRendition] = useState<Rendition | undefined>(undefined)

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

  useEffect(() => {
    if (rendition) {

      function setContextMenuHandler(section: Section, view: any) {

        const viewX = view.element.getBoundingClientRect().x;
        const viewY = view.element.getBoundingClientRect().y;

        const iframe = view.iframe as HTMLIFrameElement | null;
        const iframeDoc = iframe?.contentDocument;
        const iframeWindow = iframe?.contentWindow;


        if (iframeDoc && iframeWindow) {

          function contextMenuHandler(event: MouseEvent) {
            event.preventDefault();
            const textSelection = iframeWindow?.getSelection();
            if (textSelection && textSelection.toString().length > 0) {
              const x = event.screenX - (viewX * 0.25)
              const y = event.screenY - (viewY * 2.5)
              setContextMenu({ visible: true, x, y });
            }
          }

          function dismissMenuHandler(event: MouseEvent) {
            if (ctxMenuRef.current && !(ctxMenuRef.current as HTMLElement).contains(event.target as Node) && event.button == 0) {
              setContextMenu({ visible: false, x: 0, y: 0 });
            }
          }

          // Right-click event inside the iframe
          iframeDoc.addEventListener('contextmenu', contextMenuHandler)
          iframeDoc.addEventListener("mousedown", dismissMenuHandler)
        }
        else {
          console.error("Unable to find epubjs iframe");
        }

      }

      function setRenderSelection(cfiRange: string, contents: Contents) {
        if (rendition) {
          const selection: Selection = {
            text: rendition.getRange(cfiRange).toString(),
            location: cfiRange,
          }
          console.log(selection)
          setSelection(selection)
        }
      }

      rendition.on("rendered", setContextMenuHandler)
      rendition.on('selected', setRenderSelection)

      return () => {
        rendition?.off("rendered", setContextMenuHandler)
        rendition?.off('selected', setRenderSelection)
      }
    }
  }, [setSelection, rendition])

  const handleHighlight = async () => {
    if (rendition && selection) {

      setModalVisible(true);

      try {
        const response = await fetch(`http://localhost:8000/book/${bookId}/highlight`, {
          method: "POST",
          body: JSON.stringify(selection),
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });

        if (response.status === 200) {
          console.log("Book uploaded successfully!")
          console.log(response.json())
          setModalVisible(false)
        } 
        else {
          console.error("Failed to upload book", response)
          setSaveHighlightError(true);
        }
      } 
      catch (error) {
        console.error("Error uploading book:", error);
        setSaveHighlightError(true);
      } 

      rendition.annotations.add(
        'highlight',
        selection.location,
        {},
        (e: MouseEvent) => console.log('click on selection', selection.location, e),
        'hl',
        { fill: 'red', 'fill-opacity': '0.5', 'mix-blend-mode': 'multiply' }
      )

      // getContents() actually returns Contents[] and not Contents
      // @ts-ignore: because return type of getContents() is outdated
      rendition.getContents()[0]?.window?.getSelection()?.removeAllRanges();
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleRenderImage = () => {
    Alert.alert("Render Image", "Render Image option selected");
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
          epubInitOptions={{openAs: 'epub'}}
          location={location}
          locationChanged={(epubcfi: string) => setLocation(epubcfi)}
          getRendition={(rendition: Rendition) => setRendition(rendition)}
        />
      ) : (
        <Text>Book URL is not available.</Text>
      )}

      {contextMenu.visible && (
        <View style={[styles.contextMenu, { top: contextMenu.y, left: contextMenu.x }]} ref={ctxMenuRef}>
          <TouchableOpacity style={styles.contextMenuItem} onPress={handleHighlight}>
            <Text>Highlight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contextMenuItem} onPress={handleRenderImage}>
            <Text>Visualize</Text>
          </TouchableOpacity>
        </View>
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
          {!saveHighlightError ?
          <Loading message="Saving highlight..."/>
          :
          <Text>Error saving highlight.</Text>
          }
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
});

export default BookReader;

