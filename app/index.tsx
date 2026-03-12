import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { db, initDB } from "../database";

type Programa = { codigo: string; nombre: string };

export default function ProgramasScreen() {
  const router = useRouter();
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const [codigoAEliminar, setCodigoAEliminar] = useState<string | null>(null);

  useEffect(() => {
    initDB();
    cargarProgramas();
  }, []);

  const cargarProgramas = (termino = "") => {
    let result = termino
      ? db.getAllSync<Programa>(
          "SELECT * FROM programas WHERE codigo LIKE ? OR nombre LIKE ?",
          [`%${termino}%`, `%${termino}%`],
        )
      : db.getAllSync<Programa>("SELECT * FROM programas");
    setProgramas(result);
  };

  const guardarPrograma = () => {
    if (!codigo.trim() || !nombre.trim())
      return Alert.alert("Error", "Campos obligatorios");
    try {
      if (editando)
        db.runSync("UPDATE programas SET nombre = ? WHERE codigo = ?", [
          nombre.trim(),
          codigo.trim(),
        ]);
      else
        db.runSync("INSERT INTO programas (codigo, nombre) VALUES (?, ?)", [
          codigo.trim(),
          nombre.trim(),
        ]);
      cerrarModal();
      cargarProgramas();
    } catch (e) {
      Alert.alert("Error", "Código duplicado o inválido");
    }
  };

  const abrirModalEditar = (prog: Programa) => {
    setCodigo(prog.codigo);
    setNombre(prog.nombre);
    setEditando(true);
    setModalVisible(true);
  };
  const cerrarModal = () => {
    setModalVisible(false);
    setCodigo("");
    setNombre("");
    setEditando(false);
  };

  const solicitarEliminar = (cod: string) => {
    setCodigoAEliminar(cod);
    setConfirmarVisible(true);
  };

  const ejecutarEliminacion = () => {
    if (codigoAEliminar) {
        db.runSync('DELETE FROM programas WHERE codigo = ?', [codigoAEliminar]);
        cargarProgramas();
    }
    setConfirmarVisible(false);
    setCodigoAEliminar(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerCentrado}>
          <Text style={styles.titleCentrado}>Gestión de Programas</Text>
        </View>

        <TouchableOpacity
          style={styles.botonCrearPrincipal}
          onPress={() => {
            setEditando(false);
            setModalVisible(true);
          }}
        >
          <Text style={styles.textoBotonBlanco}>Crear Nuevo Programa</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar programa..."
          value={busqueda}
          onChangeText={(t) => {
            setBusqueda(t);
            cargarProgramas(t);
          }}
        />

        <FlatList
          data={programas}
          keyExtractor={(item) => item.codigo}
          renderItem={({ item }) => (
            <View style={styles.filaTabla}>
              {/* Nombre y codigo del programa */}
              <View style={styles.columnaInfo}>
                <Text style={styles.textoPrincipal}>{item.nombre}</Text>
                <Text style={styles.textoSecundario}>{item.codigo}</Text>
              </View>

              {/*Ver  Estudiantes*/}
              <View style={styles.columnaAccionVer}>
                <TouchableOpacity
                  style={styles.botonVer}
                  onPress={() =>
                    router.push({
                      pathname: "/estudiantes",
                      params: {
                        filtroPrograma: item.codigo,
                        nombrePrograma: item.nombre,
                      },
                    })
                  }
                >
                  <Text style={styles.textoBotonRojoSm}>Ver Estudiantes</Text>
                </TouchableOpacity>
              </View>

              {/* Botones */}
              <View style={styles.columnaBotones}>
                <TouchableOpacity
                  style={styles.btnIconoEditar}
                  onPress={() => abrirModalEditar(item)}
                >
                  <Text style={styles.textoBtnIcono}>✏️  Editar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnIconoBorrar}
                  onPress={() => solicitarEliminar(item.codigo)}
                >
                  <Text style={styles.textoBtnIcono}>🗑️  Borrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
          {/* Modal editar*/}
        <Modal visible={modalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editando ? "Editar Programa" : "Nuevo Programa"}
              </Text>
              <TextInput
                style={[styles.input, editando && { backgroundColor: "#eee" }]}
                placeholder="Código"
                value={codigo}
                onChangeText={setCodigo}
                editable={!editando}
              />
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={nombre}
                onChangeText={setNombre}
              />
              <TouchableOpacity
                style={styles.botonGuardar}
                onPress={guardarPrograma}
              >
                <Text style={styles.textoBotonBlanco}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonCerrar}
                onPress={cerrarModal}
              >
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
                  <Text style={styles.textoBotonBlanco}>Sí, eliminar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.btnConfirmarCancelar} 
                  onPress={() => setConfirmarVisible(false)}
                >
                  <Text style={styles.textoBotonGris}>No, cancelar</Text>
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
    backgroundColor: "#e9e7e7",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, padding: 25 },

  // Header
  headerCentrado: {
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  titleCentrado: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
  },

  // Botones Superiores
  botonCrearPrincipal: {
    backgroundColor: "#c49b14",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  textoBotonBlanco: { 
    color: "#FFF", 
    fontWeight: "bold",
    fontSize: 17,
  },
  textoBotonRojo: {
    color: "#C4142B",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  textoBotonRojoSm: { color: "#C4142B", fontWeight: "bold", fontSize: 13 },

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
    flex: 1.5
   }, 
  columnaAccionVer: { 
    flex: 2, 
    alignItems: "center" 
  },
  columnaBotones: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 5
  },
  textoPrincipal: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#333' 
  },
  textoSecundario: { 
    fontSize: 12, 
    color: '#777', 
    marginTop: 3 
  },


  // Botones
  botonVer: {
    backgroundColor: "#f0fffe",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#7dc8eb",
  },
  btnIconoEditar: { 
    backgroundColor: "#E3F2FD", 
    padding: 8, 
    borderRadius: 6 },
  btnIconoBorrar: { 
    backgroundColor: "#FFEBEE", 
    padding: 8, 
    borderRadius: 6 },
  textoBtnIcono: { fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    backgroundColor: "#1ac414",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  botonCerrar: {
    backgroundColor: "#C4142B",
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
    color: '#222',
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
    backgroundColor: '#C4142B',
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
