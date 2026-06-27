import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { s, vs, ms } from "../../utils/responsive";
import storage from "../../utils/storage";
import { API_URL } from "../../utils/api";
import useToast from "../../utils/useToast";

export default function EditarPerfilPaseador({ navigation }) {
  const [usuarioId, setUsuarioId] = useState(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [biografia, setBiografia] = useState("");
  const [zonaOperacion, setZonaOperacion] = useState("");
  const [tarifa, setTarifa] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoNueva, setFotoNueva] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    const usuarioStr = storage.getItem("usuario");
    if (usuarioStr) {
      const usuario = JSON.parse(usuarioStr);
      const partes = (usuario.nombre_completo || "").split(" ");
      setUsuarioId(usuario.usuario_id);
      setNombre(partes[0] || "");
      setApellido(partes.slice(1).join(" ") || "");
      setCorreo(usuario.email || "");
      setTelefono(usuario.telefono || "");
      setBiografia(usuario.biografia || "");
      setZonaOperacion(usuario.zona_operacion || "");
      setTarifa(usuario.tarifa_base_hora != null ? String(usuario.tarifa_base_hora) : "");
      setFotoPerfil(usuario.url_foto_perfil || null);
    }
  }, []);

  const seleccionarFoto = async () => {
    if (!isEditing) setIsEditing(true);
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          showToast("Se necesitan permisos para acceder a las fotos.", "warning");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled) setFotoNueva(result.assets[0]);
    } catch {
      showToast("No se pudo seleccionar la foto.", "error");
    }
  };

  const guardarCambios = async () => {
    if (!nombre.trim()) {
      showToast("El nombre es obligatorio.", "warning");
      return;
    }
    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("nombre", `${nombre.trim()} ${apellido.trim()}`.trim());
      formData.append("email", correo.trim());
      formData.append("telefono", telefono.trim());

      if (fotoNueva) {
        if (Platform.OS === "web") {
          const resp = await fetch(fotoNueva.uri);
          const blob = await resp.blob();
          formData.append("foto", blob, "perfil.jpg");
        } else {
          formData.append("foto", { uri: fotoNueva.uri, name: "perfil.jpg", type: "image/jpeg" });
        }
      }

      const resUsuario = await fetch(`${API_URL}/usuario/${usuarioId}`, { method: "PUT", body: formData });
      const dataUsuario = await resUsuario.json();
      if (!resUsuario.ok) throw new Error(dataUsuario.message || "Error al guardar usuario");

      const resPaseador = await fetch(`${API_URL}/paseador/${usuarioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biografia: biografia.trim(),
          zona_operacion: zonaOperacion.trim(),
          tarifa: parseFloat(tarifa) || 100,
        }),
      });
      const dataPaseador = await resPaseador.json();
      if (!resPaseador.ok) throw new Error(dataPaseador.message || "Error al guardar paseador");

      const usuarioStr = storage.getItem("usuario");
      const usuarioActual = usuarioStr ? JSON.parse(usuarioStr) : {};
      storage.setItem("usuario", JSON.stringify({
        ...usuarioActual,
        ...dataUsuario.usuario,
        biografia: dataPaseador.paseador.biografia,
        zona_operacion: dataPaseador.paseador.zona_operacion,
        tarifa_base_hora: dataPaseador.paseador.tarifa_base_hora,
      }));

      setFotoPerfil(dataUsuario.usuario.url_foto_perfil);
      setFotoNueva(null);
      setIsEditing(false);
      showToast("Perfil actualizado correctamente.", "success");
    } catch (err) {
      showToast(err.message || "No se pudieron guardar los cambios.", "error");
    } finally {
      setGuardando(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) guardarCambios();
    else setIsEditing(true);
  };

  const fotoSrc = fotoNueva
    ? { uri: fotoNueva.uri }
    : fotoPerfil
    ? { uri: `${API_URL}/uploads/${fotoPerfil}` }
    : null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: ms(26) }}>↩</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Editar perfil</Text>

        <View style={styles.formCard}>
          <TouchableOpacity style={styles.avatarContainer} onPress={seleccionarFoto}>
            {fotoSrc ? (
              <Image source={fotoSrc} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ fontSize: ms(30) }}>👤</Text>
              </View>
            )}
            <Text style={{ fontWeight: "bold", marginTop: vs(5), color: isEditing ? "#000" : "#666" }}>
              {fotoNueva ? "✅ Foto lista" : "📷 Cambiar foto"}
            </Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre:</Text>
              <TextInput style={styles.input} value={nombre} onChangeText={setNombre} editable={isEditing} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellido:</Text>
              <TextInput style={styles.input} value={apellido} onChangeText={setApellido} editable={isEditing} />
            </View>
          </View>

          <View style={styles.fullInputGroup}>
            <Text style={styles.label}>Correo:</Text>
            <TextInput style={styles.input} value={correo} onChangeText={setCorreo} editable={isEditing} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.fullInputGroup}>
            <Text style={styles.label}>Teléfono:</Text>
            <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} editable={isEditing} keyboardType="phone-pad" />
          </View>

          <View style={styles.fullInputGroup}>
            <Text style={styles.label}>Biografía:</Text>
            <TextInput
              style={[styles.input, { height: vs(70), textAlignVertical: "top", paddingTop: vs(8) }]}
              value={biografia}
              onChangeText={setBiografia}
              editable={isEditing}
              multiline
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Zona:</Text>
              <TextInput style={styles.input} value={zonaOperacion} onChangeText={setZonaOperacion} editable={isEditing} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tarifa/hora ($):</Text>
              <TextInput style={styles.input} value={tarifa} onChangeText={setTarifa} editable={isEditing} keyboardType="numeric" />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={toggleEdit} disabled={guardando}>
            {guardando ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.saveBtnText}>{isEditing ? "Guardar" : "Editar"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {ToastComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  header: { flexDirection: "row", justifyContent: "space-between", padding: s(18), paddingTop: vs(50) },
  title: { fontSize: ms(26), textAlign: "center", fontFamily: "serif", marginBottom: vs(10) },
  formCard: { backgroundColor: "#99D9C1", marginHorizontal: s(18), borderRadius: s(40), padding: s(20), alignItems: "center", elevation: 5, marginBottom: vs(30) },
  avatarContainer: { alignItems: "center", marginBottom: vs(18) },
  avatar: { width: s(95), height: s(95), borderRadius: s(48), backgroundColor: "#fff", borderWidth: 1, justifyContent: "center", alignItems: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: vs(14) },
  inputGroup: { width: "48%" },
  fullInputGroup: { width: "100%", marginBottom: vs(14) },
  label: { fontSize: ms(13), fontWeight: "bold", marginBottom: vs(4) },
  input: { backgroundColor: "#D9D9D9", height: vs(40), borderRadius: s(8), paddingHorizontal: s(10) },
  saveBtn: { backgroundColor: "#E6B5B5", paddingVertical: vs(12), paddingHorizontal: s(45), borderRadius: s(25), marginTop: vs(10) },
  saveBtnText: { fontWeight: "bold", fontSize: ms(17), color: "#000" },
});
