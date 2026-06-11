import 'dotenv/config';
import express              from 'express';
import cors                 from 'cors';
// Comentados hasta que crees los archivos correspondientes:
// import authRoutes           from './routes/authRoutes.js';
import estudiantesRoutes    from './routes/estudiantesRoutes.js';
// import cursosRoutes         from './routes/cursosRoutes.js';
// import inscripcionesRoutes  from './routes/inscripcionesRoutes.js';
// import dashboardRoutes      from './routes/dashboardRoutes.js';

const app    = express();
const puerto = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas del Sistema
app.use('/estudiantes',    estudiantesRoutes);

// Comentados temporalmente:
// app.use('/auth',           authRoutes);
// app.use('/dashboard',      dashboardRoutes);
// app.use('/cursos',         cursosRoutes);
// app.use('/inscripciones',  inscripcionesRoutes);

app.listen(puerto, () => {
  console.log(`Servidor corriendo en http://localhost:${puerto}`);
});