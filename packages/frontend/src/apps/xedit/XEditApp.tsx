// packages/frontend/src/apps/xedit/XEditApp.tsx
import { useState, useEffect, useCallback } from "react";
import { useDebounce } from 'react-use';
import { Save, FileText, Type, Download, Upload } from "lucide-react";
import { vfsApi } from "../file-manager/api";
import { useNotification } from "../../core/notification/useNotification";
import { useUiStore } from "../../core/theme-engine/themeStore";

interface XEditProps {
  filePath?: string;
}

const XEditApp: React.FC<XEditProps> = ({ filePath }) => {
    const [content, setContent] = useState<string>("");
    const [currentFilePath, setCurrentFilePath] = useState<string>(filePath || "");
    const [status, setStatus] = useState('Ready');
    const [isNewFile, setIsNewFile] = useState(!filePath);
    const [fileName, setFileName] = useState(filePath ? filePath.split('/').pop() || 'untitled.txt' : 'untitled.txt');
    const { error } = useNotification();
    const { surfaceStyle, reduceTransparency } = useUiStore();

    useEffect(() => {
        if (filePath) {
            fetchContent(filePath);
        }
    }, [filePath]);

    const fetchContent = async (path: string) => {
        setStatus('Loading...');
        try {
            const response = await vfsApi.readFile(path);
            if (typeof (response as { content: string }).content === 'string') {
                setContent((response as { content: string }).content);
                setStatus('Ready');
                setCurrentFilePath(path);
                setIsNewFile(false);
            } else {
                throw new Error("File is not a text file.");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setStatus(`Error: ${errorMessage}`);
            error("Failed to load file", errorMessage);
            setContent('');
        }
    };

    const handleSave = useCallback(async () => {
        if (!currentFilePath && isNewFile) {
            // Need to save as new file
            const newPath = `Documents/${fileName}`;
            setCurrentFilePath(newPath);
            setIsNewFile(false);
        }
        
        const pathToSave = currentFilePath || `Documents/${fileName}`;
        setStatus('Saving...');
        
        try {
            await vfsApi.writeFile(pathToSave, content);
            setStatus('Saved');
            setCurrentFilePath(pathToSave);
            setIsNewFile(false);
            // Removed unnecessary success notification
        } catch(e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setStatus(`Error: ${errorMessage}`);
            error("Failed to save file", errorMessage);
        }
    }, [currentFilePath, content, fileName, isNewFile, error]);
    
    // Auto-save debounced
    useDebounce(() => {
        if (content && !isNewFile && currentFilePath && status === 'Editing...') {
            handleSave();
        }
    }, 2000, [content, isNewFile, currentFilePath]);

    const handleNewFile = () => {
        setContent('');
        setCurrentFilePath('');
        setIsNewFile(true);
        setFileName('untitled.txt');
        setStatus('Ready');
        // Removed unnecessary info notification
    };

    const handleExport = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        // Removed unnecessary export success notification
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.js,.ts,.json,.css,.html,.xml,.log';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result as string;
                    setContent(text);
                    setFileName(file.name);
                    setIsNewFile(true);
                    setCurrentFilePath('');
                    setStatus('Ready');
                    // Removed unnecessary import notification
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const surfaceClass = reduceTransparency ? "bg-[color:var(--surface-bg-solid)]" : 
                         surfaceStyle === "glass" ? "liquid-glass" : "solid-surface";

    return (
        <div className={`w-full h-full flex flex-col ${surfaceClass} text-[color:var(--text-primary)]`}>
            {/* Toolbar */}
            <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center justify-between bg-black/5">
                <div className="flex items-center gap-3">
                    <FileText size={20} className="text-[color:var(--primary)]" />
                    <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="bg-transparent border-none focus:outline-none font-medium text-sm text-[color:var(--text-primary)]"
                        placeholder="File name..."
                    />
                    {isNewFile && (
                        <span className="text-xs text-[color:var(--text-secondary)] bg-orange-500/20 px-2 py-1 rounded">
                            Unsaved
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleNewFile}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                        title="New File"
                    >
                        <Type size={16} />
                    </button>
                    <button
                        onClick={handleImport}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                        title="Import File"
                    >
                        <Upload size={16} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                        title="Export File"
                    >
                        <Download size={16} />
                    </button>
                    <button
                        onClick={handleSave}
                        className="p-2 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                        title="Save File"
                    >
                        <Save size={16} />
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 relative">
                <textarea
                    value={content}
                    onChange={e => {
                        setContent(e.target.value);
                        setStatus('Editing...');
                    }}
                    className="w-full h-full bg-transparent text-[color:var(--text-primary)] p-6 pl-12 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                    spellCheck="false"
                    placeholder="Start typing..."
                />
                
                {/* Line numbers (optional) */}
                <div className="absolute top-0 left-0 p-6 pr-2 pointer-events-none border-r border-white/5 w-12">
                    <div className="font-mono text-xs text-[color:var(--text-secondary)]/60 select-none text-right">
                        {content.split('\n').map((_, index) => (
                            <div key={index} className="h-[1.5rem] leading-relaxed">
                                {index + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex-shrink-0 p-3 border-t border-white/10 flex justify-between items-center text-xs text-[color:var(--text-secondary)] bg-black/5">
                <div className="flex items-center gap-4">
                    <span>{status}</span>
                    <span>Lines: {content.split('\n').length}</span>
                    <span>Characters: {content.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>Plain Text</span>
                    <span>UTF-8</span>
                </div>
            </div>
        </div>
    );
};

export default XEditApp;