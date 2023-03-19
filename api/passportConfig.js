const { Strategy } = require("passport-local");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

//-------------passport configuration------------------//
// a middleware that takes the user password and compare it to the encrypted password in the db using bcrypt
const compare = async (hash, pass) => {
  return bcrypt.compare(hash, pass);
};

const passportConfig = async (passport) => {
  passport.use(
    new Strategy((username, password, done) => {
      const user = prisma.users
        .findFirst({ where: { username } })
        .then(async (user) => {
          if (!user) {
            return done(null, false, {
              message: "invalid username or password",
            });
          }

          const isValid = await compare(password, user.password);

          if (isValid) {
            return done(null, user);
          } else {
            return done(null, false, {
              message: "invalid username or password",
              status: 401,
            });
          }
        })
        .catch((err) => {
          done(err);
        });
    })
  );

  // passes the user info to the session
  passport.serializeUser((user, done) => {
    console.log(user);
    done(null, user.id);
  });

  // retrieve from session by req.user
  passport.deserializeUser((userId, done) => {
    const findUser = prisma.users
      .findUnique({ where: { id: userId } })
      .then((user) => {
        done(null, user);
      })
      .catch((err) => {
        done(err);
      });
  });
};

module.exports = passportConfig;
