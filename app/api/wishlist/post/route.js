import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import Wishlist from "@/models/ecom_wishlist_info";

export async function POST(req) {
  try {
    const token = req.headers.get('authorization');
    console.log(token);
    const authtoken = token.replace('Bearer ', '');
    if (!authtoken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = verifyToken(authtoken); // Implement your verifyToken logic
    console.log("user",userId);
    const body = await req.json();
    const { productId } = body;
    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }

    const { db } = await connectDB();

    const result = await Wishlist.insertOne({
      userId: userId,
      productId: productId,
      
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: 'Product added to wishlist',
      wishlistItem: result,
    }, { status: 200 });
  } catch (error) {
   
    return NextResponse.json({ message:error.message}, { status: 500 });
  }
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

