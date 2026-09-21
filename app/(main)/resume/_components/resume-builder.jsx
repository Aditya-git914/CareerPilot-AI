"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import  entriesToMarkdown  from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";
// import html2pdf from "html2pdf.js/dist/html2pdf.min.js";

const splitIntoBullets = (text) => {
  if (!text) return [];
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s*/, ""));

  if (lines.length > 1) return lines;
  return [text.trim()];
};

const parseSkills = (skills) => {
  if (!skills) return [];
  return skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
};

function ResumeTemplate({ values, fullName }) {
  const contact = values?.contactInfo || {};
  const skills = parseSkills(values?.skills);
  const summary = values?.summary?.trim();
  const experience = values?.experience || [];
  const education = values?.education || [];
  const projects = values?.projects || [];

  const containerStyle = {
    fontFamily: '"Times New Roman", Times, serif',
    background: "#ffffff",
    color: "#111827",
    maxWidth: "210mm",
    minHeight: "297mm",
    margin: "0 auto",
    padding: "16mm 14mm",
    lineHeight: 1.35,
    fontSize: "11pt",
  };

  const sectionTitleStyle = {
    marginTop: "14px",
    marginBottom: "8px",
    fontSize: "11pt",
    letterSpacing: "0.08em",
    fontWeight: 700,
    textTransform: "uppercase",
    borderBottom: "1px solid #111827",
    paddingBottom: "3px",
  };

  const entryHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: "12px",
  };

  const bulletStyle = {
    margin: "4px 0 0 0",
    paddingLeft: "16px",
  };

  const renderEntry = (entry, idx) => (
    <div key={`${entry.title}-${entry.organization}-${idx}`} style={{ marginBottom: "10px" }}>
      <div style={entryHeaderStyle}>
        <div style={{ fontWeight: 700 }}>{entry.title}</div>
        <div style={{ fontSize: "10pt", color: "#374151" }}>
          {entry.current ? `${entry.startDate} - Present` : `${entry.startDate} - ${entry.endDate}`}
        </div>
      </div>
      <div style={{ fontStyle: "italic", color: "#1f2937", marginTop: "1px" }}>{entry.organization}</div>
      <ul style={bulletStyle}>
        {splitIntoBullets(entry.description).map((point, pointIdx) => (
          <li key={`${idx}-${pointIdx}`} style={{ marginBottom: "2px" }}>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "22pt", margin: 0, letterSpacing: "0.02em", fontWeight: 700 }}>
          {fullName || "Your Name"}
        </h1>
        <div style={{ marginTop: "5px", fontSize: "10pt", color: "#374151" }}>
          {[contact.email, contact.mobile, contact.linkedin, contact.twitter]
            .filter(Boolean)
            .join(" | ")}
        </div>
      </div>

      {summary && (
        <section>
          <h2 style={sectionTitleStyle}>Professional Summary</h2>
          <p style={{ margin: 0 }}>{summary}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <h2 style={sectionTitleStyle}>Skills</h2>
          <p style={{ margin: 0 }}>{skills.join(" | ")}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section>
          <h2 style={sectionTitleStyle}>Experience</h2>
          {experience.map((entry, idx) => renderEntry(entry, idx))}
        </section>
      )}

      {education.length > 0 && (
        <section>
          <h2 style={sectionTitleStyle}>Education</h2>
          {education.map((entry, idx) => renderEntry(entry, idx))}
        </section>
      )}

      {projects.length > 0 && (
        <section>
          <h2 style={sectionTitleStyle}>Projects</h2>
          {projects.map((entry, idx) => renderEntry(entry, idx))}
        </section>
      )}
    </div>
  );
}

export default function ResumeBuilder({ initialContent }) {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState("preview");

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  // Watch form fields for preview updates
  const formValues = watch();

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  // Update preview content when form values change
  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent ? newContent : initialContent);
    }
  }, [formValues, activeTab]);

  // Handle save result
  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  const getContactMarkdown = () => {
    const { contactInfo } = formValues;
    const parts = [];
    if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo.linkedin)
      parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.twitter) parts.push(`🐦 [Twitter](${contactInfo.twitter})`);

    return parts.length > 0
      ? `## <div align="center">${user?.fullName || ""}</div>
        \n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
      : "";
  };

  const getCombinedContent = () => {
    const { summary, skills, experience, education, projects } = formValues;
    return [
      getContactMarkdown(),
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      entriesToMarkdown(experience, "Work Experience"),
      entriesToMarkdown(education, "Education"),
      entriesToMarkdown(projects, "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("resume-pdf");
      if (!element) {
        console.error("PDF generation error:", "resume-pdf element not found");
        toast.error("Unable to generate PDF. Please try again.");
        return;
      }
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const opt = {
        margin: [15, 15],
        filename: "resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            const style = clonedDoc.createElement("style");
            style.textContent = `
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
              }
              #resume-pdf, #resume-pdf * {
                background-color: #ffffff !important;
                color: #000000 !important;
                border-color: #e5e7eb !important;
                box-shadow: none !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
  
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF downloaded");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to download PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formattedContent = previewContent
        .replace(/\n/g, "\n") // Normalize newlines
        .replace(/\n\s*\n/g, "\n\n") // Normalize multiple newlines to double newlines
        .trim();

      console.log(previewContent, formattedContent);
      await saveResumeFn(previewContent);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  return (
    <div data-color-mode="light" className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold tracking-tight text-transparent bg-clip-text pb-2 pr-2 md:text-6xl lg:text-7xl xl:text-8xl bg-gradient-to-b from-white via-gray-400 to-gray-700">
          Resume Builder
        </h1>
        <div className="space-x-2">
          <Button
            variant="destructive"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Form</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    {...register("contactInfo.email")}
                    type="email"
                    placeholder="your@email.com"
                    error={errors.contactInfo?.email}
                  />
                  {errors.contactInfo?.email && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile Number</label>
                  <Input
                    {...register("contactInfo.mobile")}
                    type="tel"
                    placeholder="+1 234 567 8900"
                  />
                  {errors.contactInfo?.mobile && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.mobile.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn URL</label>
                  <Input
                    {...register("contactInfo.linkedin")}
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                  {errors.contactInfo?.linkedin && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.linkedin.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Twitter/X Profile
                  </label>
                  <Input
                    {...register("contactInfo.twitter")}
                    type="url"
                    placeholder="https://twitter.com/your-handle"
                  />
                  {errors.contactInfo?.twitter && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.twitter.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="Write a compelling professional summary..."
                    error={errors.summary}
                  />
                )}
              />
              {errors.summary && (
                <p className="text-sm text-red-500">{errors.summary.message}</p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="List your key skills..."
                    error={errors.skills}
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Work Experience</h3>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Experience"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.experience && (
                <p className="text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* Education */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Education</h3>
              <Controller
                name="education"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Education"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.education && (
                <p className="text-sm text-red-500">
                  {errors.education.message}
                </p>
              )}
            </div>

            {/* Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Projects</h3>
              <Controller
                name="projects"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Project"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.projects && (
                <p className="text-sm text-red-500">
                  {errors.projects.message}
                </p>
              )}
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          {activeTab === "preview" && (
            <Button
              variant="link"
              type="button"
              className="mb-2"
              onClick={() =>
                setResumeMode(resumeMode === "preview" ? "edit" : "preview")
              }
            >
              {resumeMode === "preview" ? (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Resume
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4" />
                  Show Preview
                </>
              )}
            </Button>
          )}

          {activeTab === "preview" && resumeMode !== "preview" && (
            <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">
                You will lose edited markdown if you update the form data.
              </span>
            </div>
          )}
          {resumeMode === "preview" ? (
            <div className="border rounded-lg bg-white p-4 md:p-8">
              <ResumeTemplate values={formValues} fullName={user?.fullName} />
            </div>
          ) : (
            <div className="border rounded-lg">
              <MDEditor
                value={previewContent}
                onChange={setPreviewContent}
                height={800}
                preview="edit"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
      <div style={{ position: "absolute", left: "-10000px", top: 0 }}>
        <div
          id="resume-pdf"
          style={{
            background: "#ffffff",
            color: "#000000",
            padding: 16,
            "--background": "#ffffff",
            "--foreground": "#000000",
            "--card": "#ffffff",
            "--card-foreground": "#000000",
            "--popover": "#ffffff",
            "--popover-foreground": "#000000",
            "--primary": "#000000",
            "--primary-foreground": "#ffffff",
            "--secondary": "#f5f5f5",
            "--secondary-foreground": "#000000",
            "--muted": "#f5f5f5",
            "--muted-foreground": "#666666",
            "--accent": "#f5f5f5",
            "--accent-foreground": "#000000",
            "--destructive": "#ff4d4f",
            "--border": "#e5e7eb",
            "--input": "#e5e7eb",
            "--ring": "#cccccc",
          }}
        >
          <ResumeTemplate values={formValues} fullName={user?.fullName} />
        </div>
      </div>
    </div>
  );
}
