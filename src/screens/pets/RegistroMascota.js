import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { s, vs, ms } from "../../utils/responsive";
import storage from "../../utils/storage";
import { API_URL } from "../../utils/api";
import useToast from "../../utils/useToast";

const formatNombreMascota = (text) => {
  return text
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function RegistroMascota({ navigation }) {
  const [usuarioId, setUsuarioId] = useState(null);
  const [nombreMascota, setNombreMascota] = useState("");
  const [tipoMascota, setTipoMascota] = useState("");
  const [raza, setRaza] = useState("");
  const [color, setColor] = useState("");
  const [sexo, setSexo] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [peso, setPeso] = useState("");
  const [esterilizado, setEsterilizado] = useState(false);
  const [miedos, setMiedos] = useState("");
  const [tieneAlergia, setTieneAlergia] = useState(false);
  const [alergias, setAlergias] = useState("");
  const [patas, setPatas] = useState(4);
  const [notasExtra, setNotasExtra] = useState("");
  const [foto, setFoto] = useState(null);
  const [hoveredTab, setHoveredTab] = useState(null);
  const { showToast, ToastComponent } = useToast();

  // Error states
  const [errorTipoMascota, setErrorTipoMascota] = useState("");
  const [errorNombreMascota, setErrorNombreMascota] = useState("");
  const [errorRaza, setErrorRaza] = useState("");
  const [errorColor, setErrorColor] = useState("");
  const [errorSexo, setErrorSexo] = useState("");
  const [errorFechaNacimiento, setErrorFechaNacimiento] = useState("");
  const [errorPeso, setErrorPeso] = useState("");
  const [errorAlergias, setErrorAlergias] = useState("");
  const [errorFoto, setErrorFoto] = useState("");

  useEffect(() => {
    const usuarioStr = storage.getItem("usuario");
    if (usuarioStr) {
      const usuario = JSON.parse(usuarioStr);
      setUsuarioId(usuario.usuario_id);
    }
  }, []);

  const seleccionarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        showToast("Se necesitan permisos para acceder a las fotos.", "warning");
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!resultado.canceled) {
        setFoto(resultado.assets[0]);
        setErrorFoto("");
      }
    } catch (error) {
      console.log("Error al seleccionar foto:", error);
      showToast("No se pudo seleccionar la foto.", "error");
    }
  };

  const guardarRegistro = async () => {
    // Clear all errors
    setErrorTipoMascota("");
    setErrorNombreMascota("");
    setErrorRaza("");
    setErrorColor("");
    setErrorSexo("");
    setErrorFechaNacimiento("");
    setErrorPeso("");
    setErrorAlergias("");
    setErrorFoto("");
    //Extras jejej
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
      setErrorPeso("Ingresa un peso válido mayor a 0");
      hasError = true;
    }
    const fechaDate = new Date(fechaNacimiento);
    if (
      fechaNacimiento.trim() &&
      (!(fechaDate instanceof Date) || isNaN(fechaDate.getTime()))
    ) {
      setErrorFechaNacimiento("Usa el formato YYYY-MM-DD y una fecha válida");
      hasError = true;
    }
    if (patas < 0 || patas > 7) {
      // Maybe add errorPatas, but since it's buttons, perhaps not necessary, or add a general error
      // For now, skip or add errorPatas
    }
    if (tieneAlergia && !alergias.trim()) {
      setErrorAlergias("Describe la alergia");
      hasError = true;
    }
    // Foto es opcional en web
    if (hasError) return;

    if (!usuarioId) {
      showToast("Usuario no identificado.", "error");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("nombre", formatNombreMascota(nombreMascota));
      formData.append("raza", raza);
      formData.append("color", color);
      formData.append("sexo", sexo);
      formData.append("fechaNacimiento", fechaNacimiento);
      formData.append("peso", peso);

      formData.append("esterilizado", esterilizado ? "Si" : "No");
      formData.append("miedos", miedos);
      formData.append("alergias", tieneAlergia ? alergias : "No");
      formData.append("patas", patas);
      formData.append("notasExtra", notasExtra);
      formData.append("usuario_id", usuarioId);

      // 📷 FOTO (FORMA CORRECTA PARA WEB)
      if (foto) {
        const responseImg = await fetch(foto.uri);
        const blob = await responseImg.blob();

        formData.append("foto", blob, "mascota.jpg");
      }

      console.log("🚀 Enviando mascota...");
      console.log("Foto incluida:", !!foto);

      const response = await fetch(`${API_URL}/mascota`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log("📡 RESPUESTA:", data);

      if (response.ok) {
        showToast("¡Mascota registrada correctamente!", "success");
        setTimeout(() => navigation.navigate("Inicio_cliente"), 1500);
      } else {
        showToast(data.message || "Error al guardar.", "error");
      }
    } catch (error) {
      console.error("❌ Error frontend:", error);
      showToast("No se pudo conectar con el servidor.", "error");
    }
  };

  const selectedColor = "#D2B48C";
  const unselectedColor = "#fff";

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 28 }}>↩</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
            <Text style={styles.title}>Registro de Mascota</Text>

            <View style={styles.card}>
              {/* 12. Foto (arriba) */}
              <View style={styles.imageWrapper}>
                {foto ? (
                  <Image source={{ uri: foto.uri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={{ color: "#555" }}>Sin foto</Text>
                  </View>
                )}
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

              {/* 13. Tipo mascota (arriba) */}
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

              {/* 1. nombre mascota */}
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

              {/* 2. raza */}
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

              {/* 3. color */}
              <View style={styles.section}>
                <Text style={styles.label}>Color</Text>
                <TextInput
                  style={styles.input}
                  value={color}
                  onChangeText={(value) => {
                    setColor(value);
                    setErrorColor("");
                  }}
                  placeholder="Ej: Café"
                />
                <Text style={styles.errorText}>{errorColor}</Text>
              </View>

              {/* 4. sexo checkbox */}
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

              {/* 5. fecha de nacimiento */}
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

              {/* 6. peso */}
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

              {/* 7. esterilizado si/no */}
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

              {/* 8. miedos */}
              <View style={styles.section}>
                <Text style={styles.label}>Miedos</Text>
                <TextInput
                  style={styles.input}
                  value={miedos}
                  onChangeText={setMiedos}
                  placeholder="Ej: Trueno, aspiradora"
                />
              </View>

              {/* 9. alergia check si/no + campo */}
              <View style={styles.section}>
                <Text style={styles.label}>¿Tiene alergia?</Text>
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

              {/* 10. patas 0-7 */}
              <View style={styles.section}>
                <Text style={styles.label}>Número de patas (0-7)</Text>
                <View style={styles.patasRow}>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setPatas(n)}
                      style={[
                        styles.smallButton,
                        {
                          borderColor: patas === n ? "#27ae60" : "#ccc",
                          backgroundColor: patas === n ? "#d1f7e8" : "#fff",
                        },
                      ]}
                    >
                      <Text>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 11. notas extra */}
              <View style={styles.section}>
                <Text style={styles.label}>Notas extra</Text>
                <TextInput
                  style={styles.inputMultiline}
                  value={notasExtra}
                  onChangeText={setNotasExtra}
                  multiline
                  placeholder="Información adicional..."
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={guardarRegistro}
              style={styles.submitBtn}
            >
              <Text style={styles.submitText}>Guardar mascota</Text>
            </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(0)}
          onMouseLeave={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Inicio_cliente")}
        >
          {hoveredTab === 0 && <Text style={styles.tabLabel}>Inicio</Text>}
          <Image source={require("../../../assets/casa.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(1)}
          onMouseLeave={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("Servicio_Cliente_Inicio")}
        >
          {hoveredTab === 1 && <Text style={styles.tabLabel}>Servicio</Text>}
          <Image source={require("../../../assets/puntos.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(2)}
          onMouseLeave={() => setHoveredTab(null)}
          onPress={() => showToast("El mapa estará disponible pronto.", "info")}
        >
          {hoveredTab === 2 && <Text style={styles.tabLabel}>Mapa</Text>}
          <Image source={require("../../../assets/maps.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onMouseEnter={() => setHoveredTab(3)}
          onMouseLeave={() => setHoveredTab(null)}
          onPress={() => navigation.navigate("NotificacionesUsuario")}
        >
          {hoveredTab === 3 && <Text style={styles.tabLabel}>Notificaciones</Text>}
          <Image source={require("../../../assets/Notificaciones.png")} style={styles.tabIconImg} />
        </TouchableOpacity>
      </View>

      {ToastComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100vh",
    backgroundColor: "#f5f5f5",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    padding: s(10),
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: s(15),
    paddingBottom: vs(20),
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
  photoPlaceholder: {
    width: s(130),
    height: s(130),
    borderRadius: s(65),
    borderWidth: 2,
    borderColor: "#7CEDA3",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9ffe8",
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
  bottomTab: {
    flexDirection: "row",
    backgroundColor: "#99D9C1",
    height: vs(65),
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: { alignItems: "center", justifyContent: "center", flex: 1 },
  tabLabel: { fontSize: ms(10), fontWeight: "bold", color: "#333", marginBottom: vs(2) },
  tabIconImg: { width: s(38), height: s(38), resizeMode: "contain" },
});
