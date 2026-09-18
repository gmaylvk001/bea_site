"use client";

import React, { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";

// Dynamically import JoditEditor with SSR disabled to prevent server-side DOM errors
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mr-3"></div>
      <span>Loading Jodit Editor...</span>
    </div>
  ),
});

export default function JoditBlogEditor({
  value = "",
  onChange,
  isModalOpen = true,
  placeholder = "Write blog description or click '<>' (Source) to edit HTML...",
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Direct image upload from computer handler
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/blogs/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.url) {
        const imageUrl = data.url;
        const imgHtml = `<p><img src="${imageUrl}" alt="${file.name || 'Blog image'}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0;" /></p>`;

        // Insert directly into Jodit editor at cursor if available
        if (editorRef.current && editorRef.current.selection) {
          editorRef.current.selection.insertHTML(imgHtml);
        } else {
          // Fallback append
          const updatedContent = (value || "") + imgHtml;
          if (typeof onChange === "function") {
            onChange(updatedContent);
          }
        }

        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        alert(data.error || "Failed to upload image.");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image. Please check your connection.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Jodit configuration: tailored to preserve custom HTML, <style>, classes, and support image upload from computer
  const joditConfig = useMemo(
    () => ({
      readonly: false,
      height: 500,
      minHeight: 400,
      placeholder: placeholder || "Write blog description or click '<>' (Source) to edit HTML...",
      theme: "default",
      toolbarAdaptive: false,
      toolbarSticky: false,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      processPasteHTML: false, // Prevents stripping or altering pasted HTML structure
      defaultActionOnPaste: "insert_only_html", // Keeps HTML structure intact on paste
      beautifyHTML: false, // Preserves exact user HTML without rewriting
      safeMode: false, // Allows custom <style>, <iframe>, <script>, and all HTML elements
      cleanHTML: {
        timeout: 0,
        removeEmptyElements: false,
        fillEmptyParagraph: false,
        replaceOldTags: false,
        allowTags: false, // Disables tag filtering - allows all tags including style
        denyTags: false,
      },
      uploader: {
        url: "/api/blogs/upload-image",
        format: "json",
        insertImageAsBase64URI: false,
        imagesExtensions: ["jpg", "png", "jpeg", "gif", "webp", "svg"],
        filesVariableName: function () {
          return "file";
        },
        isSuccess: function (resp) {
          return Boolean(resp && (resp.success || resp.url || resp.location || resp.data?.files?.length));
        },
        getMessage: function (resp) {
          return resp ? resp.error || resp.message || "" : "";
        },
        process: function (resp) {
          const fileUrl = resp?.url || resp?.location || (resp?.data?.files ? resp.data.files[0] : null);
          return {
            files: fileUrl ? [fileUrl] : [],
            path: "",
            baseurl: "",
            error: resp?.error ? 1 : 0,
            msg: resp?.error || "",
          };
        },
        defaultHandlerSuccess: function (data) {
          const files = data.files || [];
          if (files && files.length) {
            for (let i = 0; i < files.length; i++) {
              this.selection.insertImage(files[i], null, 250);
            }
          }
        },
      },
      filebrowser: {
        ajax: {
          url: "/api/blogs/upload-image",
        },
      },
      allowResizeX: false,
      allowResizeY: true,
      buttons: [
        "source", // Toggle raw HTML source mode directly inside Jodit
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "ul",
        "ol",
        "|",
        "align",
        "|",
        "table",
        "link",
        "image", // Native image button now has "Upload" tab enabled
        "video",
        "|",
        "hr",
        "eraser",
        "copyformat",
        "fullsize",
        "undo",
        "redo",
      ],
    }),
    [placeholder]
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Quick Upload Action Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Quick Computer Image Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload image from computer and insert into blog"
          >
            {isUploading ? (
              <>
                <Icon icon="line-md:loading-loop" className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Uploading image...</span>
              </>
            ) : (
              <>
                <Icon icon="lucide:upload" className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload Image from Computer</span>
              </>
            )}
          </button>

          {uploadSuccess && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <Icon icon="lucide:check-circle" className="w-3.5 h-3.5" />
              <span>Image inserted!</span>
            </span>
          )}
        </div>

        <span className="text-[11px] text-gray-400 hidden sm:inline">
          PNG, JPG, WebP, SVG supported
        </span>
      </div>

      <div className="p-2 bg-white">
        {isModalOpen && (
          <JoditEditor
            ref={editorRef}
            value={value || ""}
            config={joditConfig}
            onBlur={(newContent) => {
              if (typeof onChange === "function") {
                onChange(newContent);
              }
            }}
            onChange={(newContent) => {
              if (typeof onChange === "function") {
                onChange(newContent);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
