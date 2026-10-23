import type { Metadata } from "next";
import { NumberBaseConverterClient } from "./NumberBaseConverterClient";
import { ToolPageLayout } from "@/components/shared/ToolPageLayout";
import { generateToolMetadata } from "@/lib/toolMetadata";
import { getTool } from "@/lib/tools";

const tool = getTool("number-base-converter")!;

export const metadata: Metadata = generateToolMetadata(tool);

export default function NumberBaseConverterPage() {
  return (
    <ToolPageLayout tool={tool}>
      <NumberBaseConverterClient />
    </ToolPageLayout>
  );
}
