'use client';

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  Controls,
  Background,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node types
const nodeTypes: NodeTypes = {
  // We'll add custom nodes here later
};

// Initial nodes
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Input Node' },
    position: { x: 250, y: 25 },
  },
];

// Initial edges
const initialEdges: Edge[] = [];

export default function Builder() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  // Handle when nodes are dragged
  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      return nds.map((node) => {
        const change = changes.find((c: any) => c.id === node.id);
        if (change) {
          return { ...node, position: change.position };
        }
        return node;
      });
    });
  }, []);

  // Add new node on double click
  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const newNode: Node = {
        id: String(nodes.length + 1),
        type: 'default',
        position: {
          x: event.clientX,
          y: event.clientY,
        },
        data: { label: `Node ${nodes.length + 1}` },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes.length]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onPaneDoubleClick={onPaneDoubleClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}