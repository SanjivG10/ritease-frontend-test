"use client";

import { Button } from "@/app/components/ui/button";
import { Toaster } from "@/app/components/ui/toaster";
import {
  Download,
  Highlighter,
  MessageSquare,
  PenTool,
  Underline,
  Upload,
} from "lucide-react";

import { Document, pdfjs } from "react-pdf";
import { PDFDocument, rgb } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

import { useState, useCallback, useRef, useEffect } from "react";
import { Annotation, PDFAnnotator } from "./components/pdf-annotator";
import { ChromePicker } from "react-color";
import { hexToRgb } from "./lib/utils";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [tool, setTool] = useState<
    "highlight" | "underline" | "comment" | "signature" | null
  >(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#2196f3");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    }

    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setFile(file);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageChange = (delta: number) => {
    setPageNumber((prev) => {
      const newPage = prev + delta;
      if (newPage < 1 || newPage > (numPages || 1)) return prev;
      return newPage;
    });
  };

  const handleScaleChange = (delta: number) => {
    setScale((prev) => {
      const newScale = prev + delta;
      if (newScale < 0.5 || newScale > 2) return prev;
      return newScale;
    });
  };

  const handleAnnotationAdd = (annotation: Annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
  };

  const handleAnnotationUpdate = (updatedAnnotation: Annotation) => {
    setAnnotations((prev) =>
      prev.map((annotation) =>
        annotation.id === updatedAnnotation.id ? updatedAnnotation : annotation
      )
    );
  };

  const handleExport = async () => {
    if (!file) return;

    try {
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      // Process annotations for each page
      for (const annotation of annotations) {
        const page = pages[annotation.page - 1];
        const { height } = page.getSize();

        switch (annotation.type) {
          case "highlight":
          case "underline": {
            if (annotation.rect) {
              const { x, y, width, height: rectHeight } = annotation.rect;
              const color = hexToRgb(annotation.color || "#2196f3");
              page.drawRectangle({
                x,
                y: height - y - (rectHeight || 0),
                width,
                height: rectHeight || 0,
                opacity: annotation.type === "highlight" ? 0.3 : 0.7,
                color: rgb(color.r, color.g, color.b),
              });
            }
            break;
          }
          case "comment": {
            const color = hexToRgb(annotation.color || "#2196f3");
            if (annotation.position && annotation.content) {
              page.drawText(annotation.content, {
                x: annotation.position.x,
                y: height - annotation.position.y,
                size: 10,
                color: rgb(color.r / 255, color.g / 255, color.b / 255),
              });
            }
            break;
          }
          case "signature": {
            if (annotation.signatureUrl && annotation.rect) {
              try {
                // Remove the data:image/png;base64, prefix
                const signatureData = annotation.signatureUrl.split(",")[1];
                const signatureBytes = Uint8Array.from(
                  atob(signatureData),
                  (c) => c.charCodeAt(0)
                );

                // Embed the image
                const signatureImage = await pdfDoc.embedPng(signatureBytes);
                const { x, y, width, height: rectHeight } = annotation.rect;
                const { height: pageHeight } = page.getSize();

                page.drawImage(signatureImage, {
                  x,
                  y: pageHeight - y - rectHeight,
                  width,
                  height: rectHeight,
                });
              } catch (error) {
                console.error("Error embedding signature:", error);
              }
            }
            break;
          }
        }
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = "annotated-document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className="flex flex-col h-screen"
      onDrop={handleFileDrop}
      onDragOver={handleDragOver}
    >
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold">PDF Annotation App</h1>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <Button asChild>
                <label>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </label>
              </Button>
            </label>
            <Button onClick={handleExport} disabled={!file}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4">
        {file ? (
          <div className="flex gap-4 h-full">
            {/* Toolbar */}
            <div className="w-16 bg-secondary rounded-lg p-2 flex flex-col gap-2">
              <Button
                variant={tool === "highlight" ? "default" : "ghost"}
                size="icon"
                className={`${tool === "highlight" ? "bg-blue-500" : ""}`}
                onClick={() =>
                  setTool(tool === "highlight" ? null : "highlight")
                }
              >
                <Highlighter
                  className={`w-5 h-5 ${
                    tool === "highlight" ? "text-white" : "text-blue-500"
                  }`}
                />
              </Button>
              <Button
                variant={tool === "underline" ? "default" : "ghost"}
                size="icon"
                className={`${
                  tool === "underline" ? "bg-blue-500" : ""
                } cursor-pointer`}
                onClick={() =>
                  setTool(tool === "underline" ? null : "underline")
                }
              >
                <Underline
                  className={`w-5 h-5 ${
                    tool === "underline" ? "text-white" : "text-blue-500"
                  }`}
                />
              </Button>
              <Button
                variant={tool === "comment" ? "default" : "ghost"}
                size="icon"
                className={`${
                  tool === "comment" ? "bg-blue-500" : ""
                } cursor-pointer`}
                onClick={() => setTool(tool === "comment" ? null : "comment")}
              >
                <MessageSquare
                  className={`w-5 h-5 ${
                    tool === "comment" ? "text-white" : "text-blue-500"
                  }`}
                />
              </Button>
              <Button
                variant={tool === "signature" ? "default" : "ghost"}
                size="icon"
                className={`${
                  tool === "signature" ? "bg-blue-500" : ""
                } cursor-pointer`}
                onClick={() =>
                  setTool(tool === "signature" ? null : "signature")
                }
              >
                <PenTool
                  className={`w-5 h-5 ${
                    tool === "signature" ? "text-white" : "text-blue-500"
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`relative cursor-pointer ${
                  showColorPicker ? "bg-primary/20" : ""
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-foreground/20"
                  style={{ backgroundColor: currentColor }}
                />
              </Button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 bg-background rounded-lg overflow-hidden">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                className="pdf-viewer"
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }
              >
                <PDFAnnotator
                  pageNumber={pageNumber}
                  scale={scale}
                  tool={tool}
                  annotations={annotations}
                  onAnnotationAdd={handleAnnotationAdd}
                  onAnnotationUpdate={handleAnnotationUpdate}
                  selectedAnnotationId={selectedAnnotationId}
                  onAnnotationSelect={setSelectedAnnotationId}
                  showColorPicker={showColorPicker}
                  currentColor={currentColor}
                  setCurrentColor={setCurrentColor}
                />
              </Document>

              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePageChange(-1)}
                  disabled={pageNumber <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pageNumber} of {numPages}
                </span>
                <Button
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={pageNumber >= (numPages || 1)}
                >
                  Next
                </Button>
                <div className="h-4 w-px bg-border mx-2" />
                <Button size="sm" onClick={() => handleScaleChange(-0.1)}>
                  Zoom Out
                </Button>
                <span className="text-sm">{Math.round(scale * 100)}%</span>
                <Button size="sm" onClick={() => handleScaleChange(0.1)}>
                  Zoom In
                </Button>
              </div>
            </div>

            {/* Annotations Sidebar */}
            <div className="w-72 bg-secondary/10 rounded-lg p-4">
              <h3 className="font-semibold mb-4 text-lg">Annotations</h3>
              <div className="space-y-2">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all
                      ${
                        selectedAnnotationId === annotation.id
                          ? "bg-primary text-primary-foreground shadow-md scale-102"
                          : "bg-background/50 hover:bg-background/80"
                      }
                    `}
                    onClick={() => {
                      setSelectedAnnotationId(annotation.id);
                      setPageNumber(annotation.page);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: annotation.color }}
                      />
                      <span className="font-medium">
                        {annotation.type.charAt(0).toUpperCase() +
                          annotation.type.slice(1)}
                      </span>
                    </div>
                    {annotation.content && (
                      <p className="mt-1 text-sm opacity-90 line-clamp-2">
                        {annotation.content}
                      </p>
                    )}
                    <div className="mt-1 text-xs opacity-70">
                      Page {annotation.page}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-muted-foreground/25 rounded-lg"
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <Upload className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Upload a PDF</h2>
            <p className="text-muted-foreground mb-4">
              Drag and drop a PDF file here or click to browse
            </p>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Choose PDF
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={onFileChange}
                className="hidden"
              />
            </Button>
          </div>
        )}
      </main>

      {showColorPicker && (
        <div ref={colorPickerRef} className="absolute bottom-20 left-16 z-50">
          <ChromePicker
            color={currentColor}
            onChange={(color) => setCurrentColor(color.hex)}
          />
        </div>
      )}

      <Toaster />
    </div>
  );
}
