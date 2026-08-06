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
import { styles } from "./styles/RegistroPaseadorStyles";
import { API_URL } from "../../utils/api";

export default function RegistroPaseador({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [biografia, setBiografia] = useState("");
  const [zona, setZona] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [tarifa, setTarifa] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [errorNombre, setErrorNombre] = useState("");
  const [errorApellido, setErrorApellido] = useState("");
  const [errorBiografia, setErrorBiografia] = useState("");
  const [errorZona, setErrorZona] = useState("");
  const [errorTelefono, setErrorTelefono] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorContrasenia, setErrorContrasenia] = useState("");
  const [errorTarifa, setErrorTarifa] = useState("");
  const [errorFoto, setErrorFoto] = useState("");
  const [loading, setLoading] = useState(false);

  const seleccionarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          "Permiso denegado",
          "Se necesitan permisos para acceder a las fotos"
        );
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
      console.error("Error al seleccionar foto:", error);
      Alert.alert("Error", "No se pudo seleccionar la foto");
    }
  };

  const registrar = async () => {
    setErrorNombre("");
    setErrorApellido("");
    setErrorBiografia("");
    setErrorZona("");
    setErrorTelefono("");
    setErrorCorreo("");
    setErrorContrasenia("");
    setErrorTarifa("");
    setErrorFoto("");

    let hasError = false;

    if (!nombre.trim()) {
      setErrorNombre("El nombre es obligatorio");
      hasError = true;
    }
    if (!apellido.trim()) {
      setErrorApellido("El apellido es obligatorio");
      hasError = true;
    }
    if (!zona.trim()) {
      setErrorZona("La zona de operación es obligatoria");
      hasError = true;
    }
    if (!telefono.trim() || !/^\d{10}$/.test(telefono)) {
      setErrorTelefono("El teléfono debe tener 10 dígitos");
      hasError = true;
    }
    if (!/\S+@\S+\.\S+/.test(correo)) {
      setErrorCorreo("Correo inválido");
      hasError = true;
    }
    if (
      contrasenia.length <= 8 ||
      !/[A-Z]/.test(contrasenia) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(contrasenia)
    ) {
      setErrorContrasenia(
        "La contraseña debe tener más de 8 caracteres, una mayúscula y un carácter especial"
      );
      hasError = true;
    }
    if (!tarifa.trim() || isNaN(tarifa) || Number(tarifa) <= 0) {
      setErrorTarifa("Ingresa una tarifa válida mayor a 0");
      hasError = true;
    }
    if (!fotoPerfil) {
      setErrorFoto("Selecciona una fotografía de perfil");
      hasError = true;
    }

    if (hasError) {
      Alert.alert(
        "Error",
        "Revisa los campos marcados en rojo para continuar"
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre.trim());
      formData.append("apellido", apellido.trim());
      formData.append("telefono", telefono.trim());
      formData.append("correo", correo.trim());
      formData.append("contrasenia", contrasenia);
      formData.append("biografia", biografia.trim());
      formData.append("zona_operacion", zona.trim());
      formData.append("tarifa_base_hora", tarifa.trim());

      if (fotoPerfil) {
        const responseFoto = await fetch(fotoPerfil.uri);
        const blob = await responseFoto.blob();
        formData.append("foto", blob, "foto.jpg");
      }

      const response = await fetch(`${API_URL}/registro-paseador`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Redirección automática al Login sin mostrar alert
        navigation.navigate("Login", {
          tipo: "paseador",
        });
      } else {
        Alert.alert("Error", data.message || "Error al registrar");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 45,
          left: 18,
          zIndex: 20,
          backgroundColor: "rgba(0,0,0,0.45)",
          borderRadius: 20,
          paddingVertical: 7,
          paddingHorizontal: 14,
        }}
        onPress={() => navigation.goBack()}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: "bold",
          }}
        >
          ← Volver
        </Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require("../../../assets/logo.png")}
          style={styles.headerImage}
        />

        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre:</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={(text) => {
                setNombre(text);
                setErrorNombre("");
              }}
            />
            <Text style={styles.errorText}>{errorNombre}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Apellido:</Text>
            <TextInput
              style={styles.input}
              value={apellido}
              onChangeText={(text) => {
                setApellido(text);
                setErrorApellido("");
              }}
            />
            <Text style={styles.errorText}>{errorApellido}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Biografía:</Text>
            <TextInput
              style={styles.input}
              value={biografia}
              onChangeText={(text) => {
                setBiografia(text);
                setErrorBiografia("");
              }}
              multiline
            />
            <Text style={styles.errorText}>{errorBiografia}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Zona de operación:</Text>
            <TextInput
              style={styles.input}
              value={zona}
              onChangeText={(text) => {
                setZona(text);
                setErrorZona("");
              }}
            />
            <Text style={styles.errorText}>{errorZona}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fotografía de perfil:</Text>
            {fotoPerfil ? (
              <View style={{ alignItems: "center", marginBottom: 10 }}>
                <Image
                  source={{ uri: fotoPerfil.uri }}
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    marginBottom: 10,
                    borderWidth: 2,
                    borderColor: "#7CEDA3",
                  }}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: "#ff6b6b",
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 5,
                  }}
                  onPress={() => setFotoPerfil(null)}
                >
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 13 }}>
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
                  padding: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(124, 237, 163, 0.1)",
                }}
                onPress={seleccionarFoto}
              >
                <Text style={{ fontSize: 36, marginBottom: 8 }}>📷</Text>
                <Text style={{ color: "#555", fontWeight: "bold", fontSize: 14 }}>
                  Selecciona una foto
                </Text>
              </TouchableOpacity>
            )}
            <Text style={styles.errorText}>{errorFoto}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tarifa por hora ($):</Text>
            <TextInput
              style={styles.input}
              value={tarifa}
              onChangeText={(text) => {
                setTarifa(text);
                setErrorTarifa("");
              }}
              keyboardType="numeric"
            />
            <Text style={styles.errorText}>{errorTarifa}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono:</Text>
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={(text) => {
                setTelefono(text);
                setErrorTelefono("");
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Text style={styles.errorText}>{errorTelefono}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo:</Text>
            <TextInput
              style={styles.input}
              value={correo}
              onChangeText={(text) => {
                setCorreo(text);
                setErrorCorreo("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.errorText}>{errorCorreo}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña:</Text>
            <TextInput
              style={styles.input}
              value={contrasenia}
              onChangeText={(text) => {
                setContrasenia(text);
                setErrorContrasenia("");
              }}
              secureTextEntry
            />
            <Text style={styles.errorText}>{errorContrasenia}</Text>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={registrar}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "Registrando..." : "Crear Paseador"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
