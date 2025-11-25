// pages/api/search/suggestions.js
import dbConnect from "@/lib/db";
import Product from "@/models/product";

export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(200).json([]);

  await dbConnect();

  try {
    const results = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { search_keywords: { $regex: q, $options: "i" } }
      ],
    })
      .limit(5) // only first 5
      .select("product_name price product_slug product_image");

    res.status(200).json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
}
