"use client";

import React, { useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";

import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/plugins/image";
import "tinymce/plugins/charmap";
import "tinymce/plugins/preview";
import "tinymce/plugins/anchor";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/media";
import "tinymce/plugins/table";
import "tinymce/plugins/help";
import "tinymce/plugins/wordcount";
import "tinymce/plugins/directionality";

const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  { ssr: false }
);

const TinyEditor = ({
  value,
  onChange,
  name = "description",
  fullToolbar = false,
  placeholder = "",
}) => {
  const editorRef = useRef(null);

  const init = useMemo(
    () => ({
      height: fullToolbar ? 420 : 400,
      menubar: true,
      license_key: "gpl",
      plugins:
        "advlist autolink lists link image charmap preview anchor " +
        "searchreplace visualblocks code fullscreen " +
        "insertdatetime media table help wordcount directionality",
      toolbar: fullToolbar
        ? "styles | bold underline italic removeformat | fontfamily fontsize | forecolor backcolor | " +
          "bullist numlist | alignleft aligncenter alignright alignjustify | " +
          "table | link image media | fullscreen code help"
        : "undo redo | formatselect | bold italic underline strikethrough | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | removeformat | code preview | ltr rtl",
      toolbar_mode: "wrap",
      font_family_formats:
        "Roboto=Roboto,sans-serif; Calibri=calibri,sans-serif; Arial=arial,helvetica,sans-serif; " +
        "Georgia=georgia,serif; Times New Roman=times new roman,times,serif; " +
        "Verdana=verdana,geneva,sans-serif; Courier New=courier new,courier,monospace",
      font_size_formats: "8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt",
      placeholder,
      directionality: "ltr",
      branding: false,
      inline: false,
      base_url: "/tinymce",
      suffix: ".min",
      content_css: fullToolbar
        ? ["https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,400&display=swap"]
        : undefined,
      content_style:
        "@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,400&display=swap'); " +
        "body { font-family: Roboto, Calibri, Helvetica, Arial, sans-serif; font-size:14px; direction: ltr; unicode-bidi: embed; }",
    }),
    [fullToolbar, placeholder]
  );

  const handleEditorChange = useCallback(
    (content) => {
      if (typeof onChange === "function") {
        onChange({ target: { name, value: content } });
      }
    },
    [onChange, name]
  );

  return (
    <div className="my-4">
      <Editor
        apiKey="" // self-hosted
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value ?? ""}
        init={init}
        onEditorChange={handleEditorChange}
      />
    </div>
  );
};

export default TinyEditor;
