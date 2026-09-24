import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import JobApplication from "@/models/JobApplication";
import fs from "fs";
import path from "path";
import { appendToJobsSheet } from "@/lib/googleSheets";

export async function POST(request) {
  try {
    await dbConnect();

    const formData = await request.formData();

    const name = formData.get("name");
    const email = formData.get("email");
    const mobile_number = formData.get("mobile_number");
    const city = formData.get("city");
    const job_post = formData.get("job_post");

    const resumeFile = formData.get("resume");

    // ❌ Validate missing fields
    if (!name || !email || !mobile_number || !city || !job_post || !resumeFile) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // ✔ Save Resume to /public/uploads/resumes
    const uploadDir = path.join(process.cwd(), "public/uploads/resumes");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    const fileName = `${Date.now()}-${resumeFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);
    
    const emailadmin = [
      "ecom@bharathelectronics.in",
      "customercare@bharatelectronics.in",
      "careers@bharathelectronics.in",
    ];

    // Loop through emails one by one
    for (const adminEmail of emailadmin) {
      try {
        const adminForm = new FormData();
        adminForm.append("campaign_id", "ce8a4ccc-8ade-4cdb-b850-fe3d4574ddc5");
        adminForm.append("email", adminEmail);
        const resume_link = `<a style="background-color:#d62828;color:#fff;padding: 12px 20px;border-radius:5px;font-weight:bold;text-decoration:none;" href="${process.env.NEXT_PUBLIC_API_URL}/uploads/resumes/${fileName}" target="_blank"> View Resume </a>`;
        adminForm.append("params", JSON.stringify([name, mobile_number, email, city, job_post, resume_link]));

        await fetch("https://bea.eygr.in/api/email/send-msg", {
          method: "POST",
          headers: {
            Authorization: "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L",
          },
          body: adminForm,
        });
      } catch (emailErr) {
        console.error("Email send error for", adminEmail, emailErr);
      }
    }

    // ✔ Save in MongoDB Database for Admin View
    const newEntry = new JobApplication({
      name,
      email,
      mobile_number,
      city,
      job_post,
      resume_path: `/uploads/resumes/${fileName}`,
      resume_name: resumeFile.name,
      status: "New",
    });

    await newEntry.save();

    // 📊 APPEND TO GOOGLE SHEET
    appendToJobsSheet({
      name,
      mobile_number,
      email,
      city,
      job_post,
      resume_url: `${process.env.NEXT_PUBLIC_API_URL}/uploads/resumes/${fileName}`,
      createdAt: new Date(),
    }).catch((err) => console.error("Google Sheets jobs append failed:", err.message));

    return NextResponse.json(
      { success: true, message: "Form submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
