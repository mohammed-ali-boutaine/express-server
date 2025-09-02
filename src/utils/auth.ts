import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import authConfig from "../config/auth.config";

/*------------------------------
* JWT Token Generation
--------------------------------*/
export const createJWT = (userId: string | number) => {
  const accessToken = jwt.sign({ userId }, authConfig.secret, {
    expiresIn: authConfig.secret_expires_in as any,
  });
  
  // Use authConfig consistently instead of process.env directly
  const refreshToken = jwt.sign({ userId }, authConfig.refresh_secret, {
    expiresIn: authConfig.refresh_secret_expires_in as any,
  });

  return { accessToken, refreshToken };
};

/*------------------------------
* Token Verification
--------------------------------*/
export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, authConfig.secret);
  } catch (error) {
    throw new Error("Invalid access token");
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, authConfig.refresh_secret);
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

/*------------------------------
* Password Utilities
--------------------------------*/
export const comparePasswords = (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const hashPassword = (password: string) => {
  return bcrypt.hash(password, 12); 
};