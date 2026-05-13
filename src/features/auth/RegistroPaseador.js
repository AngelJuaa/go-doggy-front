import React from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { styles } from "./RegistroPaseadorStyles";

export default function RegistroPaseador({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require("../../../assets/logo.png")}
        style={styles.headerImage}
      />

      <View style={styles.formCard}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre:</Text>
          <TextInput style={styles.input} />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Biografía:</Text>
          <TextInput style={styles.input} multiline />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dirección:</Text>
          <TextInput style={styles.input} />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono:</Text>
          <TextInput style={styles.input} keyboardType="phone-pad" />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña:</Text>
          <TextInput style={styles.input} secureTextEntry />
        </View>

        <View style={styles.photoRow}>
          <Text style={styles.label}>Añadir Foto</Text>
          <TouchableOpacity style={styles.photoBox}>
            <Text style={styles.photoText}>FOTO</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.submitBtnText}>Crear Usuario</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
