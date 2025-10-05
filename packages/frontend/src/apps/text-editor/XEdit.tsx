// packages/frontend/src/apps/text-editor/XEdit.tsx
import { useState, useEffect, useCallback } from "react";
import { useDebounce } from 'react-use';
import { vfsApi } from "../file-manager/api";

interface XEditProps {
  filePath: string;
}

const XEdit: React.FC<XEditProps> = ({ filePath }) => {
    const [content, setContent] = useState<string | null>(null);
    const [status, setStatus] = useState('Loading...');

    useEffect(() => {
        const fetchContent = async () => {
            setStatus('Loading...');
            try {
                const response = await vfsApi.readFile(filePath);
                if (typeof (response as { content: string }).content === 'string') {
                    setContent((response as { content: string }).content);
                    setStatus('Ready');
                } else {
                    throw new Error("File is not a text file.");
                }
            } catch (error: unknown) {
                setStatus(`Error: ${error instanceof Error ? error.message : "An unknown error occurred."}`);
                setContent('');
            }
        };
        fetchContent();
    }, [filePath]);

    const handleSave = useCallback(async (currentContent: string) => {
        if (currentContent === null) return;
        setStatus('Saving...');
        try {
            await vfsApi.writeFile(filePath, currentContent);
            setStatus('Saved');
        } catch(e: unknown) {
            setStatus(`Error: ${e instanceof Error ? e.message : "An unknown error occurred."}`);
        }
    }, [filePath]);
    
    // Debounce saves, but only if content is not null (i.e., has loaded)
    useDebounce(() => {
        if (content !== null && status === 'Editing...') {
            handleSave(content);
        }
    }, 1500, [content]);

    if (content === null) {
        return (
             <div className="w-full h-full flex justify-center items-center text-xs text-gray-400">
                {status}
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col">
            <textarea
                value={content}
                onChange={e => {
                    setContent(e.target.value);
                    setStatus('Editing...');
                }}
                className="w-full h-full bg-transparent text-[color:var(--text-primary)] p-4 focus:outline-none resize-none font-mono"
                spellCheck="false"
            />
            <div className="flex-shrink-0 p-2 border-t border-white/10 flex justify-end items-center text-xs text-gray-400">
                <span>{status}</span>
            </div>
        </div>
    );
};

export default XEdit;