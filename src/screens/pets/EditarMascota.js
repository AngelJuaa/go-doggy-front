import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { s, vs, ms } from "../../utils/responsive";
import { API_URL } from "../../utils/api";

const formatNombreMascota = (text) => {
  return text
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const toBooleanFromDb = (value) => {
  if (typeof value === "boolean") return value;
  const raw = String(value || "").trim().toLowerCase();
  return raw === "si" || raw === "sí" || raw === "true";
};

export default function EditarMascota({ route, navigation }) {
  const { mascota } = route.params;
  const tipoMascotaInicial = mascota.tipo_mascota || mascota.tipoMascota || "";

  const [tipoMascota, setTipoMascota] = useState(tipoMascotaInicial);
  const [nombreMascota, setNombreMascota] = useState(mascota.nombre || "");
  const [raza, setRaza] = useState(mascota.raza || "");
  const [color, setColor] = useState(mascota.color || "");
  const [sexo, setSexo] = useState((mascota.sexo || "").toLowerCase());
  const [fechaNacimiento, setFechaNacimiento] = useState(
    mascota.fecha_nacimiento
      ? mascota.fecha_nacimiento.toString().split("T")[0]
      : ""
  );
  const [peso, setPeso] = useState(
    mascota.peso_kg != null ? mascota.peso_kg.toString() : ""
  );
  const [esterilizado, setEsterilizado] = useState(
    toBooleanFromDb(mascota.esterilizado)
  );
  const [miedos, setMiedos] = useState(mascota.miedos || "");
  const [tieneAlergia, setTieneAlergia] = useState(
    !!(mascota.alergias && mascota.alergias !== "No")
  );
  const [alergias, setAlergias] = useState(
    mascota.alergias && mascota.alergias !== "No" ? mascota.alergias : ""
  );
  const [patas, setPatas] = useState(
    Number.isFinite(Number(mascota.num_patas)) ? Number(mascota.num_patas) : 4
  );
  const [notasExtra, setNotasExtra] = useState(
    mascota.notas_comportamiento || ""
  );
  const [foto, setFoto] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [errorTipoMascota, setErrorTipoMascota] = useState("");
  const [errorNombreMascota, setErrorNombreMascota] = useState("");
  const [errorRaza, setErrorRaza] = useState("");
  const [errorColor, setErrorColor] = useState("");
  const [errorSexo, setErrorSexo] = useState("");
  const [errorFechaNacimiento, setErrorFechaNacimiento] = useState("");
  const [errorPeso, setErrorPeso] = useState("");
  const [errorAlergias, setErrorAlergias] = useState("");
  const [errorFoto, setErrorFoto] = useState("");

  const seleccionarFoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permiso denegado", "Se necesitan permisos para acceder a las fotos.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled) {
        setFoto(result.assets[0]);
        setErrorFoto("");
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo seleccionar la foto.");
    }
  };

  const guardarCambios = async () => {
    setErrorTipoMascota("");
    setErrorNombreMascota("");
    setErrorRaza("");
    setErrorColor("");
    setErrorSexo("");
    setErrorFechaNacimiento("");
    setErrorPeso("");
    setErrorAlergias("");
    setErrorFoto("");

    let hasError = false;

    if (!tipoMascota.trim()) {
      setErrorTipoMascota("El tipo de mascota es obligatorio");
      hasError = true;
    }
    if (!nombreMascota.trim()) {
      setErrorNombreMascota("El nombre de la mascota es obligatorio");
      hasError = true;
    }
    if (!raza.trim()) {
      setErrorRaza("La raza es obligatoria");
      hasError = true;
    }
    if (!color.trim()) {
      setErrorColor("El color es obligatorio");
      hasError = true;
    }
    if (!sexo.trim()) {
      setErrorSexo("El sexo es obligatorio");
      hasError = true;
    }
    if (!fechaNacimiento.trim()) {
      setErrorFechaNacimiento("La fecha de nacimiento es obligatoria");
      hasError = true;
    }
    if (!peso.trim()) {
      setErrorPeso("El peso es obligatorio");
      hasError = true;
    } else if (isNaN(Number(peso)) || Number(peso) <= 0) {
      setErrorPeso("Ingresa un peso valido mayor a 0");
      hasError = true;
    }
    const fechaDate = new Date(fechaNacimiento);
    if (
      fechaNacimiento.trim() &&
      (!(fechaDate instanceof Date) || isNaN(fechaDate.getTime()))
    ) {
      setErrorFechaNacimiento("Usa el formato YYYY-MM-DD y una fecha valida");
      hasError = true;
    }
    if (tieneAlergia && !alergias.trim()) {
      setErrorAlergias("Describe la alergia");
      hasError = true;
    }

    if (hasError) return;

    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("tipoMascota", tipoMascota.trim());
      formData.append("nombreMascota", formatNombreMascota(nombreMascota));
      formData.append("raza", raza.trim());
      formData.append("color", color.trim());
      formData.append("sexo", sexo.trim());
      formData.append("fechaNacimiento", fechaNacimiento.trim());
      formData.append("peso", peso.trim());
      formData.append("esterilizado", esterilizado ? "Si" : "No");
      formData.append("miedos", miedos.trim());
      formData.append("alergias", tieneAlergia ? alergias.trim() : "No");
      formData.append("patas", String(patas));
      formData.append("notasExtra", notasExtra.trim());

      if (foto) {
        const blob = await (await fetch(foto.uri)).blob();
        formData.append("foto", blob, "mascota.jpg");
      }

      const response = await fetch(`${API_URL}/mascota/${mascota.mascota_id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const mascotaActualizada = data.mascota || {
          ...mascota,
          tipo_mascota: tipoMascota.trim(),
          nombre: formatNombreMascota(nombreMascota),
          raza: raza.trim(),
          color: color.trim(),
          sexo: sexo.trim(),
          fecha_nacimiento: fechaNacimiento.trim(),
          peso_kg: Number(peso),
          esterilizado,
          miedos: miedos.trim(),
          alergias: tieneAlergia ? alergias.trim() : "No",
          num_patas: patas,
          notas_comportamiento: notasExtra.trim(),
          url_foto:
            foto && data.mascota?.url_foto
              ? data.mascota.url_foto
              : mascota.url_foto,
        };

        Alert.alert(
          "Exito",
          "Los datos de la mascota se actualizaron correctamente"
        );
        navigation.navigate("MascotaDetalles", {
          mascota: mascotaActualizada,
        });
      } else {
        Alert.alert("Error", data.message || "No se pudo actualizar");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  const imageSrc = foto
    ? { uri: foto.uri }
    : mascota.url_foto
    ? { uri: `${API_URL}/uploads/${mascota.url_foto}` }
    : require("../../../assets/perro1.jpg");

  const selectedColor = "#D2B48C";
  const unselectedColor = "#fff";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={styles.page}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ fontSize: 28 }}>↩</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          >
            <Text style={styles.title}>Editar Mascota</Text>

            <View style={styles.card}>
              <View style={styles.imageWrapper}>
                <Image source={imageSrc} style={styles.photo} />
                <TouchableOpacity
                  onPress={seleccionarFoto}
                  style={styles.photoButton}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    {foto ? "Cambiar foto" : "Agregar foto"}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.errorText}>{errorFoto}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Tipo de mascota</Text>
                <TextInput
                  style={styles.input}
                  value={tipoMascota}
                  onChangeText={(value) => {
                    setTipoMascota(value);
                    setErrorTipoMascota("");
                  }}
                  placeholder="Ej: Perro, Gato, Ave"
                />
                <Text style={styles.errorText}>{errorTipoMascota}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Nombre de la mascota</Text>
                <TextInput
                  style={styles.input}
                  value={nombreMascota}
                  onChangeText={(value) => {
                    setNombreMascota(formatNombreMascota(value));
                    setErrorNombreMascota("");
                  }}
                  placeholder="Ej: Chocokrispis"
                />
                <Text style={styles.errorText}>{errorNombreMascota}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Raza</Text>
                <TextInput
                  style={styles.input}
                  value={raza}
                  onChangeText={(value) => {
                    setRaza(value);
                    setErrorRaza("");
                  }}
                  placeholder="Ej: Pug"
                />
                <Text style={styles.errorText}>{errorRaza}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Color</Text>
                <TextInput
                  style={styles.input}
                  value={color}
                  onChangeText={(value) => {
                    setColor(value);
                    setErrorColor("");
                  }}
                  placeholder="Ej: Cafe"
                />
                <Text style={styles.errorText}>{errorColor}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Sexo</Text>
                <View style={styles.rowSpaceBetween}>
                  {["macho", "hembra"].map((opc, index) => (
                    <TouchableOpacity
                      key={opc}
                      onPress={() => {
                        setSexo(opc);
                        setErrorSexo("");
                      }}
                      style={[
                        styles.checkButton,
                        {
                          marginRight: index === 0 ? 8 : 0,
                          borderColor: sexo === opc ? selectedColor : "#ccc",
                          backgroundColor:
                            sexo === opc ? selectedColor : unselectedColor,
                        },
                      ]}
                    >
                      <Text>{opc.charAt(0).toUpperCase() + opc.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.errorText}>{errorSexo}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Fecha de nacimiento</Text>
                <TextInput
                  style={styles.input}
                  value={fechaNacimiento}
                  onChangeText={(value) => {
                    setFechaNacimiento(value);
                    setErrorFechaNacimiento("");
                  }}
                  placeholder="YYYY-MM-DD"
                />
                <Text style={styles.errorText}>{errorFechaNacimiento}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Peso (kg)</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={peso}
                    onChangeText={(text) => {
                      setPeso(text.replace(/[^0-9.]/g, ""));
                      setErrorPeso("");
                    }}
                    keyboardType="numeric"
                    placeholder="0.0"
                  />
                  <Text style={{ marginLeft: 8, fontWeight: "bold" }}>KG</Text>
                </View>
                <Text style={styles.errorText}>{errorPeso}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Esterilizado</Text>
                <View style={styles.rowSpaceBetween}>
                  {["no", "si"].map((opc, index) => (
                    <TouchableOpacity
                      key={opc}
                      onPress={() => setEsterilizado(opc === "si")}
                      style={[
                        styles.checkButton,
                        {
                          marginRight: index === 0 ? 8 : 0,
                          borderColor:
                            esterilizado === (opc === "si")
                              ? selectedColor
                              : "#ccc",
                          backgroundColor:
                            esterilizado === (opc === "si")
                              ? selectedColor
                              : unselectedColor,
                        },
                      ]}
                    >
                      <Text>{opc.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Miedos</Text>
                <TextInput
                  style={styles.input}
                  value={miedos}
                  onChangeText={setMiedos}
                  placeholder="Ej: Trueno, aspiradora"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Tiene alergia?</Text>
                <View style={styles.rowSpaceBetween}>
                  {["no", "si"].map((opc, index) => (
                    <TouchableOpacity
                      key={opc}
                      onPress={() => {
                        setTieneAlergia(opc === "si");
                        if (opc === "no") setErrorAlergias("");
                      }}
                      style={[
                        styles.checkButton,
                        {
                          marginRight: index === 0 ? 8 : 0,
                          borderColor:
                            tieneAlergia === (opc === "si")
                              ? selectedColor
                              : "#ccc",
                          backgroundColor:
                            tieneAlergia === (opc === "si")
                              ? selectedColor
                              : unselectedColor,
                        },
                      ]}
                    >
                      <Text>{opc.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {tieneAlergia && (
                  <TextInput
                    style={[styles.input, { marginTop: 10 }]}
                    value={alergias}
                    onChangeText={(value) => {
                      setAlergias(value);
                      setErrorAlergias("");
                    }}
                    placeholder="Describe la alergia"
                  />
                )}
                <Text style={styles.errorText}>{errorAlergias}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Numero de patas (0-7)</Text>
                <View style={styles.patasRow}>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setPatas(n)}
                      style={[
                        styles.smallButton,
                        {
                          borderColor: patas === n ? selectedColor : "#ccc",
                          backgroundColor:
                            patas === n ? selectedColor : unselectedColor,
                        },
                      ]}
                    >
                      <Text>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Notas extra</Text>
                <TextInput
                  style={styles.inputMultiline}
                  value={notasExtra}
                  onChangeText={setNotasExtra}
                  multiline
                  placeholder="Informacion adicional..."
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={guardarCambios}
              style={[styles.submitBtn, guardando && { opacity: 0.6 }]}
              disabled={guardando}
            >
              <Text style={styles.submitText}>
                {guardando ? "Actualizando..." : "Actualizar mascota"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoid: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: s(10),
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    padding: s(15),
    paddingBottom: vs(38),
  },
  title: {
    fontSize: ms(22),
    fontWeight: "bold",
    marginBottom: vs(14),
  },
  card: {
    backgroundColor: "#99D9C1",
    borderRadius: s(20),
    padding: s(18),
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  imageWrapper: {
    marginBottom: vs(14),
    alignItems: "center",
  },
  photo: {
    width: s(130),
    height: s(130),
    borderRadius: s(65),
    borderWidth: 2,
    borderColor: "#7CEDA3",
  },
  photoButton: {
    marginTop: vs(7),
    backgroundColor: "#7CEDA3",
    paddingVertical: vs(9),
    paddingHorizontal: s(14),
    borderRadius: s(8),
  },
  section: {
    marginBottom: vs(11),
  },
  label: {
    marginBottom: vs(4),
    fontWeight: "bold",
    fontSize: ms(13),
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: s(11),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: ms(14),
  },
  inputMultiline: {
    width: "100%",
    backgroundColor: "#fff",
    padding: s(11),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "#ddd",
    minHeight: vs(75),
    textAlignVertical: "top",
    fontSize: ms(14),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  patasRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  checkButton: {
    flex: 1,
    padding: s(9),
    borderRadius: s(8),
    borderWidth: 1,
    alignItems: "center",
  },
  smallButton: {
    width: "23%",
    minWidth: s(38),
    minHeight: vs(34),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: s(6),
    borderWidth: 1,
    marginBottom: vs(7),
  },
  errorText: {
    color: "red",
    marginTop: vs(3),
    minHeight: vs(16),
    fontSize: ms(12),
  },
  submitBtn: {
    backgroundColor: "#A67C52",
    padding: s(13),
    borderRadius: s(10),
    alignItems: "center",
    marginTop: vs(10),
  },
  submitText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: ms(15),
  },
});
