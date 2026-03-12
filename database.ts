import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('Listas');

export const initDB = () => {
  db.execSync(`
    PRAGMA foreign_keys = ON;
    
    CREATE TABLE IF NOT EXISTS programas (
      codigo TEXT PRIMARY KEY CHECK(length(codigo) <= 4),
      nombre TEXT CHECK(length(nombre) <= 30)
    );

    CREATE TABLE IF NOT EXISTS estudiantes (
      codigo TEXT PRIMARY KEY CHECK(length(codigo) <= 4),
      nombre TEXT CHECK(length(nombre) <= 30),
      email TEXT CHECK(length(email) <= 100),
      programa_cod TEXT,
      FOREIGN KEY(programa_cod) REFERENCES programas(codigo) ON DELETE CASCADE ON UPDATE CASCADE
    );

  
    
    INSERT OR IGNORE INTO programas (codigo, nombre) VALUES 
      ('001', 'Ingenieria de multimedia');
  
    INSERT OR IGNORE INTO estudiantes (codigo, nombre, email, programa_cod) VALUES 
      ('001', 'carlos', 'carlos@uniboyaca.com', '001');

  `);
};