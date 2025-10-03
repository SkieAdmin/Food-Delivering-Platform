export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Please login to continue');
  res.redirect('/login');
};

export const isGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  next();
};

export const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.userRole) {
      return res.status(403).send('Access denied');
    }
    if (roles.includes(req.session.userRole)) {
      return next();
    }
    res.status(403).send('Access denied');
  };
};
