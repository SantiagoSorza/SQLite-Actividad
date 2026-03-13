import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../database";

type Estudiante = {
  codigo: string;
  nombre: string;
  email: string;
  programa_cod: string;
};

export default function EstudiantesScreen() {
  const { filtroPrograma, nombrePrograma } = useLocalSearchParams();
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [progCod, setProgCod] = useState(filtroPrograma?.toString() || "");
  const [editando, setEditando] = useState(false);
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const [codigoAEliminar, setCodigoAEliminar] = useState<string | null>(null);

  useEffect(() => {
    cargarEstudiantes();
  }, [filtroPrograma]);

  const cargarEstudiantes = (termino = "") => {
    let query = "SELECT * FROM estudiantes";
    let params: any[] = [];

    if (filtroPrograma) {
      query += " WHERE programa_cod = ?";
      params.push(filtroPrograma.toString());
      if (termino) {
        query += " AND (nombre LIKE ? OR codigo LIKE ?)";
        params.push(`%${termino}%`, `%${termino}%`);
      }
    } else if (termino) {
      query += " WHERE nombre LIKE ? OR codigo LIKE ?";
      params.push(`%${termino}%`, `%${termino}%`);
    }

    const result = db.getAllSync<Estudiante>(query, params);
    setEstudiantes(result);
  };

  const guardar = () => {
    if (!codigo || !nombre || !email || !progCod)
      return Alert.alert("Error", "Completa todos los campos");
    try {
      if (editando) {
        db.runSync("UPDATE estudiantes SET nombre=?, email=? WHERE codigo=?", [
          nombre,
          email,
          codigo,
        ]);
      } else {
        db.runSync(
          "INSERT INTO estudiantes (codigo, nombre, email, programa_cod) VALUES (?,?,?,?)",
          [codigo, nombre, email, progCod],
        );
      }
      setModalVisible(false);
      cargarEstudiantes();
    } catch (e) {
      Alert.alert("Error", "Código duplicado o programa no existe");
    }
  };
  const solicitarEliminar = (cod: string) => {
    setCodigoAEliminar(cod);
    setConfirmarVisible(true);
  };

  const ejecutarEliminacion = () => {
    if (codigoAEliminar) {
      db.runSync("DELETE FROM estudiantes WHERE codigo = ?", [codigoAEliminar]);
      cargarEstudiantes();
    }
    setConfirmarVisible(false);
    setCodigoAEliminar(null);
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerCentrado}>
          <Text style={styles.titleCentrado}>
            {filtroPrograma
              ? `Estudiantes de ${nombrePrograma}`
              : "Gestión de Estudiantes"}
          </Text>
        </View>

        <View style={styles.filaBotonesSuperiores}>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.botonAccionClaro}>
              <Text style={styles.textoBotonRojoSm}>Regresar a Programas</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity
            style={styles.botonCrear}
            onPress={() => {
              setEditando(false);
              setCodigo("");
              setNombre("");
              setEmail("");
              setModalVisible(true);
            }}
          >
            <Text style={styles.textoBotonBlanco}> Registrar Estudiante</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar estudiante por nombre o código..."
          value={busqueda}
          onChangeText={(t) => {
            setBusqueda(t);
            cargarEstudiantes(t);
          }}
        />

        <FlatList
          data={estudiantes}
          keyExtractor={(item) => item.codigo}
          renderItem={({ item }) => (
            <View style={styles.filaTabla}>
              {/* Nombre y codigo del estudiante */}
              <View style={styles.columnaInfo}>
                <Text style={styles.textoPrincipal}>{item.nombre}</Text>
                <Text style={styles.textoSecundario}>
                  Cod: {item.codigo} | Programa: {item.programa_cod}
                </Text>
              </View>

              {/* Correo */}
              <View style={styles.columnaEmail}>
                <Text style={styles.textoEmail}>{item.email}</Text>
              </View>

              {/* Botones */}
              <View style={styles.columnaBotones}>
                <TouchableOpacity
                  style={styles.btnIconoEditar}
                  onPress={() => {
                    setCodigo(item.codigo);
                    setNombre(item.nombre);
                    setEmail(item.email);
                    setProgCod(item.programa_cod);
                    setEditando(true);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.textoBtnIcono}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnIconoBorrar}
                  onPress={() => solicitarEliminar(item.codigo)}
                >
                  <Text style={styles.textoBtnIcono}>🗑️ Borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* Modal editar*/}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editando ? "Actualizar Estudiante" : "Nuevo Estudiante"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  editando && { backgroundColor: "#f0f0f0" },
                ]}
                placeholder="Código Estudiante"
                value={codigo}
                onChangeText={setCodigo}
                editable={!editando}
              />
              <TextInput
                style={styles.input}
                placeholder="Nombre Completo"
                value={nombre}
                onChangeText={setNombre}
              />
              <TextInput
                style={styles.input}
                placeholder="Correo Electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <TextInput
                style={[
                  styles.input,
                  !!filtroPrograma && { backgroundColor: "#f0f0f0" },
                ]}
                placeholder="Código Programa"
                value={progCod}
                onChangeText={setProgCod}
                editable={!filtroPrograma}
              />

              <TouchableOpacity style={styles.botonGuardar} onPress={guardar}>
                <Text style={styles.textoBotonBlanco}>Guardar Datos</Text>
              </TouchableOpacity>
              <TouchableOpacity  style={styles.botonCerrar} onPress={() => setModalVisible(false)}>
                <Text style={styles.textoBotonBlanco}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Modal borrar */}
        <Modal visible={confirmarVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalConfirmBox}>
              <Text style={styles.confirmTitle}>¿Confirmar eliminación?</Text>
              <Text style={styles.confirmSubtitle}>
                Se borrarán todos los datos del programa.
              </Text>
              <View style={styles.filaBotonesConfirmar}>
                <TouchableOpacity
                  style={styles.btnConfirmarEliminar}
                  onPress={ejecutarEliminacion}
                >
                  <Text style={styles.textoBotonBlanco1}>Sí, eliminar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnConfirmarCancelar}
                  onPress={() => setConfirmarVisible(false)}
                >
                  <Text style={styles.textoBotonBlanco}>No, cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, padding: 16 },

  // Header
  headerCentrado: {
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff",
    paddingBottom: 10,
  },
  titleCentrado: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    //fontFamily: "Century Gothic",
  },

  // Botones Superiores
  filaBotonesSuperiores: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
  },
  botonAccionClaro: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "#C4142B",
  },
  botonCrear: {
    backgroundColor: "#fdfdfd",
    borderColor: "#454242",
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    elevation: 2,
  },
  textoBotonBlanco1: { 
    color: "#ffffff", 
    fontWeight: "bold" 
  },
  textoBotonBlanco: { 
    color: "#000000", 
    fontWeight: "bold" 
  },
  textoBotonRojoSm: { 
    color: "#ffffff", 
    fontWeight: "bold", 
    fontSize: 13 
  },
  // Buscador
  searchInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },

  // Tabla
  filaTabla: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    justifyContent: "space-between",
  },
  columnaInfo: { 
    flex: 2
  },
  columnaEmail: { 
    flex: 2, 
    paddingHorizontal: 10 
  },
  columnaBotones: {
    flex: 1.5,
    justifyContent: "flex-end",
    gap: 10,
  },

  textoPrincipal: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#333" 
  },
  textoSecundario: { 
    fontSize: 12, 
    color: "#777", 
    marginTop: 3 
  },
  textoEmail: { 
    fontSize: 12, 
    color: "#555" 
  },

  // Botones 
  btnIconoEditar: { 
    backgroundColor: "#d1c7c9", 
    padding: 10, 
    borderRadius: 6 
  },
  btnIconoBorrar: { 
    backgroundColor: "#FFEBEE", 
    padding: 10, 
    borderRadius: 6
  },
  textoBtnIcono: { fontSize: 16 },

  // Modal
 modalOverlay: {
    flex: 1,
    backgroundColor: "#00000080",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#272727",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  botonGuardar: {
    backgroundColor: "#93c491",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  botonCerrar: {
    backgroundColor: "#996d73",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  // --- modal borrar ---
  modalConfirmBox: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  filaBotonesConfirmar: {
    width: '100%',
    gap: 10,
  },
  btnConfirmarEliminar: {
    backgroundColor: '#996d73',
    color: '#000000',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  btnConfirmarCancelar: {
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  textoBotonGris: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
