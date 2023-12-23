DROP DATABASE IF EXISTS PAE;
CREATE DATABASE PAE CHARACTER set utf8mb4;
USE PAE;
CREATE TABLE superusuario (
 nombre_super VARCHAR(20) NOT NULL,
 documento_super VARCHAR(30) NOT NULL,
 cargo VARCHAR(20) NOT NULL,
 PRIMARY KEY (documento_super)
);
CREATE TABLE estudiante (
 nombre_estudiante VARCHAR(70) NOT NULL,
 documento_estudiante VARCHAR(30) NOT NULL,
 grupo VARCHAR(5) NOT NULL,
 estado VARCHAR(15) NOT NULL,
 PRIMARY KEY (documento_estudiante)
);
CREATE TABLE entregas (
 id_entrega INTEGER NOT NULL AUTO_INCREMENT,
 documento_estudiante VARCHAR(30) NOT NULL,
 fecha DATE,
 PRIMARY KEY (id_entrega),
 FOREIGN KEY (documento_estudiante) REFERENCES estudiante (documento_estudiante)
);