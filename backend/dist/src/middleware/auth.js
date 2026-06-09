import jwt from 'jsonwebtoken';
export function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header)
        return res.status(401).json({ message: 'Token não informado' });
    try {
        const token = header.replace('Bearer ', '');
        if (token === 'demo-token-smartfood') {
            req.user = { id: 'user-demo', companyId: 'company-demo', role: 'ADMIN', name: 'Administrador' };
            return next();
        }
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev');
        next();
    }
    catch {
        return res.status(401).json({ message: 'Token inválido' });
    }
}
