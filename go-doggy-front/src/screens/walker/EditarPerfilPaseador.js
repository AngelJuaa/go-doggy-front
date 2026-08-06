import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "./EditarPerfilPaseadorStyle";
import { API_URL } from "../../utils/api";
import storage from "../../utils/storage";

export default function EditarPerfilPaseador({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [biografia, setBiografia] = useState("");
  const [zonaOperacion, setZonaOperacion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [tarifa, setTarifa] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPerfilAsset, setFotoPerfilAsset] = useState(null);
  const [paseadorId, setPaseadorId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const paseadorStr = storage.getItem("paseador");
    if (!paseadorStr) return;

    try {
      const paseador = JSON.parse(paseadorStr);
      setPaseadorId(paseador.paseador_id || paseador.id || null);
      setNombre(paseador.nombre || "");
      setApellido(paseador.apellido || "");
      setBiografia(paseador.biografia || "");
      setZonaOperacion(paseador.zona_operacion || paseador.zona || "");
      setTelefono(paseador.telefono || "");
      setCorreo(paseador.correo || paseador.email || "");
      setTarifa(String(paseador.tarifa_base_hora || paseador.tarifa || ""));
      if (paseador.url_foto_perfil) {
        setFotoPerfil({ uri: `${API_URL}/uploads/${paseador.url_foto_perfil}` });
      }
    } catch (error) {
      console.warn("Error cargando paseador para edición", error);
    }
  }, []);

  const seleccionarFoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert("Permiso denegado", "Se necesitan permisos para acceder a las fotos.");
          return;
        }
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!resultado.canceled) {
        setFotoPerfil({ uri: resultado.assets[0].uri });
        setFotoPerfilAsset(resultado.assets[0]);
      }
    } catch (error) {
      console.warn("Error seleccionando foto:", error);
      Alert.alert("Error", "No se pudo seleccionar la foto.");
    }
  };

  const actualizarPerfil = async () => {
    if (!paseadorId) {
      Alert.alert("Error", "No se pudo identificar el paseador.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("apellido", apellido);
      formData.append("correo", correo);
      formData.append("biografia", biografia);
      formData.append("zona_operacion", zonaOperacion);
      formData.append("telefono", telefono);
      formData.append("tarifa_base_hora", tarifa);

      if (fotoPerfilAsset?.uri) {
        const response = await fetch(fotoPerfilAsset.uri);
        const blob = await response.blob();
        formData.append("foto", blob, "foto.jpg");
      }

      const res = await fetch(`${API_URL}/paseador/${paseadorId}`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo actualizar el perfil.");
      }

      storage.setItem("paseador", JSON.stringify(data));
      Alert.alert("Perfil actualizado", "Tus datos se actualizaron correctamente.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>↩</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Editar perfil de paseador</Text>

        <View style={styles.formCard}>
          <View style={styles.photoSection}>
            <Image
              source={fotoPerfil || require("../../../assets/perfil.png")}
              style={styles.photo}
            />
            <TouchableOpacity style={styles.photoButton} onPress={seleccionarFoto}>
              <Text style={styles.photoButtonText}>Cambiar foto</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput style={styles.input} value={apellido} onChangeText={setApellido} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Biografía</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={biografia}
            onChangeText={setBiografia}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Zona de operación</Text>
          <TextInput style={styles.input} value={zonaOperacion} onChangeText={setZonaOperacion} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo</Text>
          <TextInput style={styles.input} value={correo} onChangeText={setCorreo} keyboardType="email-address" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tarifa por hora</Text>
          <TextInput
            style={styles.input}
            value={tarifa}
            onChangeText={setTarifa}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={actualizarPerfil} disabled={loading}>
          <Text style={styles.submitBtnText}>{loading ? "Actualizando..." : "Actualizar perfil"}</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("InicioPaseador") }>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PaseosPaseador") }>
          <Text style={styles.tabIcon}>✅</Text>
          <Text style={styles.tabLabel}>Paseos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("NotificacionesPaseador") }>
          <Text style={styles.tabIcon}>🔔</Text>
          <Text style={styles.tabLabel}>Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("PerfilPaseador") }>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
