const { verifyToken, createClerkClient } = require('@clerk/express');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const AUTHORIZED_EMAILS = (process.env.AUTHORIZED_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

// Middleware: requires authenticated Clerk user
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ Error: 'No autenticado' });
        }

        const token = authHeader.split(' ')[1];
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });

        const userId = payload.sub;
        const user = await clerk.users.getUser(userId);
        const email = user.emailAddresses[0]?.emailAddress?.toLowerCase();

        req.userId = userId;
        req.userEmail = email;
        req.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email;

        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        return res.status(401).json({ Error: 'Token inválido' });
    }
};

// Middleware: requires auth + email in authorized list
const requireAuthorized = async (req, res, next) => {
    await requireAuth(req, res, () => {
        if (!AUTHORIZED_EMAILS.includes(req.userEmail)) {
            return res.status(403).json({ Error: 'No tienes permiso para realizar esta acción' });
        }
        next();
    });
};

// Middleware: requires auth + admin email (only for delete)
const requireAdmin = async (req, res, next) => {
    await requireAuth(req, res, () => {
        if (!ADMIN_EMAILS.includes(req.userEmail)) {
            return res.status(403).json({ Error: 'Solo los administradores pueden eliminar planes' });
        }
        next();
    });
};

module.exports = { requireAuth, requireAuthorized, requireAdmin };
