import React, { useEffect, useState } from "react";
import { Alert, Platform, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { vs } from "../../utils/responsive";
import { apiFetch } from "../../utils/api";
import styles from "./VerReciboPaseadorStyle";

export default function VerReciboPaseador({ route, navigation }) {
  const { servicioId } = route?.params || {};
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (servicioId) cargarServicio();
  }, [servicioId]);

  const cargarServicio = async () => {
    try {
      const data = await apiFetch(`/servicio/${servicioId}`);
      setServicio(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
  };

  const tarifaBase = Number(servicio?.tarifa_base_hora ?? servicio?.tarifa ?? servicio?.tarifa_hora) || 0;
  const total = tarifaBase > 0 ? tarifaBase * 0.8 : 0;

  const generarPdfRecibo = async () => {
    if (!servicio) return;

    setSaving(true);
    try {
      const PdfLib = await import("pdf-lib");
      const { PDFDocument, StandardFonts, rgb } = PdfLib;
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const margin = 40;
      let y = 740;

      const drawLine = (text, options = {}) => {
        page.drawText(text, {
          x: margin,
          y,
          size: options.size ?? 12,
          font: options.bold ? boldFont : font,
          color: rgb(0, 0, 0),
        });
        y -= options.spacing ?? 24;
      };

      drawLine("Recibo del paseo", { size: 18, bold: true, spacing: 30 });
      drawLine(`Servicio ID: ${servicio.servicio_id || "-"}`);
      drawLine(`Mascota: ${servicio.mascota_nombre || "-"}`);
      drawLine(`Dueño: ${servicio.dueno_nombre || servicio.usuario_nombre || "-"}`);
      drawLine(`Tipo de servicio: ${servicio.tipo_servicio || "Paseo"}`);
      drawLine(`Duración: ${servicio.duracion_minutos ? `${servicio.duracion_minutos} min` : "-"}`);
      drawLine(`Fecha: ${servicio.hora_solicitada ? new Date(servicio.hora_solicitada).toLocaleString() : "-"}`);
      drawLine(`Tarifa base: $${formatCurrency(servicio.tarifa_base_hora ?? servicio.tarifa ?? servicio.tarifa_hora)}`);
      drawLine(`Total: $${total ?? "0.00"}`);
      if (servicio.notas_dueno) {
        drawLine("Notas:", { bold: true, spacing: 18 });
        drawLine(servicio.notas_dueno, { spacing: 30 });
      }
      drawLine(`Estado: ${servicio.estado || "-"}`, { spacing: 30 });

      const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: false });

      if (Platform.OS === "web") {
        const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = `recibo_${servicioId || "paseo"}.pdf`;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      } else {
        const [FileSystem, Sharing] = await Promise.all([
          import("expo-file-system"),
          import("expo-sharing"),
        ]);
        const fileName = `${FileSystem.documentDirectory}recibo_${servicioId || "paseo"}.pdf`;
        await FileSystem.writeAsStringAsync(fileName, pdfBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert("No disponible", "Compartir archivos no está disponible en este dispositivo.");
          return;
        }

        await Sharing.shareAsync(fileName, {
          mimeType: "application/pdf",
        });
      }
    } catch (error) {
      console.error("Error generando PDF:", error);
      Alert.alert("Error", "No se pudo generar el PDF. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>↩</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🧾 Recibo del paseo</Text>
        <View />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#99D9C1" style={{ marginTop: vs(40) }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {!servicio ? (
            <Text style={styles.empty}>No se pudo cargar el recibo del paseo.</Text>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.label}>Mascota</Text>
                <Text style={styles.value}>{servicio.mascota_nombre || "-"}</Text>

                <Text style={styles.label}>Dueño</Text>
                <Text style={styles.value}>{servicio.dueno_nombre || servicio.usuario_nombre || "-"}</Text>

                <Text style={styles.label}>Servicio</Text>
                <Text style={styles.value}>{servicio.tipo_servicio || "Paseo"}</Text>

                <Text style={styles.label}>Duración</Text>
                <Text style={styles.value}>{servicio.duracion_minutos ? `${servicio.duracion_minutos} min` : "-"}</Text>

                <Text style={styles.label}>Fecha</Text>
                <Text style={styles.value}>{servicio.hora_solicitada ? new Date(servicio.hora_solicitada).toLocaleString() : "-"}</Text>

                <Text style={styles.label}>Tarifa base</Text>
                <Text style={styles.value}>${formatCurrency(tarifaBase)}</Text>

                <Text style={styles.label}>Total (20% menos)</Text>
                <Text style={styles.total}>${formatCurrency(total)}</Text>

                {servicio.notas_dueno ? (
                  <>
                    <Text style={styles.label}>Notas</Text>
                    <Text style={styles.value}>{servicio.notas_dueno}</Text>
                  </>
                ) : null}

                <Text style={styles.label}>Estado</Text>
                <Text style={styles.value}>{servicio.estado || "-"}</Text>
              </View>
              <TouchableOpacity
                style={[styles.downloadBtn, saving && styles.downloadBtnDisabled]}
                onPress={generarPdfRecibo}
                disabled={saving}
              >
                <Text style={styles.downloadBtnText}>
                  {saving ? "Generando recibo..." : "🧾 Descargar recibo"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
