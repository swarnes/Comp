import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

// Directory where images are stored
const IMAGES_DIR = process.env.NODE_ENV === 'production' 
  ? '/app/public/images/competitions'
  : path.join(process.cwd(), 'public/images/competitions');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the filename from the path parameter
    const { path: pathParts } = req.query;
    const filename = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

    if (!filename) {
      return res.status(400).json({ message: "Filename required" });
    }

    // Sanitize filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(IMAGES_DIR, sanitizedFilename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('Image not found:', filePath);
      return res.status(404).json({ message: "Image not found" });
    }

    // Read the file
    const file = fs.readFileSync(filePath);

    // Determine content type based on extension
    const ext = path.extname(sanitizedFilename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Set caching headers (cache for 1 year since filenames are unique)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    res.status(200).send(file);

  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({ message: "Failed to serve image" });
  }
}

