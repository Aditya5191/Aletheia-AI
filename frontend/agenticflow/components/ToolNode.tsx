import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { TerminalSquare } from "lucide-react";

export type ToolNodeType = Node<{
  functionName: string;
  inputs: { key: string; value: string; type: "number" | "string" | "array" }[];
  output: string;
}, "tool">;

export default function ToolNode({ data }: NodeProps<ToolNodeType>) {
  // Extract reason if it exists, otherwise fallback to function name
  const reasonInput = data.inputs.find((i) => i.key === "reason" || i.key === "arguments.reason");
  const headerTitle = reasonInput ? reasonInput.value : data.functionName;
  
  // Filter reason out of the visual inputs list
  const displayInputs = data.inputs.filter((i) => i.key !== "reason" && i.key !== "arguments.reason");

  return (
    <div className="w-[380px] bg-background border border-outline-variant rounded-xl shadow-2xl flex flex-col font-mono text-[12px] overflow-hidden group">
      {/* Top Handle (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-surface-container border-2 border-[var(--color-surface)] -top-1.5 transition-colors group-hover:bg-[#494454]"
      />

      {/* Mac-like Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
          <TerminalSquare className="w-4 h-4 text-[#E3B341] flex-shrink-0" />
          <span className="text-[#E3B341] font-semibold truncate" title={headerTitle}>
            {headerTitle}
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-outline)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-outline)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-outline)]" />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-4">
        {/* Inputs */}
        <div>
          <div className="text-[#565F89] mb-2 font-semibold">
            {">>> Input Parameters:"}
          </div>
          <div className="pl-4 flex flex-col gap-1">
            {displayInputs.map((inp, i) => (
              <div key={i} className="flex">
                <span className="text-[#F7768E]">{inp.key}</span>
                <span className="text-[#A9B1D6] mx-1">:</span>
                <span
                  className={
                    inp.type === "number"
                      ? "text-[#9ECE6A]"
                      : inp.type === "string"
                      ? "text-[#7AA2F7]"
                      : "text-[#7DCFFF]"
                  }
                >
                  {inp.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-outline-variant/30 w-full my-2" />

        {/* Output */}
        <div>
          <div className="text-[#565F89] mb-2 font-semibold">
            {"<- Simulated Output:"}
          </div>
          <div className="pl-4">
            <pre className="text-[12px] leading-relaxed overflow-x-auto hide-scrollbar">
              <code
                className="text-[#A9B1D6]"
                dangerouslySetInnerHTML={{
                  __html: data.output
                    .replace(/"([^"]+)":/g, '<span class="text-[#F7768E]">"$1"</span>:')
                    .replace(/: (\d+\.?\d*)/g, ': <span class="text-[#9ECE6A]">$1</span>')
                    .replace(/: "([^"]+)"/g, ': <span class="text-[#7AA2F7]">"$1"</span>')
                    .replace(/\[\]/g, '<span class="text-[#A9B1D6]">[]</span>')
                    .replace(/\{|\}/g, '<span class="text-[#7DCFFF]">$&</span>'),
                }}
              />
            </pre>
          </div>
        </div>
      </div>

      {/* Bottom Handle (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-surface-container border-2 border-[var(--color-surface)] -bottom-1.5 transition-colors group-hover:bg-[#494454]"
      />
    </div>
  );
}
