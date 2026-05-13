import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "./RegistroUsuarioStyles";

export default function RegistroUsuario({ navigation }) {

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorNombre, setErrorNombre] = useState("");
  const [errorTelefono, setErrorTelefono] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [errorFoto, setErrorFoto] = useState("");

  // 📷 Función para seleccionar fotografía
  const seleccionarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert("Permiso denegado", "Se necesitan permisos para acceder a las fotos");
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!resultado.canceled) {
        setFotoPerfil(resultado.assets[0]);
        setErrorFoto("");
      }
    } catch (error) {
      console.log("Error al seleccionar foto:", error);
      Alert.alert("Error", "No se pudo seleccionar la foto");
    }
  };

const registrarUsuario = async () => {
  setErrorNombre("");
  setErrorTelefono("");
  setErrorCorreo("");
  setErrorPassword("");
  setErrorConfirmPassword("");
  setErrorFoto("");

  let hasError = false;

  if (!nombre.trim()) {
    setErrorNombre("El nombre es obligatorio");
    hasError = true;
  }
  if (telefono.length < 10) {
    setErrorTelefono("El teléfono debe tener 10 dígitos");
    hasError = true;
  }
  if (!/\S+@\S+\.\S+/.test(correo)) {
    setErrorCorreo("Correo inválido");
    hasError = true;
  }
  if (password.length <= 8 || !/[A-Z]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    setErrorPassword("La contraseña debe tener más de 8 caracteres, 1 mayúscula y 1 carácter especial");
    hasError = true;
  }
  if (password !== confirmPassword) {
    setErrorConfirmPassword("Las contraseñas no coinciden");
    hasError = true;
  }
  if (!fotoPerfil) {
    setErrorFoto("Selecciona una fotografía de perfil");
    hasError = true;
  }

  if (hasError) return;

  try {
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("telefono", telefono);
    formData.append("email", correo);
    formData.append("password", password);
    
    // Agregar foto si existe
    if (fotoPerfil) {
      const response = await fetch(fotoPerfil.uri);
      const blob = await response.blob();
      formData.append("foto", blob, "foto.jpg");
    }

    console.log("🚀 Enviando datos de registro...");
    console.log("Nombre:", nombre, "Teléfono:", telefono, "Email:", correo);
    console.log("Foto seleccionada:", fotoPerfil ? "Sí" : "No");

    const response = await fetch("http://localhost:3000/registro", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("Respuesta del servidor:", response.status, data);

    if (response.ok) {
      Alert.alert("Éxito", "Usuario registrado correctamente");
      navigation.navigate("Login");
    } else {
      Alert.alert("Error", data.message || "Error al registrar");
    }

  } catch (error) {
    console.log("❌ Error en registro:", error);
    Alert.alert("Error", "Error de conexión con el servidor");
  }
};


  

/// Lo que se ve

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require("../../../assets/logo.png")}
        style={styles.headerImage}
      />

      {/* 🔥 FORMULARIO COMPLETO */}
      <View style={styles.formCard}>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre:</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={(text) => { setNombre(text); setErrorNombre(""); }}
          />
          <Text style={{ color: 'red' }}>{errorNombre}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono:</Text>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={(text) => { setTelefono(text); setErrorTelefono(""); }}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Text style={{ color: 'red' }}>{errorTelefono}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo:</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={(text) => { setCorreo(text); setErrorCorreo(""); }}
            keyboardType="email-address"
          />
          <Text style={{ color: 'red' }}>{errorCorreo}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña:</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={(text) => { setPassword(text); setErrorPassword(""); }}
              secureTextEntry={!mostrarPassword}
            />
            <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
              <Text style={{ marginLeft: 10 }}>
                {mostrarPassword ? "🙈" : "👁"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: 'red' }}>{errorPassword}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirmar contraseña:</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setErrorConfirmPassword(""); }}
              secureTextEntry={!mostrarPassword}
            />
            <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
              <Text style={{ marginLeft: 10 }}>
                {mostrarPassword ? "🙈" : "👁"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: 'red' }}>{errorConfirmPassword}</Text>
        </View>

        {/* 📷 Fotografía de Perfil */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Fotografía de perfil:</Text>
          {fotoPerfil ? (
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <Image
                source={{ uri: fotoPerfil.uri }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  marginBottom: 10,
                  borderWidth: 2,
                  borderColor: "#7CEDA3",
                }}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: "#ff6b6b",
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                  borderRadius: 5,
                }}
                onPress={() => setFotoPerfil(null)}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  ❌ Cambiar foto
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: "#7CEDA3",
                borderRadius: 10,
                padding: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(124, 237, 163, 0.1)",
              }}
              onPress={seleccionarFoto}
            >
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📷</Text>
              <Text style={{ color: "#555", fontWeight: "bold" }}>
                Selecciona una foto
              </Text>
            </TouchableOpacity>
          )}
          <Text style={{ color: "red" }}>{errorFoto}</Text>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={registrarUsuario}>
          <Text style={styles.submitBtnText}>Registrarse</Text>
        </TouchableOpacity>
      </View>


    </ScrollView>
  );
}