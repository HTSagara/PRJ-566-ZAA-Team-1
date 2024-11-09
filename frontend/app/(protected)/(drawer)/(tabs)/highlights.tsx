import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    Modal,
    ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getUser } from "@/utilities/auth";
import Icon from "react-native-vector-icons/FontAwesome";
import Entypo from "react-native-vector-icons/Entypo";
import Ionicons from "react-native-vector-icons/Ionicons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { FlatList } from "react-native-gesture-handler";
import { deleteHighlight } from "@/utilities/book";
import Loading from "@/components/Loading"; // Import the Loading component

export interface Highlight {
  id: string;
  text: string;
  location: string;
  imgUrl?: string;
}

export default function ShowBookHighlights() {

  const route = useRoute();
  const [highlight, setHighlight] = useState<Highlight[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(
    null
  ); // Track selected highlight ID
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  const [loading, setLoading] = useState(false); // Loading indicator
  const [error, setError] = useState<string | null>(null); // Error handling
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { bookId } = route.params as { bookId: string };
  const backendURL = process.env.EXPO_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    const fetchHighlights = async () => {
      console.log("Book ID:", bookId); // Log bookId at the start of fetching

      if (!bookId) {
        console.log("Book ID is missing"); // Log if bookId is not available
        return;
      }


        try {
            const user = await getUser();
            if (!user) {
            Alert.alert("Error", "No user found.");
            return;
            }

            const response = await fetch(
            backendURL + `/book/${bookId}/highlights`,
            {
                method: "GET",
                headers: {
                Authorization: `Bearer ${user.accessToken}`,
                },
            }
            );

            if (response.ok) {
            const data = await response.json();
            console.log(data);
            setHighlight(data);
            // alert(data.message);
            } else {
            const error = await response.json();
            alert(`Error while getting book highlights: ${error.message}.`);
            }
        } catch (err) {
            console.log(`Exception while calling the API: ${err}.`);
            Alert.alert("Error", "Failed during the API call.");
        }
        };

        fetchHighlights();
    }, [bookId, backendURL]);

    const handleDeleteHighlight = async () => {
        console.log("Book ID:", bookId); // Log bookId before deletion
        console.log("Selected Highlight ID:", selectedHighlightId); // Log selectedHighlightId before deletion

        if (!selectedHighlightId || !bookId) {
        console.log("Error: Missing selected highlight or book ID");
        return;
        }

        setLoading(true);
        setError(null);

        try {
        await deleteHighlight(bookId, selectedHighlightId);
        setHighlight((prevHighlights) =>
            prevHighlights.filter((h) => h.id !== selectedHighlightId)
        );
        setModalVisible(false);
        } catch (err) {
        setError("Error with deleting highlight");
        } finally {
        setLoading(false);
        setSelectedHighlightId(null);
        }
    };

    // Function to handle delete image highlight
    const deleteImageHighlight = async () => {
        setLoading(true);
        setError(null);

        try {
            const user = await getUser();
            if (!user) {
                Alert.alert("Error", "No user found.");
                setLoading(false);
                return;
            }

            const response = await fetch(
                `${backendURL}/book/${bookId}/highlight/${selectedHighlightId}/image`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${user.accessToken}`,
                    },
                }
            );

            if (response.ok) {
                // Remove image from the selected highlight
                setHighlight((prevHighlights) =>
                    prevHighlights.map((item) =>
                        item.id === selectedHighlightId
                            ? { ...item, imgUrl: undefined }
                            : item
                    )
                );
                setModalVisible(false);
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

    return (
        <div>
        <div>
            <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                onPress={() => navigation.navigate("bookDetails", { bookId })}
                >
                <Icon name="chevron-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Highlights</Text>
            </View>
            </View>
        </div>
        <FlatList
            data={highlight}
            renderItem={({ item }) => (
            <TouchableOpacity
                onPress={() => {
                navigation.navigate("bookReader", {
                    bookId: bookId,
                    userHighlight: item,
                });
                }}
                style={styles.cardContainer}
            >
                <View style={styles.card}>
                {item.imgUrl && (
                    <Icon name="image" size={24} style={{ marginHorizontal: 10 }} />
                )}
                <Text style={styles.highlightText}>{item.text}</Text>
                <TouchableOpacity
                    onPress={() => {
                    setModalVisible(true);
                    setSelectedHighlightId(item.id); // Set selected highlight for deletion
                    }}
                >
                    <Entypo
                    name="dots-three-vertical"
                    size={24}
                    style={styles.menuIcon}
                    />
                </TouchableOpacity>
                </View>
            </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cardList}
            numColumns={2}
        />

        {/* Delete Confirmation Modal */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
            setModalVisible(!modalVisible);
            setSelectedHighlightId(null);
            }}
        >
            <View style={styles.modalContainer}>
            <View style={styles.modalView}>
                <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                    setModalVisible(!modalVisible);
                    setSelectedHighlightId(null);
                }}
                >
                <Ionicons name="close" size={28} color="#000" />
                </TouchableOpacity>
                <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={deleteImageHighlight}>
                    <Text style={styles.textStyle}>Delete Image highlight</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button]}
                    onPress={handleDeleteHighlight} // Delete highlight on press
                >
                    <Text style={styles.textStyle}>Delete highlight</Text>
                </TouchableOpacity>
                </View>
                {error && (
                <Text style={{ color: "red", marginTop: 10 }}>{error}</Text>
                )}
            </View>
            </View>
        </Modal>

        {/* Loading Modal */}
        {loading && (
            <Modal transparent={true} animationType="fade" visible={loading}>
            <View style={styles.loadingContainer}>
                <View style={styles.loadingBox}>
                <Loading message="Deleting highlight..." />
                </View>
            </View>
            </Modal>
        )}
        </div>
    );
}

const styles = StyleSheet.create({
  cardList: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardContainer: {
    flex: 1,
    padding: 35,
  },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    maxWidth: "60%",
    backgroundColor: "#d9d9d9",
  },
  highlightText: {
    fontSize: 15,
    flex: 1,
    marginHorizontal: 10,
  },
  menuIcon: {
    marginLeft: "auto",
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
  buttonRow: {
    flex: 1,
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginRight: 15,
    backgroundColor: "red",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },

  // Loading modal background styling
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  loadingBox: {
    width: 200,
    height: 100,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
});
// =======



//   return (
//     <div>
//       <div>
//         <View style={styles.container}>
//           <View style={styles.header}>
//             <TouchableOpacity
//               onPress={() => navigation.navigate("bookDetails", { bookId })}
//             >
//               <Icon name="chevron-left" size={24} color="#000" />
//             </TouchableOpacity>
//             <Text style={styles.headerTitle}>Highlights</Text>
//           </View>
//         </View>
//       </div>
//       <FlatList
//         data={highlight}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             onPress={() => {
//               navigation.navigate("bookReader", {
//                 bookId: bookId,
//                 userHighlight: item,
//               });
//             }}
//             style={styles.cardContainer}
//           >
//             <View style={styles.card}>
//               {item.imgUrl && (
//                 <Icon name="image" size={24} style={{ marginHorizontal: 10 }} />
//               )}
//               <Text style={styles.highlightText}>{item.text}</Text>
//               <TouchableOpacity
//                 onPress={() => {
//                   setModalVisible(true);
//                   setSelectedHighlightId(item.id); // Set selected highlight for deletion
//                 }}
//               >
//                 <Entypo
//                   name="dots-three-vertical"
//                   size={24}
//                   style={styles.menuIcon}
//                 />
//               </TouchableOpacity>
//             </View>
//           </TouchableOpacity>
//         )}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={styles.cardList}
//         numColumns={2}
//       />

//       {/* Delete Confirmation Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => {
//           setModalVisible(!modalVisible);
//           setSelectedHighlightId(null);
//         }}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalView}>
//             <TouchableOpacity
//               style={styles.closeButton}
//               onPress={() => {
//                 setModalVisible(!modalVisible);
//                 setSelectedHighlightId(null);
//               }}
//             >
//               <Ionicons name="close" size={28} color="#000" />
//             </TouchableOpacity>
//             <View style={styles.buttonRow}>
//               <TouchableOpacity style={styles.button}>
//                 <Text style={styles.textStyle}>Delete Image highlight</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.button]}
//                 onPress={handleDeleteHighlight} // Delete highlight on press
//               >
//                 <Text style={styles.textStyle}>Delete highlight</Text>
//               </TouchableOpacity>
//             </View>
//             {error && (
//               <Text style={{ color: "red", marginTop: 10 }}>{error}</Text>
//             )}
//           </View>
//         </View>
//       </Modal>

//       {/* Loading Modal */}
//       {loading && (
//         <Modal transparent={true} animationType="fade" visible={loading}>
//           <View style={styles.loadingContainer}>
//             <View style={styles.loadingBox}>
//               <Loading message="Deleting highlight..." />
//             </View>
//           </View>
//         </Modal>
//       )}
//     </div>
//   );
// }

// const styles = StyleSheet.create({
//   cardList: {
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   cardContainer: {
//     flex: 1,
//     padding: 35,
//   },
//   card: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//     borderRadius: 5,
//     marginHorizontal: 5,
//     maxWidth: "60%",
//     backgroundColor: "#d9d9d9",
//   },
//   highlightText: {
//     fontSize: 15,
//     flex: 1,
//     marginHorizontal: 10,
//   },
//   menuIcon: {
//     marginLeft: "auto",
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0,0,0,0.5)",
//   },
//   modalView: {
//     width: 350,
//     backgroundColor: "white",
//     borderRadius: 20,
//     padding: 50,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   buttonRow: {
//     flex: 1,
//     marginTop: 15,
//     flexDirection: "row",
//     justifyContent: "space-around",
//     width: "100%",
//   },
//   button: {
//     borderRadius: 10,
//     padding: 10,
//     elevation: 2,
//     marginRight: 15,
//     backgroundColor: "red",
//   },
//   textStyle: {
//     color: "white",
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   container: {
//     flex: 1,
//     padding: 20,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 10,
//     marginBottom: 10,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: "bold",
//     textAlign: "center",
//     flex: 1,
//   },
//   closeButton: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     padding: 5,
//   },

//   // Loading modal background styling
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0,0,0,0.5)",
//   },
//   loadingBox: {
//     width: 200,
//     height: 100,
//     backgroundColor: "white",
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 10,
//   },
// });
// >>>>>>> origin/main
