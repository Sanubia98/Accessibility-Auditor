import bcrypt from  'bcrypt';
import jwt from "jsonwebtoken";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10); // 10 salt rounds
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

const JWT_SECRET = process.env.SECRET_KEY!; // add this to .env

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" });
}