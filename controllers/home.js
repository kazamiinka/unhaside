/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  if (!req.user) {
      return res.render('account/login', {
        title: 'Login'
      });
  }
  if (req.user.role == 'student') {
    // show student work here/
    return res.redirect('/student');
  }
  else {
    // show class info here
    return res.render('home',{
      title: 'Home'
    });
  }
  // should have not reached here
  return res.render('home', {
    title: 'Home'
  });
};
exports.home = (req, res) => {
  return res.render('beranda',{
    title:'beranda'
  });
};