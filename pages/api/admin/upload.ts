import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { authOptions } from "../auth/[...nextauth]";
import type { Session } from "next-auth";

// Configure multer for file uploads
// Use a consistent path that works with Docker volume mounts
const UPLOAD_DIR = '/app/public/images/competitions';

const getUploadDir = () => {
  // Always use the Docker path - this should be mounted as a volume in Coolify
  const uploadDir = process.env.NODE_ENV === 'production' 
    ? UPLOAD_DIR 
    : path.join(process.cwd(), 'public/images/competitions');
  
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Upload directory:', uploadDir);
  console.log('CWD:', process.cwd());
  
  if (!fs.existsSync(uploadDir)) {
    console.log('Creating upload directory...');
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // List existing files to debug
  try {
    const files = fs.readdirSync(uploadDir);
    console.log('Existing files in upload dir:', files.length);
  } catch (e) {
    console.log('Could not list directory:', e);
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
  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || !session.user || session.user.role !== "admin") {
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

    // Return the API URL path for serving uploaded images
    // In production, use the API route since static files uploaded after build won't be served
    const imageUrl = process.env.NODE_ENV === 'production'
      ? `/api/images/competitions/${file.filename}`
      : `/images/competitions/${file.filename}`;
    
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
