import React, { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from "../../utils/api";
import { styles } from "./styles/registrarNuevaContraseniaStyle";

export default function RegistrarNuevaContrasenia({ route, navigation }) {
	const { tipo, correo, codigo } = route?.params || {};
	const esPaseador = tipo === "paseador";
	const [nuevaContrasenia, setNuevaContrasenia] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [mostrarContrasenia, setMostrarContrasenia] = useState(false);
	const [actualizado, setActualizado] = useState(false);

	const validarContrasenia = (contrasenia) => {
		const errores = [];
		if (contrasenia.length < 8) {
			errores.push("Mínimo 8 caracteres");
		}
		if (!/[A-Z]/.test(contrasenia)) {
			errores.push("Al menos una mayúscula");
		}
		if (!/[0-9]/.test(contrasenia)) {
			errores.push("Al menos un número");
		}
		if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasenia)) {
			errores.push("Al menos un carácter especial");
		}
		return errores;
	};

	const actualizarContrasenia = async () => {
		const erroresValidacion = validarContrasenia(nuevaContrasenia);
		if (erroresValidacion.length > 0) {
			setError(erroresValidacion.join(", "));
			return;
		}

		setLoading(true);
		setError("");
		try {
			const response = await fetch(`${API_URL}/recuperacion/actualizar-contrasenia`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					correo: correo.toLowerCase(),
					tipo,
					codigo,
					nuevaContrasenia,
				}),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "No se pudo actualizar la contraseña");

			setActualizado(true);
			setTimeout(() => {
				navigation.navigate("Login", { tipo });
			}, 2000);
		} catch (updateError) {
			setError(updateError.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity style={[styles.backButton, esPaseador ? styles.backButtonPaseador : styles.backButtonCliente]} onPress={() => navigation.navigate("Login", { tipo })}>
				<Text style={[styles.backText, esPaseador ? styles.backTextPaseador : styles.backTextCliente]}>← Volver</Text>
			</TouchableOpacity>
			<View style={styles.header} />
			<Image source={require("../../../assets/logo.png")} style={styles.backgroundImage} pointerEvents="none" />
			<View style={styles.card}>
				{actualizado ? (
					<>
						<Text style={styles.successIcon}>✅</Text>
						<Text style={styles.title}>¡Éxito!</Text>
						<Text style={styles.successMessage}>La contraseña se actualizó de manera exitosa</Text>
						<TouchableOpacity
							style={[styles.primaryButton, esPaseador ? styles.paseadorButton : styles.clienteButton]}
							onPress={() => navigation.navigate("Login", { tipo })}
						>
							<Text style={styles.buttonText}>Ir al Login</Text>
						</TouchableOpacity>
					</>
				) : (
					<>
						<Text style={styles.title}>Registra tu nueva contraseña</Text>
						<Text style={styles.message}>Ingresa tu nueva contraseña</Text>
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Nueva contraseña:</Text>
							<View style={styles.passwordContainer}>
								<TextInput
									style={styles.passwordInput}
									value={nuevaContrasenia}
									onChangeText={(value) => {
										setNuevaContrasenia(value);
										setError("");
									}}
									placeholder="Ingresa tu nueva contraseña"
									placeholderTextColor="#777"
									secureTextEntry={!mostrarContrasenia}
									autoCapitalize="none"
									autoFocus
								/>
								<TouchableOpacity style={styles.eyeButton} onPress={() => setMostrarContrasenia(!mostrarContrasenia)}>
									<Text style={styles.eyeIcon}>{mostrarContrasenia ? "👁️" : "👁️‍🗨️"}</Text>
								</TouchableOpacity>
							</View>
							<Text style={styles.requirements}>
								Requiere: Mayúscula, número, carácter especial y mínimo 8 caracteres
							</Text>
						</View>
						{error ? <Text style={styles.error}>{error}</Text> : null}
						<TouchableOpacity
							style={[styles.primaryButton, esPaseador ? styles.paseadorButton : styles.clienteButton, loading && styles.disabledButton]}
							onPress={actualizarContrasenia}
							disabled={loading}
						>
							<Text style={styles.buttonText}>{loading ? "Actualizando..." : "Actualizar"}</Text>
						</TouchableOpacity>
					</>
				)}
			</View>
		</View>
	);
}
