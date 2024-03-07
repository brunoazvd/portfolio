import express from "express";
import helmet from 'helmet';
import rateLimit from "express-rate-limit";
import vhost from "vhost";

import recortarImagensRoutes from './src/projects/recortar-imagens/routes.js'
import preencherAtividadesRoutes from './src/projects/preencher-atividades/routes.js'

const app = express();

// Helmet Config
app.use(helmet({
    contentSecurityPolicy: false,
}));

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
            scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/460/fabric.min.js"],
        },
    })
);

// Rate Limit Config
app.use(rateLimit({
    windowMs: 1000 * 60 * 15,
    max: 500
}));

// Ip Logging
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const route = req.originalUrl;
    console.log(`Request received from IP: ${ip}, Route: ${route}`);
    next();
});

// Routes
app.use(vhost("recortar-imagens.localhost", recortarImagensRoutes));
app.use(vhost("preencher-atividades.localhost", preencherAtividadesRoutes));

// Init Server
app.listen(3000, '0.0.0.0', () => {
    console.log(`Servidor Rodando`);
});