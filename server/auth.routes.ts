import express from "express";
import { createUser, getUserByEmail } from "./storage";
import { hashPassword, verifyPassword } from "./auth-utils";
import { generateToken } from "./auth-utils";
import  db  from "../shared/db";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";
import { reports } from "../shared/schema";
import { reportGenerator } from "./services/report";

const authRoute = express.Router();

authRoute.post("/signup", async (req, res) => {
  console.log("✅ Signup route hit"); 
  const { username, email, password, scanId } = req.body;

  
  if (!email || !password || !username)
    return res.status(400).json({ message: "Missing fields" })

  const existingUser = await getUserByEmail(email);
  if (existingUser) return res.status(400).json({ message: "Email already registered" });

  const hashedPassword = await hashPassword(password);
  const user = await createUser({ username, email, password: hashedPassword });
   const token = generateToken(user.id);

 
 
  if (scanId) {
    const scanIdNum = parseInt(scanId);

    // ✅ Insert or update the reports table 
    const existingReport = await db.query.reports.findFirst({
      where: (r, { eq }) => eq(r.scanId, scanIdNum),
    });


    const pdfBuffer = await reportGenerator.generatePDFReport(scanId);
    const base64Pdf = pdfBuffer.toString("base64");
    
    if (!existingReport) {
      await db.insert(reports).values({
        userId: user.id,
        scanId: scanIdNum,
        pdfContent: base64Pdf, 
      });
      console.log("✅ Report inserted for scan:", scanId);



    } else if (!existingReport.userId) {
      await db.update(reports)
        .set({ userId: user.id })
        .where(eq(reports.scanId, scanIdNum));
    }
    
  }
  console.log("Linking scan to user:", { scanId, userId: user.id });

  res.status(201).json({ message: "User created", userId: user.id , token });
});

authRoute.post("/login", async (req, res) => {
  const { email, password, scanId } = req.body;
  const user = await getUserByEmail(email);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await verifyPassword(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = generateToken(user.id);

  
 
  if (scanId) {
    const scanIdNum = parseInt(scanId);

    // ✅ Insert or update the reports table 
    const existingReport = await db.query.reports.findFirst({
      where: (r, { eq }) => eq(r.scanId, scanIdNum),
    });


    const pdfBuffer = await reportGenerator.generatePDFReport(scanId);
    const base64Pdf = pdfBuffer.toString("base64");

    if (!existingReport) {
      await db.insert(reports).values({
        userId: user.id,
        scanId: scanIdNum,
        pdfContent: base64Pdf, 
      });
      console.log("✅ Report inserted for scan:", scanId);



    } else if (!existingReport.userId) {
      await db.update(reports)
        .set({ userId: user.id })
        .where(eq(reports.scanId, scanIdNum));
    }
    
  }
  console.log("Linking scan to user:", { scanId, userId: user.id });


  res.json({ token });
});

export default authRoute;
