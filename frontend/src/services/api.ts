const API_BASE = "http://localhost:8005";
const WS_BASE = "ws://localhost:8005";

export type AuditEvent = {
  type: 'status' | 'thought' | 'tool_result' | 'response' | 'error';
  message?: string;
  sender?: string;
  content?: string;
  tool_name?: string;
  tool_calls?: any[];
};

export const uploadDataset = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
};

export const createAuditSocket = (onEvent: (event: AuditEvent) => void) => {
  const socket = new WebSocket(`${WS_BASE}/ws/audit`);
  
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onEvent(data);
  };
  
  socket.onerror = () => {
    onEvent({ type: 'error', message: 'WebSocket connection failed' });
  };
  
  return socket;
};

export const getOutputUrl = (filename: string) => `${API_BASE}/outputs/${filename}`;

export const listOutputs = async (): Promise<{ files: string[] }> => {
  const response = await fetch(`${API_BASE}/outputs`);
  if (!response.ok) throw new Error('Failed to list outputs');
  return response.json();
};
