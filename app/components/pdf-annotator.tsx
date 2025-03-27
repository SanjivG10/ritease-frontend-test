"use client";

import { useEffect, useRef, useState } from "react";
import { Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { ChromePicker } from "react-color";
import { SignatureCanvas } from "./signature-canvas";

export interface Annotation {
  id: string;
  type: "highlight" | "underline" | "comment" | "signature";

  page: number;
  position: { x: number; y: number };
  content?: string;
  color?: string;
  text?: string;
  rect?: { x: number; y: number; width: number; height: number };
  signatureUrl?: string;
}

interface PDFAnnotatorProps {
  pageNumber: number;
  scale: number;
  tool: "highlight" | "underline" | "comment" | "signature" | null;
  annotations: Annotation[];
  onAnnotationAdd: (annotation: Annotation) => void;
  onAnnotationUpdate: (annotation: Annotation) => void;
  selectedAnnotationId?: string | null;
  onAnnotationSelect?: (id: string) => void;
  showColorPicker?: boolean;
  currentColor: string;
  setCurrentColor: (color: string) => void;
}

export function PDFAnnotator({
  pageNumber,
  scale,
  tool,
  annotations,
  onAnnotationAdd,
  onAnnotationUpdate,
  selectedAnnotationId,
  onAnnotationSelect,
  showColorPicker = false,
  currentColor,
  setCurrentColor,
}: PDFAnnotatorProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(
    null
  );
  const [signaturePath, setSignaturePath] = useState<
    { x: number; y: number }[]
  >([]);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [pendingSignaturePosition, setPendingSignaturePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!tool || !pageRef.current) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!tool || !pageRef.current) return;

      const rect = pageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      if (tool === "comment") {
        const comment = prompt("Enter comment:") || "Comment";
        const newAnnotation: Annotation = {
          id: Math.random().toString(36).substring(2, 9),
          type: tool,
          page: pageNumber,
          position: { x, y },
          content: comment,
          color: currentColor,
        };
        onAnnotationAdd(newAnnotation);
        onAnnotationSelect?.(newAnnotation.id);
      } else if (tool === "signature" && !showSignaturePad) {
        setPendingSignaturePosition({ x, y });
        setShowSignaturePad(true);
      } else if (tool === "underline" || tool === "highlight") {
        const newAnnotation: Annotation = {
          id: Math.random().toString(36).substring(2, 9),
          type: tool,
          page: pageNumber,
          position: { x, y },
          rect: { x, y, width: 0, height: 0 },
          color: currentColor,
        };
        setCurrentAnnotation(newAnnotation);
        setIsDrawing(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !pageRef.current || !currentAnnotation) return;

      const rect = pageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      if (tool === "signature") {
        setSignaturePath((prev) => [...prev, { x, y }]);

        if (currentAnnotation) {
          const points = [...signaturePath, { x, y }];
          const minX = Math.min(...points.map((p) => p.x));
          const maxX = Math.max(...points.map((p) => p.x));
          const minY = Math.min(...points.map((p) => p.y));
          const maxY = Math.max(...points.map((p) => p.y));

          const updatedAnnotation = {
            ...currentAnnotation,
            rect: {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            },
          };
          setCurrentAnnotation(updatedAnnotation);
          onAnnotationUpdate(updatedAnnotation);
        }
      } else if (tool === "underline" || tool === "highlight") {
        const updatedAnnotation: Annotation = {
          ...currentAnnotation,
          rect: {
            x: Math.min(currentAnnotation.position.x, x),
            y: Math.min(currentAnnotation.position.y, y),
            width: Math.abs(x - currentAnnotation.position.x),
            height:
              tool === "underline"
                ? 2
                : Math.abs(y - currentAnnotation.position.y),
          },
          color: currentColor,
        };
        setCurrentAnnotation(updatedAnnotation);
      }
    };

    const handleMouseUp = () => {
      if (isDrawing && currentAnnotation) {
        if (currentAnnotation.rect?.width && currentAnnotation.rect?.height) {
          onAnnotationAdd(currentAnnotation);
        }
      }
      setIsDrawing(false);
      setCurrentAnnotation(null);
      setSignaturePath([]);
    };

    pageRef.current.addEventListener("mousedown", handleMouseDown);
    pageRef.current.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (!pageRef.current) return;
      pageRef.current.removeEventListener("mousedown", handleMouseDown);
      pageRef.current.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    tool,
    isDrawing,
    currentAnnotation,
    pageNumber,
    scale,
    onAnnotationAdd,
    onAnnotationUpdate,
    currentColor,
    onAnnotationSelect,
    showSignaturePad,
  ]);

  const handleSignatureSave = (dataUrl: string) => {
    if (!pendingSignaturePosition) return;

    console.log("Saving signature at position:", pendingSignaturePosition); // Debug log

    const newAnnotation: Annotation = {
      id: Math.random().toString(36).substring(2, 9),
      type: "signature",
      page: pageNumber,
      position: {
        x: pendingSignaturePosition.x,
        y: pendingSignaturePosition.y,
      },
      color: currentColor,
      signatureUrl: dataUrl,
      rect: {
        x: pendingSignaturePosition.x,
        y: pendingSignaturePosition.y,
        width: 200,
        height: 100,
      },
    };

    console.log("Created annotation:", newAnnotation); // Debug log
    onAnnotationAdd(newAnnotation);
    setShowSignaturePad(false);
    setPendingSignaturePosition(null);
  };

  return (
    <div ref={pageRef} className="relative">
      <Page pageNumber={pageNumber} scale={scale} className="pdf-page" />
      <div
        className="annotation-layer"
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {annotations
          .filter((annotation) => annotation.page === pageNumber)
          .map((annotation) => (
            <div
              key={annotation.id}
              className={`annotation ${annotation.type} ${
                selectedAnnotationId === annotation.id ? "selected" : ""
              }`}
              onClick={() => onAnnotationSelect?.(annotation.id)}
              style={{
                position: "absolute",
                left: `${annotation.position.x}px`,
                top: `${annotation.position.y}px`,
                width: annotation.rect
                  ? `${annotation.rect.width}px`
                  : undefined,
                height: annotation.rect
                  ? `${annotation.rect.height}px`
                  : undefined,
                backgroundColor:
                  annotation.type !== "signature"
                    ? annotation.color
                    : undefined,
              }}
            >
              {annotation.type === "comment" && (
                <div className="comment-bubble">
                  <div className="comment-content">{annotation.content}</div>
                </div>
              )}
              {annotation.type === "signature" && annotation.signatureUrl && (
                <img
                  src={annotation.signatureUrl}
                  alt="Signature"
                  style={{
                    width: "200px", // Fixed width
                    height: "100px", // Fixed height
                    position: "absolute",
                    top: "0",
                    left: "0",
                    pointerEvents: "none", // Prevent interference with other interactions
                  }}
                />
              )}
            </div>
          ))}
      </div>
      {showColorPicker && (
        <div className="color-picker-container">
          <ChromePicker
            color={currentColor}
            onChange={(color) => setCurrentColor(color.hex)}
          />
        </div>
      )}
      {showSignaturePad && (
        <SignatureCanvas
          onSave={handleSignatureSave}
          onClose={() => {
            setShowSignaturePad(false);
            setPendingSignaturePosition(null);
          }}
          color={currentColor}
        />
      )}
    </div>
  );
}
