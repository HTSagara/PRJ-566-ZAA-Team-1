import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
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
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { router } from "expo-router";
import { FlatList } from "react-native-gesture-handler";

//defining highlight interface

interface Highlight {
    id: string;
    text: string;
    location: string;
    imageUrl?: string;
}

export default function ShowBookHighlights()
{
    const route = useRoute();
    const [highlight, setHighlight] = useState<Highlight[]>([]);
    const [loading, setLoading] = useState(true);

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const {bookId} = route.params;
    const backendURL = process.env.EXPO_PUBLIC_BACKEND_API_URL;

    useEffect(() => {
        const fetchHighlights = async () => {
            try {
                const user = await getUser();
                console.log("bookId:", bookId)
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
                  alert(data.message);
                } else {
                  const error = await response.json();
                  alert(`Error while getting book highlights: ${error.message}.`);
                }
              }catch(err)
              {
                console.log(`Exception while calling the API: ${err}.`);
                Alert.alert("Error", "Failed during the API call.");
              }
              finally {
                setLoading(false);
              }
        }

        fetchHighlights()
    }, [bookId,backendURL]);

//     return(
//         <div>
//             <FlatList
//                 data={highlight}
//                 renderItem={({ item }) => (
//                     <TouchableOpacity
//                     onPress={() => {
//                         // navigation.navigate('bookdetails', { bookId: item.id }); 
//                     }}
//                     style={styles.cardContainer}
//                     >
//                     <View style={styles.card}>
//                         <Icon name="image" size={24} style={{
//                             marginHorizontal: 10,
//                         }} />
//                         <Text style={styles.highlightText}>{item.text}</Text>
//                         <Icon name="dots-vertical" size={24} style={styles.menuIcon} />
//                     </View>
//                     </TouchableOpacity>
//                 )}
//                 keyExtractor={(item) => item.id}
//                 contentContainerStyle={styles.cardList}
//                 numColumns={2}
//             />
//         </div>
//     );
}

// const styles = StyleSheet.create({
//     cardList: {
//         justifyContent: 'space-between',
//         marginBottom: 10,
//     },
//     cardContainer: {
//         flex: 1, 
//         padding: 20, 
//         backgroundColor: '#f8f8f8',
//     },
//     card: {
//         flex: 1,
//         flexDirection: 'row',
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#ccc',
//         padding: 10,
//         borderRadius: 5,
//         marginHorizontal: 5,
//         maxWidth: '48%',
//     },
//     highlightText:{
//         fontSize: 15
//     },
//     menuIcon: {
//         marginLeft: 'auto',
//     },
//   });