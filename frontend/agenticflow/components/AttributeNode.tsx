import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";

export type AttributeNodeType = Node<{
  label: string;
  color?: string;
}, "attribute">;

export default function AttributeNode({ data }: NodeProps<AttributeNodeType>) {
  const color = data.color || "#4edea3"; // default green
  return (
    <div 
      className="px-5 py-2.5 rounded-full border border-outline-variant bg-surface-lowest shadow-xl flex items-center justify-center transition-all hover:scale-105"
      style={{ boxShadow: `0 0 15px ${color}20` }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2 !h-2 !border-none"
        style={{ background: color }}
      />
      
      <span 
        className="text-xs font-mono tracking-widest font-bold uppercase" 
        style={{ color: color }}
      >
        {data.label}
      </span>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2 !h-2 !border-none"
        style={{ background: color }}
      />
    </div>
  );
}
