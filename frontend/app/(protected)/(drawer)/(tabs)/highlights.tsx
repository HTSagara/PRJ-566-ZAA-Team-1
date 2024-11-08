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

// defining highlight interface
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
    const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { bookId } = route.params;
    const backendURL = process.env.EXPO_PUBLIC_BACKEND_API_URL;

    useEffect(() => {
        const fetchHighlights = async () => {
            try {
                const user = await getUser();
                if (!user) {
                    Alert.alert("Error", "No user found.");
                    return;
                }

                const response = await fetch(backendURL + `/book/${bookId}/highlights`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${user.accessToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setHighlight(data);
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

    // Function to handle delete image highlight
    const deleteImageHighlight = async () => {
        if (!selectedHighlight?.id) return;

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
                `${backendURL}/book/${bookId}/highlight/${selectedHighlight.id}/image`,
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
                        item.id === selectedHighlight.id
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
        <View>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("bookdetails", { bookId })}
                    >
                        <Icon name="chevron-left" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Highlights</Text>
                </View>
            </View>
            <FlatList
                data={highlight}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => {
                            navigation.navigate("bookReader", { bookId: bookId, userHighlight: item });
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
                                    setSelectedHighlight(item);
                                    setModalVisible(true);
                                }}
                            >
                                <Entypo name="dots-three-vertical" size={24} style={styles.menuIcon} />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.cardList}
                numColumns={2}
            />

            {/* Modal View */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    if (!loading) {
                        setModalVisible(!modalVisible);
                    }
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setModalVisible(false)}
                                    disabled={loading}
                                >
                                    <Ionicons name="close" size={28} color="#000" />
                                </TouchableOpacity>

                                {error && (
                                    <Text style={styles.errorText}>{error}</Text>
                                )}

                                <View style={styles.buttonRow}>
                                    {selectedHighlight?.imgUrl && !error && (
                                        <TouchableOpacity
                                            style={[styles.button]}
                                            onPress={deleteImageHighlight}
                                        >
                                            <Text style={styles.textStyle}>Delete Image highlight</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity style={styles.button}>
                                        <Text style={styles.textStyle}>Delete highlight</Text>
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
    cardList: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    cardContainer: {
        flex: 1,
        padding: 35,
    },
    card: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 5,
        maxWidth: '60%',
        backgroundColor: '#d9d9d9',
    },
    highlightText: {
        fontSize: 15,
        flex: 1,
        marginHorizontal: 10,
    },
    menuIcon: {
        marginLeft: 'auto',
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
        padding: 30,
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
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    button: {
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        elevation: 2,
        backgroundColor: "red",
        marginHorizontal: 10,
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
        flex: 1
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
    },
    errorText: {
        color: "red",
        marginBottom: 10,
    },
});