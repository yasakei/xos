// packages/backend/src/types.ts

export interface VFSNode {
  name: string;
  kind: 'file' | 'directory';
  children?: VFSNode[];
}