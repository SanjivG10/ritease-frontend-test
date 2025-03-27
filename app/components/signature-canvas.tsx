import { useRef } from "react";
import SignaturePad from "react-signature-canvas";
import { Button } from "./ui/button";

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  color: string;
}

export function SignatureCanvas({
  onSave,
  onClose,
  color,
}: SignatureCanvasProps) {
  const sigPadRef = useRef<SignaturePad>(null);

  const handleSave = () => {
    if (sigPadRef.current?.isEmpty()) {
      return;
    }
    try {
      const signatureData = sigPadRef.current?.toDataURL("image/png");
      if (signatureData) {
        onSave(signatureData);
        onClose();
      }
    } catch (error) {
      console.error("Error saving signature:", error);
    }
  };

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-4 rounded-lg shadow-lg">
        <div className="border border-border rounded-lg mb-4 bg-white">
          <SignaturePad
            ref={sigPadRef}
            canvasProps={{
              className: "signature-canvas",
              width: 500,
              height: 200,
            }}
            dotSize={2}
            minWidth={1}
            maxWidth={3}
            throttle={16}
            penColor={color}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
