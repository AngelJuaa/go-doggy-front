import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "./styles/EditarMascotaStyles";
import { API_URL } from "../../utils/api";
import useToast from "../../utils/useToast";

export default function EditarMascota({ route, navigation }) {
  const { mascota } = route.params;

  const [nombre,     setNombre]     = useState(mascota.nombre             || "");
  const [raza,       setRaza]       = useState(mascota.raza               || "");
  const [color,      setColor]      = useState(mascota.color              || "");
  const [sexo,       setSexo]       = useState(mascota.sexo               || "");
  const [fechaNac,   setFechaNac]   = useState(
    mascota.fecha_nacimiento
      ? mascota.fecha_nacimiento.toString().split("T")[0]
      : ""
  );
  const [peso,       setPeso]       = useState(
    mascota.peso_kg != null ? mascota.peso_kg.toString() : ""
  );
  const [notas,      setNotas]      = useState(mascota.notas_comportamiento || "");
  const [fotoNueva,  setFotoNueva]  = useState(null);
  const [guardando,  setGuardando]  = useState(false);
  const { showToast, ToastComponent } = useToast();

  // ─── Seleccionar foto ──────────────────────────────────────────────────────
  const seleccionarFoto = async () => {
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
    } catch (e) {
      showToast("No se pudo seleccionar la foto.", "error");
    }
  };

  // ─── Guardar cambios en el backend ─────────────────────────────────────────
  const guardar = async () => {
    if (!nombre.trim()) { showToast("El nombre es obligatorio.", "warning"); return; }
    if (peso.trim() && (isNaN(Number(peso)) || Number(peso) <= 0)) {
      showToast("El peso debe ser un número mayor a 0.", "warning");
      return;
    }

    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("nombre",          nombre.trim());
      formData.append("raza",            raza.trim());
      formData.append("color",           color.trim());
      formData.append("sexo",            sexo.trim());
      formData.append("fechaNacimiento", fechaNac.trim());
      formData.append("peso",            peso.trim());
      formData.append("notasExtra",      notas.trim());
      formData.append("esterilizado",    mascota.esterilizado || "No");
      formData.append("miedos",          mascota.miedos || "");
      formData.append("alergias",        mascota.alergias || "");
      formData.append("patas",           mascota.num_patas || 4);

      if (fotoNueva) {
        if (Platform.OS === "web") {
          const blob = await (await fetch(fotoNueva.uri)).blob();
          formData.append("foto", blob, "mascota.jpg");
        } else {
          formData.append("foto", { uri: fotoNueva.uri, name: "mascota.jpg", type: "image/jpeg" });
        }
      }

      const response = await fetch(`${API_URL}/mascota/${mascota.mascota_id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        showToast("Los datos de la mascota se guardaron correctamente.", "success");
        // Navegar de vuelta con los datos actualizados para que MascotaDetalles no muestre datos viejos
        setTimeout(() => {
          navigation.navigate("MascotaDetalles", {
            mascota: {
              ...mascota,
              nombre:                nombre.trim(),
              raza:                  raza.trim(),
              color:                 color.trim(),
              sexo:                  sexo.trim(),
              fecha_nacimiento:      fechaNac.trim() || null,
              peso_kg:               peso.trim() ? parseFloat(peso) : null,
              notas_comportamiento:  notas.trim(),
              url_foto:              data.url_foto ?? mascota.url_foto,
            },
          });
        }, 1500);
      } else {
        showToast(data.message || "No se pudo actualizar.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error de conexión con el servidor.", "error");
    } finally {
      setGuardando(false);
    }
  };

  // ─── Fuente de imagen actual ───────────────────────────────────────────────
  const imageSrc = fotoNueva
    ? { uri: fotoNueva.uri }
    : mascota.url_foto
    ? { uri: `${API_URL}/uploads/${mascota.url_foto}` }
    : require("../../../assets/perro1.jpg");

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 28 }}>↩</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Editar mascota</Text>

      <View style={styles.formCard}>
        {/* FOTO */}
        <TouchableOpacity style={styles.avatarContainer} onPress={seleccionarFoto}>
          <View style={styles.avatar}>
            <Image source={imageSrc} style={styles.petImage} />
          </View>
          <Text style={{ fontWeight: "bold", marginTop: 5 }}>
            {fotoNueva ? "✅ Foto seleccionada" : "Cambiar foto"}
          </Text>
        </TouchableOpacity>

        {/* NOMBRE */}
        <View style={styles.fullInputGroup}>
          <Text style={styles.label}>Nombre de la mascota:</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre"
          />
        </View>

        {/* RAZA + COLOR */}
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Raza:</Text>
            <TextInput style={styles.input} value={raza} onChangeText={setRaza} placeholder="Raza" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color:</Text>
            <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="Color" />
          </View>
        </View>

        {/* SEXO + PESO */}
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexo:</Text>
            <TextInput style={styles.input} value={sexo} onChangeText={setSexo} placeholder="Macho / Hembra" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Peso (kg):</Text>
            <TextInput
              style={styles.input}
              value={peso}
              onChangeText={setPeso}
              keyboardType="numeric"
              placeholder="0.0"
            />
          </View>
        </View>

        {/* FECHA NACIMIENTO */}
        <View style={styles.fullInputGroup}>
          <Text style={styles.label}>Fecha de nacimiento (YYYY-MM-DD):</Text>
          <TextInput
            style={styles.input}
            value={fechaNac}
            onChangeText={setFechaNac}
            placeholder="2020-01-15"
          />
        </View>

        {/* NOTAS */}
        <View style={styles.fullInputGroup}>
          <Text style={styles.label}>Notas especiales:</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: "top", paddingTop: 10 }]}
            value={notas}
            onChangeText={setNotas}
            multiline
            placeholder="Comportamiento, cuidados especiales..."
          />
        </View>

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity style={styles.saveBtn} onPress={guardar} disabled={guardando}>
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Actualizar</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    {ToastComponent}
    </View>
  );
}
