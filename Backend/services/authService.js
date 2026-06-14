import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as authRepository from '../repositories/authRepository.js';

const login = async (nombre_usuario, contrasenia) => {
  // 1. Buscamos el usuario en la DB
  const usuario = await authRepository.buscarPorUsuario(nombre_usuario);

  if (!usuario) {
    throw new Error('Usuario o contraseña incorrectos');
  }

  let coincide = false;

  // 2. Probar con Bcrypt
  try {
    coincide = await bcrypt.compare(contrasenia, usuario.contrasenia);
  } catch {
    coincide = false;
  }

  // 3. Si falla, probamos con SHA-256 (usuarios actuales)
  if (!coincide) {
    const hashSHA256 = crypto.createHash('sha256').update(contrasenia).digest('hex');
    coincide = (hashSHA256 === usuario.contrasenia);
  }

  // 4. Fallback a texto plano
  if (!coincide) {
    coincide = contrasenia === usuario.contrasenia;
  }

  if (!coincide) {
    throw new Error('Usuario o contraseña incorrectos');
  }

  // 5. Payload del token
  const payload = {
    id_usuario:     usuario.id_usuario,
    nombre_usuario: usuario.nombre_usuario,
    nombre:         usuario.nombre,
    apellido:       usuario.apellido,
  };

  // 6. Firmar token
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  return { token, usuario: payload };
};

export { login };
