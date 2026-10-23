import type { Metadata } from "next";
import { ColorConverterClient } from "./ColorConverterClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("color-converter")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function ColorConverterPage() {
  return (
    <ToolPageLayout tool={tool}>
      <ColorConverterClient />
    </ToolPageLayout>
  );
}
