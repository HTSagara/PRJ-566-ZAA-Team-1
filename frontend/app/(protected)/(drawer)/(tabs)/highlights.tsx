import React, { useEffect, useState } from "react";
import {
    View,
    Text,
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
import Entypo from "react-native-vector-icons/Entypo";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { router } from "expo-router";
import { FlatList } from "react-native-gesture-handler";

//defining highlight interface
export interface Highlight {
    id: string;
    text: string;
    location: string;
    imageUrl?: string;
}

export default function ShowBookHighlights() {
    const route = useRoute();
    const [highlight, setHighlight] = useState<Highlight[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

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
                    console.log(data)
                    setHighlight(data)
                    // alert(data.message);
                } else {
                    const error = await response.json();
                    alert(`Error while getting book highlights: ${error.message}.`);
                }
            } catch (err) {
                console.log(`Exception while calling the API: ${err}.`);
                Alert.alert("Error", "Failed during the API call.");
            }
        }

        fetchHighlights()
    }, [bookId, backendURL]);

    return (
        <div>
            <FlatList
                data={highlight}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => {
                            navigation.navigate('bookReader', { bookId: bookId, userHighlight: item });
                        }}
                        style={styles.cardContainer}
                    >
                        <View style={styles.card}>
                            {item.imageUrl && (
                                <Icon
                                    name="image"
                                    size={24}
                                    style={{ marginHorizontal: 10 }}
                                />
                            )}
                            <Text style={styles.highlightText}>{item.text}</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(true)}
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

            {/*Modal View*/}
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
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={[styles.button]}>
                                <Text style={styles.textStyle}>Delete Image highlight</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button}>
                                <Text style={styles.textStyle}>Delete highlight</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </div>
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
        //marginTop: 20,
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        marginRight: 15,
        backgroundColor: "red"
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
});
