import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import styles from "../../assets/styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api.js";

export default function Create() {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { token } = useAuthStore();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "We need camera roll permissions to upload an image"
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.3,
      });

      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setImage(selectedAsset.uri);
        
        const uriParts = selectedAsset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1] || 'jpg';
        
        setImageInfo({
          uri: selectedAsset.uri,
          type: `image/${fileType}`,
          name: `photo.${fileType}`
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "There was a problem selecting your image");
    }
  };

  const handleSubmit = async () => {
    if (!title || !caption || !image || !rating) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      
      formData.append('title', title);
      formData.append('caption', caption);
      formData.append('rating', rating.toString());
      
      formData.append('image', imageInfo);

      const response = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert("Success", "Your book recommendation has been posted!");

      setTitle("");
      setCaption("");
      setRating(3);
      setImage(null);
      setImageInfo(null);

      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderRatingPicker = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={32}
            color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          style={styles.scrollViewStyle}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Book Recommendation</Text>
              <Text style={styles.subtitle}>
                Share your favourite reads with others
              </Text>
            </View>

            <View style={styles.form}>
              {/* BOOK TITLE */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Book Title</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="book-outline"
                    size={20}
                    color={COLORS.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter book title"
                    placeholderTextColor={COLORS.placeholderText}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
              </View>

              {/* RATING */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Your Rating</Text>
                {renderRatingPicker()}
              </View>

              {/* IMAGE */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Book Image</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.placeholderContainer}>
                      <Ionicons
                        name="image-outline"
                        size={40}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.placeholderText}>
                        Tap to select image
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* CAPTION */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Caption</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Write your review or thoughts about this book..."
                  placeholderTextColor={COLORS.placeholderText}
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                />
              </View>

              {/* SHARE BUTTON */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color={COLORS.white}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.buttonText}>Share</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}