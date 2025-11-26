import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          role: user.role
        } as any;
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
};

// Configure multer for file uploads
// In Docker standalone mode, we need to handle paths differently
const getUploadDir = () => {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(process.cwd(), 'public/images/competitions'),
    '/app/public/images/competitions',
    path.join(process.cwd(), '.next/static/images/competitions'),
  ];
  
  // Use the first path and create it if needed
  const uploadDir = possiblePaths[0];
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  return uploadDir;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = getUploadDir();
    console.log('Upload directory:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `competition-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Disable Next.js default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  // Use promisify to handle multer with async/await
  const uploadSingle = promisify(upload.single('image'));

  try {
    await uploadSingle(req as any, res as any);
    
    const file = (req as any).file;
    
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Return the public URL path
    const imageUrl = `/images/competitions/${file.filename}`;
    
    res.status(200).json({
      success: true,
      imageUrl,
      message: "Image uploaded successfully"
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to upload image" 
    });
  }
}
