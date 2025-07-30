import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/user.model.js';

export const getGoogleCredentials = (req) => {
  const platform = req.query.platform || req.headers['x-platform'] || 'web'; // Default to web if no platform is specified

  switch (platform.toLowerCase()) {
    case 'ios':
      return {
        clientID: process.env.GOOGLE_IOS_CLIENT_ID,
        clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET, // iOS might still need this for some flows
        callbackURL: process.env.GOOGLE_IOS_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback'
      };
    case 'android':
      return {
        clientID: process.env.GOOGLE_ANDROID_CLIENT_ID,
        clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET, // Android might still need this for some flows
        callbackURL: process.env.GOOGLE_ANDROID_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback'
      };
    default: // web
      return {
        clientID: process.env.GOOGLE_WEB_CLIENT_ID,
        clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback'
      };
  }
};

const verifyCallback = async (req, accessToken, refreshToken, profile, done) => {
  let state = {};
  if (req.query.state) {
    try {
      state = JSON.parse(req.query.state);
    } catch (e) {
      console.error("Error parsing state parameter:", e);
    }
  }
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      return done(null, user);
    } else {
      // Create a new user if not found
      user = new User({
        googleId: profile.id,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        profilePic: profile.photos[0].value,
        role: state.role || 'customer',
        authPlatform: state.platform || 'web'
      });
      await user.save();
      return done(null, user);
    }
  } catch (err) {
    return done(err, null);
  }
};

export const createGoogleStrategy = (req) => {
    const credentials = getGoogleCredentials(req);
    return new GoogleStrategy({ ...credentials, passReqToCallback: true }, verifyCallback);
}

export const createFacebookStrategy = () => {
  return new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:3000/api/v1/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email'],
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    let state = {};
    if (req.query.state) {
      try {
        state = JSON.parse(req.query.state);
      } catch (e) {
        console.error("Error parsing state parameter:", e);
      }
    }
    try {
      let user = await User.findOne({ facebookId: profile.id });
      if (user) {
        return done(null, user);
      } else {
        user = new User({
          facebookId: profile.id,
          firstName: profile.displayName.split(' ')[0],
          lastName: profile.displayName.split(' ')[1],
          email: profile.emails[0].value,
          profilePic: profile.photos[0].value,
          role: state.role || 'customer',
          authPlatform: state.platform || 'web'
        });
        await user.save();
        return done(null, user);
      }
    } catch (err) {
      return done(err, null);
    }
  });
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
