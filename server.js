import path from "path";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import vhost from "vhost";
import fs from "fs";
import https from "https";
import recortarImagensRoutes from "./src/projects/recortar-imagens/routes.js";
import preencherAtividadesRoutes from "./src/projects/preencher-atividades/routes.js";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";
import { fileURLToPath } from "url";


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// SSL
const sslOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};


// Helmet Config
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://image.tmdb.org"],
      connectSrc: [
        "'self'", 
        "blob:", 
        "https://api.themoviedb.org",
        "https://fonts.gstatic.com",
        "http://localhost:3003",
        "https://sistema-escolar.brunoazvd.com",
        `http://${process.env.VPS_ADDRESS}:3003`,
        `https://${process.env.VPS_ADDRESS}:3003`
     ],
      scriptSrc: [
        "'self'",
        "https://cdn.tailwindcss.com",
        "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/460/fabric.min.js",
        "https://api.themoviedb.org"
      ],
      styleSrc: [
        "'self'", 
        "https://cdnjs.cloudflare.com", 
        "https://fonts.googleapis.com",
        "'unsafe-inline'",
      ],
    },
  })
);

// Rate Limit Config
app.use(
  rateLimit({
    windowMs: 1000 * 60 * 15,
    max: 800,
  })
);

// Ip Logging
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const route = req.originalUrl;
  console.log(`Request received from IP: ${ip}, Route: ${route}`);
  next();
});

// Project Routes and Subdomains
app.use(vhost("portfolio.brunoazvd.com", express.static(path.join(__dirname, "./src/projects/portfolio"))));
app.use(vhost("recortar-imagens.brunoazvd.com", recortarImagensRoutes));
app.use(vhost("preencher-atividades.brunoazvd.com", preencherAtividadesRoutes));
app.use(vhost("tmdb-search.brunoazvd.com", express.static(path.join(__dirname, "./src/projects/movie-search"))));

// Projects being served through proxies
app.use(vhost("rplace.brunoazvd.com", createProxyMiddleware({target: "http://localhost:3000", changeOrigin: true})));
app.use(vhost("sistema-escolar.brunoazvd.com", createProxyMiddleware({target: "http://localhost:3003", changeOrigin: true})));

// Fallback Route (Redirects to Portfolio)
app.use((req, res) => {
  res.redirect("https://portfolio.brunoazvd.com/");
})


// Init HTTPS server + HTTP Redirect
https.createServer(sslOptions, app).listen(443, () => {
  console.log('HTTPS ativo na porta 443');
});

