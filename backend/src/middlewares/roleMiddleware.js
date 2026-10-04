const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.warn(`[RoleMiddleware 401] Unauthorized access attempt to ${req.method} ${req.originalUrl} - No req.user found.`);
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRole = String(req.user.role || '').toLowerCase();
    const hasRole = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

    if (!hasRole) {
      console.warn(`[RoleMiddleware 403] Forbidden access attempt by user #${req.user.id} (${req.user.username}, role: ${req.user.role}) to ${req.method} ${req.originalUrl}. Required: [${allowedRoles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
};

module.exports = roleMiddleware;

