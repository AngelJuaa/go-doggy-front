import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	Image,
	View,
} from "react-native";
import { styles } from "./agregarDireccionClienteStyle";
import { apiFetch } from "../../utils/api";
import storage from "../../utils/storage";

const INITIAL_FORM = {
	codigoPostal: "",
	pais: "",
	estado: "",
	ciudad: "",
	colonia: "",
	calle: "",
	numeroExterior: "",
	numeroInterior: "",
	referencias: "",
	latitud: "",
	longitud: "",
};

export default function AgregarDireccionCliente({ navigation }) {
	const [form, setForm] = useState(INITIAL_FORM);
	const [hoveredTab, setHoveredTab] = useState(null);
	const [focusedField, setFocusedField] = useState("");
	const [usuarioId, setUsuarioId] = useState(null);
	const [guardando, setGuardando] = useState(false);
	const [loadingDireccion, setLoadingDireccion] = useState(false);
	const [loadingCalles, setLoadingCalles] = useState(false);
	const [coloniasDisponibles, setColoniasDisponibles] = useState([]);
	const [callesDisponibles, setCallesDisponibles] = useState([]);
	const [errorCodigoPostal, setErrorCodigoPostal] = useState("");
	const [errorColonia, setErrorColonia] = useState("");
	const [errorCalle, setErrorCalle] = useState("");

	const isFormValid = useMemo(() => {
		return (
			form.codigoPostal.trim().length === 5 &&
			form.pais.trim().length > 0 &&
			form.estado.trim().length > 0 &&
			form.ciudad.trim().length > 0 &&
			form.colonia.trim().length > 0 &&
			form.calle.trim().length > 0 &&
			form.numeroExterior.trim().length > 0 &&
			!loadingDireccion &&
			!guardando
		);
	}, [form, loadingDireccion, guardando]);

	useEffect(() => {
		const usuarioGuardado = storage.getItem("usuario");
		if (!usuarioGuardado) return;

		try {
			const usuario = JSON.parse(usuarioGuardado);
			setUsuarioId(Number(usuario?.usuario_id) || null);
		} catch (error) {
			console.log("Error leyendo usuario guardado:", error);
			setUsuarioId(null);
		}
	}, []);

	const updateField = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const getInputStyle = (field, extraStyles = []) => {
		const stylesArr = [styles.input];
		if (focusedField === field) stylesArr.push(styles.inputFocused);
		if (Array.isArray(extraStyles)) return [...stylesArr, ...extraStyles];
		if (extraStyles) stylesArr.push(extraStyles);
		return stylesArr;
	};

	const resetDireccionDependiente = () => {
		setForm((prev) => ({
			...prev,
			pais: "",
			estado: "",
			ciudad: "",
			colonia: "",
			calle: "",
			latitud: "",
			longitud: "",
		}));
		setColoniasDisponibles([]);
		setCallesDisponibles([]);
	};

	const cargarCalles = async ({ cp, country, state, city, neighborhood, lat, lng }) => {
		if (!cp || !country || !state || !city) return;

		setLoadingCalles(true);
		setCallesDisponibles([]);

		try {
			const query = new URLSearchParams({
				codigo_postal: cp,
				pais: country,
				estado: state,
				ciudad: city,
			});

			if (neighborhood) query.append("colonia", neighborhood);
			if (lat) query.append("latitud", String(lat));
			if (lng) query.append("longitud", String(lng));

			const data = await apiFetch(`/direccion/calles?${query.toString()}`);
			setCallesDisponibles(data.calles || []);
		} catch (error) {
			console.log("Error cargando calles:", error);
			setCallesDisponibles([]);
		} finally {
			setLoadingCalles(false);
		}
	};

	const cargarDireccionPorCodigoPostal = async (cp) => {
		if (cp.length !== 5) return;

		setLoadingDireccion(true);
		setErrorCodigoPostal("");
		resetDireccionDependiente();

		try {
			const data = await apiFetch(`/direccion/codigo-postal/${cp}`);

			setForm((prev) => ({
				...prev,
				pais: data.pais || "",
				estado: data.estado || "",
				ciudad: data.ciudad || "",
				latitud: data.latitud ? String(data.latitud) : "",
				longitud: data.longitud ? String(data.longitud) : "",
			}));

			const colonias = data.colonias || [];
			setColoniasDisponibles(colonias);

			if (colonias.length > 0) {
				const coloniaInicial = colonias[0];
				setForm((prev) => ({ ...prev, colonia: coloniaInicial }));
				await cargarCalles({
					cp,
					country: data.pais || "",
					state: data.estado || "",
					city: data.ciudad || "",
					neighborhood: coloniaInicial,
					lat: data.latitud,
					lng: data.longitud,
				});
			}
		} catch (error) {
			console.log("Error cargando direccion:", error);
			setErrorCodigoPostal("No se pudo autocompletar ese codigo postal");
			resetDireccionDependiente();
		} finally {
			setLoadingDireccion(false);
		}
	};

	const geocodeDireccion = async ({ calle, numeroExterior, colonia, ciudad, estado, pais, codigoPostal }) => {
		const query = new URLSearchParams();
		if (calle) query.append("calle", calle);
		if (numeroExterior) query.append("numero_calle", numeroExterior);
		if (numeroExterior) query.append("numero_externo", numeroExterior);
		if (colonia) query.append("colonia", colonia);
		if (ciudad) query.append("ciudad", ciudad);
		if (estado) query.append("estado", estado);
		if (pais) query.append("pais", pais);
		if (codigoPostal) query.append("codigo_postal", codigoPostal);

		if (!query.toString()) return null;

		try {
			const data = await apiFetch(`/direccion/geocode?${query.toString()}`);
			if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) return null;
			return {
				latitude: Number(data.latitude),
				longitude: Number(data.longitude),
			};
		} catch (error) {
			console.warn("Error geocodificando direccion:", error);
			return null;
		}
	};

	const onChangeCodigoPostal = (text) => {
		const limpio = text.replace(/\D/g, "").slice(0, 5);
		setForm((prev) => ({ ...prev, codigoPostal: limpio }));
		setErrorCodigoPostal("");

		if (limpio.length < 5) {
			resetDireccionDependiente();
		}

		if (limpio.length === 5) {
			cargarDireccionPorCodigoPostal(limpio);
		}
	};

	const seleccionarColonia = async (coloniaSeleccionada) => {
		setForm((prev) => ({ ...prev, colonia: coloniaSeleccionada, calle: "" }));
		setErrorColonia("");
		await cargarCalles({
			cp: form.codigoPostal,
			country: form.pais,
			state: form.estado,
			city: form.ciudad,
			neighborhood: coloniaSeleccionada,
			lat: form.latitud,
			lng: form.longitud,
		});
	};

	const callesFiltradas = form.calle.trim()
		? callesDisponibles
			.filter((item) => item.toLowerCase().includes(form.calle.trim().toLowerCase()))
			.slice(0, 8)
		: [];

	const handleGuardarDireccion = async () => {
		setErrorCodigoPostal("");
		setErrorColonia("");
		setErrorCalle("");

		if (form.codigoPostal.trim().length !== 5) {
			setErrorCodigoPostal("Ingresa un codigo postal valido de 5 digitos");
		}

		if (!form.pais || !form.estado || !form.ciudad) {
			setErrorCodigoPostal("Primero autocompleta la direccion con el codigo postal");
		}

		if (!form.colonia.trim()) {
			setErrorColonia("Selecciona una colonia");
		}

		if (!form.calle.trim()) {
			setErrorCalle("Ingresa la calle");
		}

		if (!isFormValid) {
			Alert.alert(
				"Formulario incompleto",
				"Completa los campos obligatorios para guardar la direccion.",
			);
			return;
		}

		if (!usuarioId) {
			Alert.alert("Error", "No se encontro el usuario de la sesion");
			return;
		}

		let lat = Number(form.latitud);
		let lng = Number(form.longitud);

		if (
			form.calle.trim() &&
			form.numeroExterior.trim() &&
			form.colonia.trim() &&
			form.ciudad.trim() &&
			form.estado.trim() &&
			form.pais.trim()
		) {
			const geocoded = await geocodeDireccion({
				calle: form.calle.trim(),
				numeroExterior: form.numeroExterior.trim(),
				colonia: form.colonia.trim(),
				ciudad: form.ciudad.trim(),
				estado: form.estado.trim(),
				pais: form.pais.trim(),
				codigoPostal: form.codigoPostal.trim(),
			});
			if (geocoded) {
				lat = geocoded.latitude;
				lng = geocoded.longitude;
				setForm((prev) => ({
					...prev,
					latitud: String(lat),
					longitud: String(lng),
				}));
			}
		}

		if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
			Alert.alert(
				"Error de geolocalización",
				"No se pudieron obtener coordenadas precisas para tu dirección. Revisa los datos e intenta de nuevo."
			);
			setGuardando(false);
			return;
		}

		setGuardando(true);

		try {
			const payload = {
				usuario_id: usuarioId,
				codigo_postal: form.codigoPostal.trim(),
				pais: form.pais.trim(),
				estado: form.estado.trim(),
				ciudad: form.ciudad.trim(),
				colonia: form.colonia.trim(),
				calle: form.calle.trim(),
				numero_calle: form.numeroExterior.trim(),
				numero_externo: form.numeroExterior.trim(),
				referencias_casa: form.referencias.trim(),
				latitud: lat,
				longitud: lng,
			};

			await apiFetch("/direccion", {
				method: "POST",
				body: JSON.stringify(payload),
			});

			if (Platform.OS === "web") {
				if (typeof window !== "undefined" && window.alert) {
					window.alert("Tu direccion se guardo correctamente.");
				}
				navigation.navigate("MapaCliente");
			} else {
				Alert.alert("Direccion guardada", "Tu direccion se guardo correctamente.", [
					{
						text: "Aceptar",
						onPress: () => navigation.navigate("MapaCliente"),
					},
				]);
			}
		} catch (error) {
			console.log("Error guardando direccion:", error);
			Alert.alert("Error", error.message || "No se pudo guardar la direccion");
		} finally {
			setGuardando(false);
		}
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<View style={styles.navbar}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.navIcon}>↩</Text>
				</TouchableOpacity>
			</View>

			<ScrollView
				contentContainerStyle={styles.contentContainer}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
				showsVerticalScrollIndicator={false}
			>
				<Text style={styles.title}>Nueva direccion</Text>
				<Text style={styles.subtitle}>Completa los datos para guardarla en tu perfil.</Text>

				<View style={styles.formCard}>
					<Text style={styles.sectionTitle}>Datos de la direccion</Text>

					<Text style={styles.label}>Codigo postal *</Text>
					<TextInput
						value={form.codigoPostal}
						onChangeText={onChangeCodigoPostal}
						onFocus={() => setFocusedField("codigoPostal")}
						onBlur={() => setFocusedField("")}
						placeholder="00000"
						placeholderTextColor="#9A9A9A"
						keyboardType="number-pad"
						maxLength={5}
						style={getInputStyle("codigoPostal")}
					/>
					{loadingDireccion && (
						<View style={styles.loadingRow}>
							<ActivityIndicator size="small" color="#4A8F6A" />
							<Text style={styles.loadingText}>Buscando direccion...</Text>
						</View>
					)}
					{errorCodigoPostal ? <Text style={styles.helperError}>{errorCodigoPostal}</Text> : null}

					<Text style={styles.label}>Pais *</Text>
					<TextInput style={[styles.input, styles.inputDisabled]} value={form.pais} editable={false} />

					<Text style={styles.label}>Estado *</Text>
					<TextInput style={[styles.input, styles.inputDisabled]} value={form.estado} editable={false} />

					<Text style={styles.label}>Ciudad *</Text>
					<TextInput style={[styles.input, styles.inputDisabled]} value={form.ciudad} editable={false} />

					<Text style={styles.label}>Colonia *</Text>
					<TextInput style={[styles.input, styles.inputDisabled]} value={form.colonia} editable={false} />
					{coloniasDisponibles.length > 0 && (
						<View style={styles.optionList}>
							{coloniasDisponibles.slice(0, 8).map((item) => (
								<TouchableOpacity
									key={item}
									style={[
										styles.optionItem,
										form.colonia === item && styles.optionItemActive,
									]}
									onPress={() => seleccionarColonia(item)}
								>
									<Text
										style={[
											styles.optionText,
											form.colonia === item && styles.optionTextActive,
										]}
									>
										{item}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					)}
					{errorColonia ? <Text style={styles.helperError}>{errorColonia}</Text> : null}

					<Text style={styles.label}>Calle *</Text>
					<TextInput
						value={form.calle}
						onChangeText={(value) => {
							updateField("calle", value);
							setErrorCalle("");
						}}
						onFocus={() => setFocusedField("calle")}
						onBlur={() => setFocusedField("")}
						placeholder="Nombre de la calle"
						placeholderTextColor="#9A9A9A"
						style={getInputStyle("calle")}
					/>
					{loadingCalles && (
						<View style={styles.loadingRow}>
							<ActivityIndicator size="small" color="#4A8F6A" />
							<Text style={styles.loadingText}>Buscando calles...</Text>
						</View>
					)}
					{callesFiltradas.length > 0 ? (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.optionListChips}
						>
							{callesFiltradas.map((item) => (
								<TouchableOpacity
									key={item}
									style={styles.optionChip}
									onPress={() => {
										updateField("calle", item);
										setErrorCalle("");
									}}
								>
									<Text style={styles.optionChipText}>{item}</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					) : null}
					{errorCalle ? <Text style={styles.helperError}>{errorCalle}</Text> : null}

					<View style={styles.row}>
						<View style={styles.rowItem}>
							<Text style={styles.label}>No. exterior *</Text>
							<TextInput
								value={form.numeroExterior}
								onChangeText={(value) => updateField("numeroExterior", value)}
								onFocus={() => setFocusedField("numeroExterior")}
								onBlur={() => setFocusedField("")}
								placeholder="123"
								placeholderTextColor="#9A9A9A"
								style={getInputStyle("numeroExterior")}
							/>
						</View>

						<View style={styles.rowItem}>
							<Text style={styles.label}>No. interior</Text>
							<TextInput
								value={form.numeroInterior}
								onChangeText={(value) => updateField("numeroInterior", value)}
								onFocus={() => setFocusedField("numeroInterior")}
								onBlur={() => setFocusedField("")}
								placeholder="A-1"
								placeholderTextColor="#9A9A9A"
								style={getInputStyle("numeroInterior")}
							/>
						</View>
					</View>

					<Text style={styles.label}>Referencias</Text>
					<TextInput
						value={form.referencias}
						onChangeText={(value) => updateField("referencias", value)}
						onFocus={() => setFocusedField("referencias")}
						onBlur={() => setFocusedField("")}
						placeholder="Color del porton, entre calles, puntos de referencia..."
						placeholderTextColor="#9A9A9A"
						multiline
						numberOfLines={4}
						textAlignVertical="top"
						style={getInputStyle("referencias", styles.textArea)}
					/>

					<TouchableOpacity
						style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
						onPress={handleGuardarDireccion}
					>
						<Text style={styles.saveButtonText}>
							{guardando ? "Guardando..." : "Guardar direccion"}
						</Text>
					</TouchableOpacity>

					<Text style={styles.helperText}>* Campos obligatorios</Text>
				</View>
			</ScrollView>

			<View style={styles.bottomTab}>
				<TouchableOpacity
					style={styles.tabItem}
					onMouseEnter={() => setHoveredTab(0)}
					onMouseLeave={() => setHoveredTab(null)}
					onPressIn={() => setHoveredTab(0)}
					onPressOut={() => setHoveredTab(null)}
					onPress={() => navigation.navigate("Inicio_cliente")}
				>
					{hoveredTab === 0 && <Text style={styles.tabLabel}>Inicio</Text>}
					<Image
						source={require("../../../assets/casa.png")}
						style={styles.tabIconImg}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.tabItem}
					onMouseEnter={() => setHoveredTab(1)}
					onMouseLeave={() => setHoveredTab(null)}
					onPressIn={() => setHoveredTab(1)}
					onPressOut={() => setHoveredTab(null)}
					onPress={() => navigation.navigate("Servicio_Cliente_Inicio")}
				>
					{hoveredTab === 1 && <Text style={styles.tabLabel}>Servicio</Text>}
					<Image
						source={require("../../../assets/puntos.png")}
						style={styles.tabIconImg}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.tabItem}
					onMouseEnter={() => setHoveredTab(2)}
					onMouseLeave={() => setHoveredTab(null)}
					onPressIn={() => setHoveredTab(2)}
					onPressOut={() => setHoveredTab(null)}
					onPress={() => navigation.navigate("MapaCliente")}
				>
					{hoveredTab === 2 && <Text style={styles.tabLabel}>Mapa</Text>}
					<Image
						source={require("../../../assets/maps.png")}
						style={styles.tabIconImg}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.tabItem}
					onMouseEnter={() => setHoveredTab(3)}
					onMouseLeave={() => setHoveredTab(null)}
					onPressIn={() => setHoveredTab(3)}
					onPressOut={() => setHoveredTab(null)}
					onPress={() => navigation.navigate("NotificacionesCliente")}
				>
					{hoveredTab === 3 && <Text style={styles.tabLabel}>Notificaciones</Text>}
					<Image
						source={require("../../../assets/Notificaciones.png")}
						style={styles.tabIconImg}
					/>
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
}
