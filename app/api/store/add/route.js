import store from "@/models/store"; // Adjust path as necessary
import connectDB from "@/lib/db"; // Your database connection utility
import path from 'path';
import fs from 'fs/promises'; // Use fs/promises for async file operations

// We no longer need to disable bodyParser for req.formData()
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData(); // Get the FormData object directly

    const newStoreData = {};
    const storeImagesFiles = [];
    const generalImagesFiles = [];

    // Iterate over formData entries to separate fields and files
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'object' && 'name' in value && 'size' in value) {
        // This is a File object
        if (key === 'logo') {
          newStoreData.logoFile = value; // Temporarily store the File object
        } else if (key.startsWith('store_image_')) {
          storeImagesFiles.push(value); // Store store image File objects
        } else if (key === 'images') {
          generalImagesFiles.push(value); // Store general image File objects
        }
      } else {
        // This is a regular text field
        if (key === 'tags') {
          try {
            newStoreData[key] = JSON.parse(value);
          } catch (error) {
            console.error("Failed to parse tags:", error);
            newStoreData[key] = []; // Default to empty array if parsing fails
          }
        } else {
          newStoreData[key] = value;
        }
      }
    }

    // --- Process and save files ---

    // Handle logo
    if (newStoreData.logoFile && newStoreData.logoFile.size > 0) {
      const logoBuffer = Buffer.from(await newStoreData.logoFile.arrayBuffer());
      const logoFilename = `${Date.now()}-${newStoreData.logoFile.name}`;
      const logoPath = path.join(process.cwd(), 'public', 'uploads', logoFilename);
      await fs.writeFile(logoPath, logoBuffer);
      newStoreData.logo = `/uploads/${logoFilename}`; // Store path in DB
    } else {
      newStoreData.logo = null;
    }
    delete newStoreData.logoFile; // Remove the temporary file object

    // Handle store images
    newStoreData.store_images = [];
    for (const file of storeImagesFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name}`;
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        await fs.writeFile(filePath, buffer);
        newStoreData.store_images.push(`/uploads/${filename}`);
      }
    }

    // Handle general images
    newStoreData.images = [];
    for (const file of generalImagesFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name}`;
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        await fs.writeFile(filePath, buffer);
        newStoreData.images.push(`/uploads/${filename}`);
      }
    }

    if (!newStoreData.category || newStoreData.category === "") {
  newStoreData.category = null;
}

    
    // Create new store in database
    // Ensure the model is imported correctly and named 'Store' if that's what you want to use
    const storeRecord = await store.create(newStoreData);

    return new Response(JSON.stringify({ success: true, data: storeRecord }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error creating store:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'An unknown error occurred' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}