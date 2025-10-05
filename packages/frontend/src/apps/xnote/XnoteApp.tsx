// packages/frontend/src/apps/xnote/XnoteApp.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  FileText,
  Plus,
  Trash2,
  Search,
  MoreHorizontal,
  Table,
  Link,
  Image,
  Type,
} from "lucide-react";
import { useNotification } from "../../core/notification/useNotification";
import { vfsApi } from "../file-manager/api";
import { useUiStore } from "../../core/theme-engine/themeStore";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  filePath: string;
}

const XnoteApp = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const { error } = useNotification();
  const { surfaceStyle, reduceTransparency } = useUiStore();

  // Load notes from VFS on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      // Ensure Documents directory exists first
      try {
        await vfsApi.createDirectory("Documents");
      } catch (e) {
        // Directory might already exist, ignore error
      }
      
      // Ensure XNotes directory exists
      try {
        await vfsApi.createDirectory("Documents/XNotes");
      } catch (e) {
        // Directory might already exist, ignore error
      }

      // Load all .xnote files
      try {
        const response = await vfsApi.listDirectory("Documents/XNotes");
        console.log("VFS Response:", response); // Debug log
        
        if (response && response.success && response.files) {
          const noteFiles = response.files.filter((file: any) => 
            file.name.endsWith('.xnote') && file.type === 'file'
          );

          console.log("Note files found:", noteFiles); // Debug log

          const loadedNotes: Note[] = [];
          for (const file of noteFiles) {
            try {
              const content = await vfsApi.readFile(`Documents/XNotes/${file.name}`);
              console.log("File content:", content); // Debug log
              
              if (content && typeof content === 'object' && 'content' in content) {
                const noteData = JSON.parse((content as any).content);
                loadedNotes.push({
                  ...noteData,
                  filePath: `Documents/XNotes/${file.name}`,
                });
              }
            } catch (e) {
              console.warn(`Failed to load note: ${file.name}`, e);
            }
          }

          // Sort by updated date
          loadedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
          setNotes(loadedNotes);

          if (loadedNotes.length > 0 && !selectedNote) {
            setSelectedNote(loadedNotes[0]);
          }
        } else {
          // No files found, start with empty notes array
          console.log("No files found or response failed"); // Debug log
          setNotes([]);
        }
      } catch (e) {
        console.warn("Failed to list notes directory:", e);
        setNotes([]);
      }
    } catch (e) {
      console.error("Failed to initialize notes:", e);
      error("Failed to load notes", "Could not access the notes directory.");
    } finally {
      setIsLoading(false);
    }
  };

  const createNewNote = async () => {
    const now = Date.now();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "New Note",
      content: "",
      createdAt: now,
      updatedAt: now,
      filePath: `Documents/XNotes/note_${now}.xnote`,
    };

    try {
      await saveNoteToVFS(newNote);
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      // Removed unnecessary success notification
    } catch (e) {
      error("Failed to create note", "Could not create a new note.");
    }
  };

  const saveNoteToVFS = async (note: Note) => {
    const noteData = {
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };

    await vfsApi.writeFile(note.filePath, JSON.stringify(noteData, null, 2));
  };

  const updateNote = useCallback(async (updatedNote: Note) => {
    try {
      await saveNoteToVFS(updatedNote);
      setNotes(prev => prev.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      setSelectedNote(updatedNote);
    } catch (e) {
      error("Failed to save note", "Could not save the note changes.");
    }
  }, [error]);

  const deleteNote = async (noteToDelete: Note) => {
    try {
      await vfsApi.deleteFile(noteToDelete.filePath);
      setNotes(prev => prev.filter(note => note.id !== noteToDelete.id));
      
      if (selectedNote?.id === noteToDelete.id) {
        const remainingNotes = notes.filter(note => note.id !== noteToDelete.id);
        setSelectedNote(remainingNotes.length > 0 ? remainingNotes[0] : null);
      }
      
      // Removed unnecessary delete success notification
    } catch (e) {
      error("Failed to delete note", "Could not delete the note.");
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!selectedNote) return;
    
    const updatedNote = {
      ...selectedNote,
      title: newTitle,
      updatedAt: Date.now(),
    };
    
    updateNote(updatedNote);
  };

  const handleContentChange = () => {
    if (!selectedNote || !editorRef.current) return;
    
    const content = editorRef.current.innerHTML;
    const updatedNote = {
      ...selectedNote,
      content,
      updatedAt: Date.now(),
    };
    
    updateNote(updatedNote);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  };

  const insertTable = () => {
    const tableHTML = `
      <table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 1</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 2</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 3</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 4</td>
        </tr>
      </table>
    `;
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(range.createContextualFragment(tableHTML));
      }
      handleContentChange();
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[color:var(--text-secondary)]">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  const surfaceClass = reduceTransparency ? "bg-[color:var(--surface-bg-solid)]" : 
                       surfaceStyle === "glass" ? "liquid-glass" : "solid-surface";

  return (
    <div className={`w-full h-full flex ${surfaceClass} text-[color:var(--text-primary)]`}>
      {/* Sidebar */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-black/5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold">Xnote</h1>
            <button
              onClick={createNewNote}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="New Note"
            >
              <Plus size={18} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[color:var(--primary)] text-sm text-[color:var(--text-primary)]"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-[color:var(--text-secondary)]">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notes found</p>
              <button
                onClick={createNewNote}
                className="mt-2 text-xs text-[color:var(--primary)] hover:underline"
              >
                Create your first note
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                  selectedNote?.id === note.id ? "bg-[color:var(--primary)]/20" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate mb-1">{note.title}</h3>
                    <p className="text-xs text-[color:var(--text-secondary)] line-clamp-2">
                      {note.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                  </div>
                  <span className="text-xs text-[color:var(--text-secondary)] ml-2">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <div className="p-4 border-b border-white/10 bg-black/5">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-xl font-semibold bg-transparent border-none focus:outline-none flex-1 text-[color:var(--text-primary)]"
                  placeholder="Note title..."
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteNote(selectedNote)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => updateNote(selectedNote)}
                    className="p-2 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                    title="Save Note"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => execCommand('bold')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  title="Bold"
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => execCommand('italic')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  title="Italic"
                >
                  <Italic size={16} />
                </button>
                <button
                  onClick={() => execCommand('underline')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  title="Underline"
                >
                  <Underline size={16} />
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                <button
                  onClick={() => execCommand('insertUnorderedList')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  title="Bullet List"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => execCommand('insertOrderedList')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  title="Numbered List"
                >
                  <ListOrdered size={16} />
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                <button
                  onClick={() => execCommand('justifyLeft')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  title="Align Left"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => execCommand('justifyCenter')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  title="Align Center"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => execCommand('justifyRight')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  title="Align Right"
                >
                  <AlignRight size={16} />
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                <button
                  onClick={insertTable}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  title="Insert Table"
                >
                  <Table size={16} />
                </button>
                <button
                  onClick={() => {
                    const url = prompt("Enter URL:");
                    if (url) execCommand('createLink', url);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  title="Insert Link"
                >
                  <Link size={16} />
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                <select
                  onChange={(e) => execCommand('fontSize', e.target.value)}
                  className="px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-sm text-[color:var(--text-primary)]"
                  defaultValue="3"
                >
                  <option value="1">Small</option>
                  <option value="3">Normal</option>
                  <option value="5">Large</option>
                  <option value="7">Huge</option>
                </select>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div
                ref={editorRef}
                contentEditable
                onInput={handleContentChange}
                dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                className="w-full h-full focus:outline-none text-base leading-relaxed"
                style={{
                  minHeight: '100%',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
                placeholder="Start writing..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[color:var(--text-secondary)]">
            <div className="text-center">
              <FileText size={64} className="mx-auto mb-4 opacity-30" />
              <h2 className="text-xl font-medium mb-2">Welcome to Xnote</h2>
              <p className="text-sm mb-4">Select a note to start editing, or create a new one.</p>
              <button
                onClick={createNewNote}
                className="px-4 py-2 bg-[color:var(--primary)] text-white rounded-lg hover:bg-[color:var(--primary)]/80 transition-colors"
              >
                Create New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default XnoteApp;