import connectDB from "@/lib/db";
import GuestUser from "@/models/GuestUser";
import Offer from "@/models/ecom_offer_info";
// import Useraddress from "@/models/ecom_user_address_info"; // ✅ import this
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, mobile, email, password } = body;

    // ✅ Mobile is mandatory
    if (!mobile) {
      return NextResponse.json(
        { message: "Mobile number is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ Check if email exists
    if (email) {
      const existingEmail = await GuestUser.findOne({ email });
      if (existingEmail) {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // ✅ Check if mobile exists
    /* const existingMobile = await GuestUser.findOne({ mobile });
    if (existingMobile) {
      return NextResponse.json(
        { message: "Mobile number already exists" },
        { status: 400 }
      );
    } */

      // ✅ Check if mobile exists
      const existingMobile = await GuestUser.findOne({ mobile });

      if (existingMobile) {
        return NextResponse.json(
          {
            data: existingMobile,
            message: "User already exists - logged in successfully"
          },
          { status: 200 }
        );
      }

    // ✅ Hash password if provided
    let hashedPassword = "";
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const count = await GuestUser.countDocuments();
    const guestName = `guest${count + 1}`;

    const newUser = new GuestUser({
      name: name || guestName,
      mobile,
      email: email || "",
      password: hashedPassword,
    });

    await newUser.save();

    // ================================
    // ✅ UPDATE OFFERS
    // ================================
    await Offer.updateMany(
      { selected_user_type: "all" },
      {
        $addToSet: { selected_users: newUser._id },
        $set: { updated_at: new Date() }
      }
    );

    return NextResponse.json(
      {
        data: newUser,
        message: "User created successfully & offers updated"
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration API Error:", error.message);
    return NextResponse.json(
      { message: error.message || "Server Error" },
      { status: 500 }
    );
  }
}