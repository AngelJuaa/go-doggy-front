import React, { useState, useEffect } from "react";
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
        const usuarioStr = localStorage.getItem("usuario");
        if (usuarioStr) {
            const usuario = JSON.parse(usuarioStr);
            setUsuarioId(usuario.usuario_id);
        }
    }, []);

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
                setFoto(resultado.assets[0]);
                setErrorFoto("");
            }
        } catch (error) {
            console.log("Error al seleccionar foto:", error);
            Alert.alert("Error", "No se pudo seleccionar la foto");
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
        if (fechaNacimiento.trim() && (!(fechaDate instanceof Date) || isNaN(fechaDate.getTime()))) {
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
        if (!foto) {
            setErrorFoto("Selecciona una foto de la mascota");
            hasError = true;
        }

        if (hasError) return;

        if (!usuarioId) {
            Alert.alert("Error", "Usuario no identificado");
            return;
        }

        try {
            const formData = new FormData();

            formData.append("nombreMascota", formatNombreMascota(nombreMascota));
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

            const response = await fetch("http://localhost:3000/mascota", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            console.log("📡 RESPUESTA:", data);

            if (response.ok) {
                Alert.alert("Éxito", `Mascota registrada\nID: ${data.mascota_id}`);
                navigation.navigate("Inicio_cliente");
            } else {
                Alert.alert("Error", data.message || "Error al guardar");
            }

        } catch (error) {
            console.error("❌ Error frontend:", error);
            Alert.alert("Error", "No se pudo conectar con el servidor");
        }
    };

    const selectedColor = "#D2B48C";
    const unselectedColor = "#fff";

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
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
                <Text style={styles.title}>Registro de Mascota</Text>

                <View style={styles.card}>

                    {/* 12. Foto (arriba) */}
                    <View style={styles.imageWrapper}>
                        {foto ? (
                            <Image
                                source={{ uri: foto.uri }}
                                style={styles.photo}
                            />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Text style={{ color: "#555" }}>Sin foto</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={seleccionarFoto}
                            style={styles.photoButton}
                        >
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>{foto ? "Cambiar foto" : "Agregar foto"}</Text>
                        </TouchableOpacity>
                        <Text style={styles.errorText}>{errorFoto}</Text>
                    </View>

                    {/* 13. Tipo mascota (arriba) */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Tipo de mascota</Text>
                        <TextInput
                            style={styles.input}
                            value={tipoMascota}
                            onChangeText={(value) => { setTipoMascota(value); setErrorTipoMascota(""); }}
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
                            onChangeText={(value) => { setNombreMascota(formatNombreMascota(value)); setErrorNombreMascota(""); }}
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
                            onChangeText={(value) => { setRaza(value); setErrorRaza(""); }}
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
                            onChangeText={(value) => { setColor(value); setErrorColor(""); }}
                            placeholder="Ej: Café"
                        />
                        <Text style={styles.errorText}>{errorColor}</Text>
                    </View>

                    {/* 4. sexo checkbox */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Sexo</Text>
                        <View style={styles.rowSpaceBetween}>
                            {['macho', 'hembra'].map((opc, index) => (
                                <TouchableOpacity
                                    key={opc}
                                    onPress={() => { setSexo(opc); setErrorSexo(""); }}
                                    style={[
                                        styles.checkButton,
                                        {
                                            marginRight: index === 0 ? 8 : 0,
                                            borderColor: sexo === opc ? selectedColor : '#ccc',
                                            backgroundColor: sexo === opc ? selectedColor : unselectedColor,
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
                            onChangeText={(value) => { setFechaNacimiento(value); setErrorFechaNacimiento(""); }}
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
                                onChangeText={(text) => { setPeso(text.replace(/[^0-9.]/g, '')); setErrorPeso(""); }}
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
                            {['no', 'si'].map((opc, index) => (
                                <TouchableOpacity
                                    key={opc}
                                    onPress={() => setEsterilizado(opc === 'si')}
                                    style={[
                                        styles.checkButton,
                                        {
                                            marginRight: index === 0 ? 8 : 0,
                                            borderColor: esterilizado === (opc === 'si') ? selectedColor : '#ccc',
                                            backgroundColor: esterilizado === (opc === 'si') ? selectedColor : unselectedColor,
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
                            {['no', 'si'].map((opc, index) => (
                                <TouchableOpacity
                                    key={opc}
                                    onPress={() => { setTieneAlergia(opc === 'si'); if (opc === 'no') setErrorAlergias(""); }}
                                    style={[
                                        styles.checkButton,
                                        {
                                            marginRight: index === 0 ? 8 : 0,
                                            borderColor: tieneAlergia === (opc === 'si') ? selectedColor : '#ccc',
                                            backgroundColor: tieneAlergia === (opc === 'si') ? selectedColor : unselectedColor,
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
                                onChangeText={(value) => { setAlergias(value); setErrorAlergias(""); }}
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
                                            borderColor: patas === n ? '#27ae60' : '#ccc',
                                            backgroundColor: patas === n ? '#d1f7e8' : '#fff',
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
        padding: 10,
        backgroundColor: "#f5f5f5",
    },
    scrollView: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 15,
    },
    card: {
        backgroundColor: "#99D9C1",
        borderRadius: 20,
        padding: 20,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
    },
    imageWrapper: {
        marginBottom: 15,
        alignItems: "center",
    },
    photoPlaceholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: "#7CEDA3",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e9ffe8",
    },
    photo: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: "#7CEDA3",
    },
    photoButton: {
        marginTop: 8,
        backgroundColor: "#7CEDA3",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    section: {
        marginBottom: 12,
    },
    label: {
        marginBottom: 5,
        fontWeight: "bold",
    },
    input: {
        width: "100%",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    inputMultiline: {
        width: "100%",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        minHeight: 80,
        textAlignVertical: "top",
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
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
    },
    smallButton: {
        width: "23%",
        minWidth: 40,
        minHeight: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        borderWidth: 1,
        marginBottom: 8,
    },
    errorText: {
        color: "red",
        marginTop: 4,
        minHeight: 18,
    },
    submitBtn: {
        backgroundColor: "#A67C52",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    submitText: {
        color: "#333",
        fontWeight: "bold",
        fontSize: 16,
    },
});
