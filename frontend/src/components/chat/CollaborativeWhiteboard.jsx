import React, { useRef, useState, useEffect } from 'react';
import socket from '../../api/socket';
import {
  Pencil,
  Eraser,
  Square,
  Circle,
  Type,
  Trash2,
  Download,
  X,
  Palette,
  Undo2,
} from 'lucide-react';

const CollaborativeWhiteboard = ({ isOpen, onClose, roomId, roomName }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser' | 'rect' | 'circle'
  const [color, setColor] = useState('#2563eb');
  const [brushSize, setBrushSize] = useState(3);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Set white background by default
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Socket listeners for real-time stroke syncing from other students
    const handleRemoteDraw = ({ drawData }) => {
      const { type, x0, y0, x1, y1, strokeColor, lineWidth } = drawData;
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (type === 'line') {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      } else if (type === 'rect') {
        ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      } else if (type === 'circle') {
        const radius = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        ctx.beginPath();
        ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (type === 'clear') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
    };

    const handleRemoteClear = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('whiteboard_draw_update', handleRemoteDraw);
    socket.on('whiteboard_cleared', handleRemoteClear);

    return () => {
      socket.off('whiteboard_draw_update', handleRemoteDraw);
      socket.off('whiteboard_cleared', handleRemoteClear);
    };
  }, [isOpen, roomId]);

  if (!isOpen) return null;

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    const pos = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPos(pos);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasCoordinates(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 4;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      socket.emit('whiteboard_draw', {
        roomId,
        drawData: {
          type: 'line',
          x0: startPos.x,
          y0: startPos.y,
          x1: pos.x,
          y1: pos.y,
          strokeColor: '#ffffff',
          lineWidth: brushSize * 4,
        },
      });
      setStartPos(pos);
    } else if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      socket.emit('whiteboard_draw', {
        roomId,
        drawData: {
          type: 'line',
          x0: startPos.x,
          y0: startPos.y,
          x1: pos.x,
          y1: pos.y,
          strokeColor: color,
          lineWidth: brushSize,
        },
      });
      setStartPos(pos);
    } else if (tool === 'rect' || tool === 'circle') {
      // Restore previous state for live preview dragging
      if (snapshot) ctx.putImageData(snapshot, 0, 0);
      ctx.strokeStyle = color;

      if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else {
        const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === 'rect' || tool === 'circle') {
      const pos = getCanvasCoordinates(e);
      socket.emit('whiteboard_draw', {
        roomId,
        drawData: {
          type: tool,
          x0: startPos.x,
          y0: startPos.y,
          x1: pos.x,
          y1: pos.y,
          strokeColor: color,
          lineWidth: brushSize,
        },
      });
    }
  };

  const handleClear = () => {
    if (!window.confirm('Clear all drawings on the shared whiteboard?')) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    socket.emit('whiteboard_clear', { roomId });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${roomName}_whiteboard.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
              🎨 Live Shared Whiteboard:
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate max-w-xs">
              {roomName}
            </span>
          </div>

          {/* Tools Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-xl transition-colors ${
                tool === 'pen'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Pen Draw"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-xl transition-colors ${
                tool === 'eraser'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('rect')}
              className={`p-2 rounded-xl transition-colors ${
                tool === 'rect'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-2 rounded-xl transition-colors ${
                tool === 'circle'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>

            {/* Color Palette */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
              {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#0f172a'].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool('pen');
                  }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-125 border-slate-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Line Size */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setBrushSize(2)}
                className={`px-2 py-1 rounded-md ${brushSize === 2 ? 'font-black text-blue-600' : 'text-slate-400'}`}
              >
                Thin
              </button>
              <button
                onClick={() => setBrushSize(5)}
                className={`px-2 py-1 rounded-md ${brushSize === 5 ? 'font-black text-blue-600' : 'text-slate-400'}`}
              >
                Bold
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Save Image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Close Whiteboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full max-h-full object-contain rounded-2xl bg-white shadow-lg cursor-crosshair touch-none"
          />
        </div>
      </div>
    </div>
  );
};

export default CollaborativeWhiteboard;
