import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { styles } from "./styles/RegistroPaseadorStyles";
import { API_URL } from "../../utils/api";
import useToast from "../../utils/useToast";

export default function RegistroPaseador({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [biografia, setBiografia] = useState("");
  const [zona, setZona] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tarifa, setTarifa] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const registrar = async () => {
    if (!nombre || !email || !password || !telefono) {
      showToast("Completa nombre, teléfono, correo y contraseña.", "warning");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("telefono", telefono);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("biografia", biografia);
      formData.append("zona_operacion", zona);
      formData.append("tarifa", tarifa || "100");

      const response = await fetch(`${API_URL}/registro-paseador`, { method: "POST", body: formData });
      const data = await response.json();

      if (response.ok) {
        showToast("Paseador registrado correctamente.", "success");
        setTimeout(() => navigation.navigate("Login", { tipo: "paseador" }), 1500);
      } else {
        showToast(data.message || "Error al registrar.", "error");
      }
    } catch {
      showToast("No se pudo conectar con el servidor.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={{ position: "absolute", top: 45, left: 18, zIndex: 20, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14 }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "bold" }}>← Volver</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require("../../../assets/logo.png")} style={styles.headerImage} />

        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre completo:</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Biografía:</Text>
            <TextInput style={styles.input} value={biografia} onChangeText={setBiografia} multiline />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Zona de operación:</Text>
            <TextInput style={styles.input} value={zona} onChangeText={setZona} />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tarifa por hora ($):</Text>
            <TextInput style={styles.input} value={tarifa} onChangeText={setTarifa} keyboardType="numeric" />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono:</Text>
            <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" maxLength={10} />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo:</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña:</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={registrar} disabled={loading}>
            <Text style={styles.submitBtnText}>{loading ? "Registrando..." : "Crear Paseador"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {ToastComponent}
    </View>
  );
}
