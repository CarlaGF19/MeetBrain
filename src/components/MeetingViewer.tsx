/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Meeting, MeetingAnalysis, MeetingFolder } from "../types";
import { formatInUTC5 } from "../lib/dateUtils";
import { cleanTextForExport } from "../lib/textCleanup";
import { buildAcademicTranscriptSegments } from "../lib/transcriptSegments";
import { jsPDF } from "jspdf";
import {
  FileText,
  Search,
  Calendar,
  Clock,
  Pin,
  Trash2,
  Download,
  Share2,
  BookOpen,
  ChevronRight,
  Filter,
  Sparkles,
  RefreshCw,
  Mail,
  Send,
  X,
  Play,
  Pause,
  AlertTriangle,
  UserCheck,
  ChevronLeft,
  ArrowRight,
  HelpCircle,
  FolderOpen,
  FileAudio,
  MessageSquare,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MeetingViewerProps {
  meetings: Meeting[];
  folders: MeetingFolder[];
  selectedMeeting: Meeting | null;
  onSelectMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateMeetingTitle: (id: string, newTitle: string) => void;
  onUpdateMeeting: (id: string, updatedFields: Partial<Meeting>) => void;
  onCreateFolder: (name: string) => Promise<MeetingFolder>;
  onDeleteFolder: (id: string) => Promise<void>;
}

type PdfExportScope = "both" | "transcript" | "summary";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export default function MeetingViewer({
  meetings,
  folders,
  selectedMeeting,
  onSelectMeeting,
  onDeleteMeeting,
  onToggleFavorite,
  onUpdateMeetingTitle,
  onUpdateMeeting,
  onCreateFolder,
  onDeleteFolder,
}: MeetingViewerProps) {
  const [selectedFolderFilter, setSelectedFolderFilter] = useState("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [isMeetingMenuOpen, setIsMeetingMenuOpen] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<"transcript" | "summary">("transcript");
  
  // Custom states for draft summarization
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizationError, setSummarizationError] = useState("");

  // Email PDF Dispatch States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState(false);



  // Otter.ai Double-Pane AI Chat assistant state
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1180;
  });
  const [userChatMessage, setUserChatMessage] = useState("");
  const [isGeneratingChat, setIsGeneratingChat] = useState(false);
  const [chatError, setChatError] = useState("");
  
  // Chat Conversations keyed by meeting ID
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const getFriendlyAIError = (message: string) => {
    const raw = message || "";
    const lower = raw.toLowerCase();

    if (raw.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
      return "Gemini alcanzo el limite de cuota de tu API key. Espera a que se renueve o conecta otra clave.";
    }

    if (raw.includes("401") || raw.includes("403") || lower.includes("api key") || lower.includes("permission")) {
      return "Conecta una API key valida en Settings para activar respuestas inteligentes.";
    }

    return raw.length > 180 ? `${raw.slice(0, 180)}...` : raw;
  };

  // Initialize and load chat history for selected meeting
  useEffect(() => {
    if (selectedMeeting && !conversations[selectedMeeting.id]) {
      // Set initial welcoming message from Olli
      const welcomeMsg: ChatMessage = {
        role: "model",
        content: `Hola. Soy **Olli**, tu asistente inteligente. Ya tengo cargada la sesion **"${selectedMeeting.title}"** en tiempo real. 

Puedes pedirme decisiones, tareas, resumen ejecutivo o preguntas sobre la transcripcion.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setConversations(prev => ({
        ...prev,
        [selectedMeeting.id]: [welcomeMsg]
      }));
    }
  }, [selectedMeeting]);

  // Keep chat scrolled down
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations, selectedMeeting, isGeneratingChat]);

  useEffect(() => {
    setActiveDocTab("transcript");
  }, [selectedMeeting?.id]);

  const handleSummarizeDraftText = async (meeting: Meeting) => {
    if (!meeting.transcript || meeting.transcript.trim().length === 0) {
      setSummarizationError("La transcripción está vacía. Graba o agrega un borrador con palabras reales para resumir.");
      return;
    }

    setIsSummarizing(true);
    setSummarizationError("");

    try {
      const response = await fetch("/api/summarize-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: meeting.transcript,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo conectar con el motor de IA para resumir.");
      }

      const data = await response.json();
      onUpdateMeeting(meeting.id, {
        title: data.title,
        summary: data.summary,
        analysis: data.analysis,
        isDraft: false
      });

    } catch (err: any) {
      console.error("Text Resumen Error:", err);
      setSummarizationError(err.message || "Fallo inesperado al resumir el borrador de texto.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Search and filter meetings
  const filteredMeetings = useMemo(() => {
    return meetings
      .filter((meeting) => (
        selectedFolderFilter === "all" ||
        (selectedFolderFilter === "none" ? !meeting.folderId : meeting.folderId === selectedFolderFilter)
      ))
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetings, selectedFolderFilter]);

  useEffect(() => {
    if (filteredMeetings.length === 0) return;
    if (!selectedMeeting) {
      const lastMeetingId = typeof window !== "undefined" ? window.localStorage.getItem("olli_last_explore_meeting") : null;
      const lastMeeting = filteredMeetings.find((meeting) => meeting.id === lastMeetingId);
      onSelectMeeting(lastMeeting || filteredMeetings[0]);
      return;
    }
    if (!filteredMeetings.some((meeting) => meeting.id === selectedMeeting.id)) {
      onSelectMeeting(filteredMeetings[0]);
    }
  }, [filteredMeetings, selectedMeeting, onSelectMeeting]);

  useEffect(() => {
    if (selectedMeeting?.id && typeof window !== "undefined") {
      window.localStorage.setItem("olli_last_explore_meeting", selectedMeeting.id);
    }
  }, [selectedMeeting?.id]);

  const handleCreateFolder = async () => {
    const cleanName = newFolderName.trim();
    if (!cleanName) return;
    setIsCreatingFolder(true);
    setFolderError("");
    try {
      const folder = await onCreateFolder(cleanName);
      setNewFolderName("");
      setSelectedFolderFilter(folder.id);
      if (selectedMeeting) {
        onUpdateMeeting(selectedMeeting.id, { folderId: folder.id });
      }
    } catch (error: any) {
      setFolderError(error.message || "No se pudo crear la carpeta.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const selectedFolderName = selectedMeeting?.folderId
    ? folders.find((folder) => folder.id === selectedMeeting.folderId)?.name
    : "";

  const activeMeeting = selectedMeeting && filteredMeetings.some((meeting) => meeting.id === selectedMeeting.id)
    ? selectedMeeting
    : null;

  const selectedMeetingIndex = selectedMeeting
    ? filteredMeetings.findIndex((meeting) => meeting.id === selectedMeeting.id)
    : -1;

  const selectMeetingFromMenu = (meeting: Meeting) => {
    setIsMeetingMenuOpen(false);
    onSelectMeeting(meeting);
  };

  const goToAdjacentMeeting = (direction: -1 | 1) => {
    if (selectedMeetingIndex < 0) return;
    const nextIndex = selectedMeetingIndex + direction;
    if (nextIndex < 0 || nextIndex >= filteredMeetings.length) return;
    selectMeetingFromMenu(filteredMeetings[nextIndex]);
  };

  const getMeetingStatus = (meeting: Meeting) => {
    const transcriptWords = cleanTextForExport(meeting.transcript, { fallback: "", maxWords: 80 })
      .split(/\s+/)
      .filter(Boolean).length;

    if (meeting.summary && !meeting.isDraft) return "Resumen listo";
    if (transcriptWords > 20) return "Transcripcion";
    if (meeting.isDraft) return "Borrador";
    return "Sin texto";
  };

  const getMeetingFolderLabel = (meeting: Meeting) => {
    if (!meeting.folderId) return "Sin carpeta";
    return folders.find((folder) => folder.id === meeting.folderId)?.name || "Carpeta";
  };

  const getSummaryAnalysis = (meeting: Meeting): MeetingAnalysis => {
    if (meeting.analysis) return meeting.analysis;
    const legacyOverview = cleanTextForExport(meeting.summary, {
      fallback: "Aun no hay un analisis generado. Activa el analisis con IA cuando quieras organizar la transcripcion.",
      maxWords: 1200,
    });
    return {
      overview: legacyOverview,
      keyPoints: [],
      actionItems: [],
      outline: [],
      additionalNotes: [],
    };
  };
  const assistantPrompts = [
    "¿Es correcto lo que explicó el profesor?",
    "¿Cuáles son las tareas o pendientes?",
    "¿Qué decisiones se tomaron?",
  ];

  const handleDeleteSelectedFolder = async () => {
    if (selectedFolderFilter === "all" || selectedFolderFilter === "none") return;
    const folder = folders.find((item) => item.id === selectedFolderFilter);
    const ok = window.confirm(`Eliminar la carpeta "${folder?.name || "seleccionada"}"? Las reuniones se conservaran en Sin carpeta.`);
    if (!ok) return;
    setFolderError("");
    try {
      await onDeleteFolder(selectedFolderFilter);
      setSelectedFolderFilter("all");
    } catch (error: any) {
      setFolderError(error.message || "No se pudo eliminar la carpeta.");
    }
  };

  const startEditTitle = (meeting: Meeting) => {
    setEditTitleValue(meeting.title);
    setIsEditingTitle(true);
  };

  const saveEditTitle = (id: string) => {
    if (editTitleValue.trim()) {
      onUpdateMeetingTitle(id, editTitleValue.trim());
    }
    setIsEditingTitle(false);
  };

  // Exporters for general structured formats
  const downloadFile = (fileName: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = (meeting: Meeting) => {
    const mdContent = `# ${meeting.title}
Fecha: ${formatInUTC5(meeting.date, "datetime")} (UTC-5)
Duration: ${meeting.duration}

## AI Resumen & Actions
${meeting.summary}

## Verbatim Transcripcion
${meeting.transcript}
`;
    const cleanName = meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadFile(`${cleanName}-notes.md`, mdContent, "text/markdown");
  };

  const handleExportJSON = (meeting: Meeting) => {
    const jsonStr = JSON.stringify(meeting, null, 2);
    const cleanName = meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadFile(`${cleanName}-vault.json`, jsonStr, "application/json");
  };

  const generatePDFDoc = (meeting: Meeting, scope: PdfExportScope = "both"): jsPDF => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const footerY = pageHeight - 12;
    const contentBottom = pageHeight - 24;
    const maxLineWidth = pageWidth - margin * 2;

    let yPosition = 24;

    const checkPageOverflow = (neededHeight: number) => {
      if (yPosition + neededHeight > contentBottom) {
        doc.addPage();
        drawPageBackground();
        yPosition = 22;
      }
    };

    const drawPageBackground = () => {
      // Top accent bar
      doc.setFillColor(19, 91, 241); // Olli style Blue
      doc.rect(0, 0, pageWidth, 3, "F");

      // Footer
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(145, 152, 166);
      doc.text(`Olli | Transcripcion academica`.slice(0, 92), margin, footerY);
      const pageNum = doc.getNumberOfPages();
      doc.text(`Pag. ${pageNum}`, pageWidth - margin - 15, footerY);
    };

    const writeHeading = (text: string) => {
      checkPageOverflow(12);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(74, 92, 120);
      doc.text(text.toUpperCase(), margin, yPosition);
      yPosition += 7;
    };

    const writeParagraphs = (text: string) => {
      const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
      if (paragraphs.length === 0) {
        paragraphs.push("(Sin contenido disponible)");
      }

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.6);
      doc.setTextColor(39, 48, 66);

      paragraphs.forEach((paragraph) => {
        const lines = doc.splitTextToSize(paragraph, maxLineWidth);
        checkPageOverflow(lines.length * 5.1 + 3);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 5.1 + 3;
      });
    };

    const writeBulletList = (items: string[]) => {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.4);
      doc.setTextColor(39, 48, 66);
      items.forEach((item) => {
        const cleanItem = cleanTextForExport(item, { fallback: "", maxWords: 120 });
        if (!cleanItem) return;
        const lines = doc.splitTextToSize(cleanItem, maxLineWidth - 8);
        checkPageOverflow(lines.length * 5.1 + 3);
        doc.setFillColor(19, 91, 241);
        doc.circle(margin + 1.4, yPosition - 1.2, 0.9, "F");
        doc.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 5.1 + 3;
      });
    };
    const writeMetaPill = (label: string, value: string, x: number, y: number) => {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(115, 128, 150);
      doc.text(label.toUpperCase(), x, y);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(42, 52, 70);
      doc.text(value, x, y + 5);
    };

    const writeSegment = (label: string, timestamp: string, text: string) => {
      const lines = doc.splitTextToSize(text, maxLineWidth - 18);
      const blockHeight = Math.max(16, lines.length * 4.6 + 9);
      checkPageOverflow(blockHeight);

      doc.setFillColor(19, 91, 241);
      doc.circle(margin + 4, yPosition + 2, 3, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text(String(label.replace("Segmento ", "")), margin + 3.2, yPosition + 3.5);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(34, 45, 64);
      doc.text(label, margin + 12, yPosition + 1);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(timestamp, margin + 36, yPosition + 1);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.4);
      doc.setTextColor(31, 41, 55);
      doc.text(lines, margin + 12, yPosition + 7);
      yPosition += blockHeight;
    };

    drawPageBackground();

    // Document Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(17, 17, 17);
    const titleLines = doc.splitTextToSize(meeting.title, maxLineWidth);
    doc.text(titleLines, margin, yPosition);
    yPosition += (titleLines.length * 7.5) + 6;

    // Subheader / Metadata
    const dateStr = formatInUTC5(meeting.date, "date");
    const timeStr = `${formatInUTC5(meeting.date, "time")} (UTC-5)`;
    const durationStr = meeting.duration || "00:00";
    writeMetaPill("Fecha", dateStr, margin, yPosition);
    writeMetaPill("Hora", timeStr, margin + 54, yPosition);
    writeMetaPill("Duracion", durationStr, margin + 110, yPosition);
    yPosition += 14;

    // Horizontal line separator
    doc.setDrawColor(242, 242, 242);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    const rawSummary = (meeting.summary || "").trim();
    const lowerSummary = rawSummary.toLowerCase();
    const hasUsefulSummary = Boolean(rawSummary)
      && !lowerSummary.includes("borrador guardado en tiempo real")
      && !lowerSummary.includes("audio digital capturado localmente")
      && !lowerSummary.includes("genera un resumen con ia");
    const summary = hasUsefulSummary ? cleanTextForExport(rawSummary, { maxWords: 900 }) : "";
    const analysis = meeting.analysis;
    const transcript = cleanTextForExport(meeting.transcript, {
      fallback: "(Sin transcripcion disponible)",
      maxWords: 4500,
    });

    if (scope !== "transcript") {
      if (analysis) {
        writeHeading("Resumen general");
        writeParagraphs(cleanTextForExport(analysis.overview, { maxWords: 900 }));
        yPosition += 2;

        if (analysis.keyPoints.length > 0) {
          writeHeading("Puntos clave");
          writeBulletList(analysis.keyPoints);
          yPosition += 2;
        }
        if (analysis.actionItems.length > 0) {
          writeHeading("Acciones y pendientes");
          writeBulletList(analysis.actionItems);
          yPosition += 2;
        }
        if (analysis.outline.length > 0) {
          writeHeading("Esquema de la clase");
          analysis.outline.forEach((section) => {
            const heading = cleanTextForExport(section.heading, { fallback: "", maxWords: 30 });
            if (heading) {
              checkPageOverflow(8);
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(9.4);
              doc.setTextColor(39, 48, 66);
              doc.text(heading, margin, yPosition);
              yPosition += 5;
            }
            writeBulletList(section.items);
          });
          yPosition += 2;
        }
        if (analysis.additionalNotes.length > 0) {
          writeHeading("Notas adicionales");
          writeBulletList(analysis.additionalNotes);
          yPosition += 2;
        }
      } else if (summary) {
        writeHeading("Resumen");
        writeParagraphs(summary);
        yPosition += 3;
      }
    }

    if (scope !== "summary") {
      writeHeading("Transcripcion");
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const note = "Documento generado sin identificacion automatica de hablantes. Los bloques se organizan por tiempo para facilitar lectura y revision.";
      const noteLines = doc.splitTextToSize(note, maxLineWidth);
      doc.text(noteLines, margin, yPosition);
      yPosition += noteLines.length * 4.5 + 7;

      const segments = buildAcademicTranscriptSegments(transcript, meeting.duration, 120);
      segments.forEach((segment) => writeSegment(segment.label, segment.timestamp, segment.text));
    }

    return doc;
  };

  const handleExportPDF = (meeting: Meeting, scope: PdfExportScope) => {
    const doc = generatePDFDoc(meeting, scope);
    const cleanName = meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const suffix = scope === "summary" ? "resumen" : scope === "transcript" ? "transcripcion" : "resumen-y-transcripcion";
    doc.save(`${cleanName}-${suffix}-olli.pdf`);
    setIsPdfExportModalOpen(false);
  };

  const handleSendEmail = async () => {
    if (!selectedMeeting) return;
    if (!recipientEmail || !recipientEmail.trim()) {
      setEmailError("Por favor ingresa un correo electronico de destino valido.");
      return;
    }

    setIsSendingEmail(true);
    setEmailError("");
    setEmailSuccess(null);

    try {
      const doc = generatePDFDoc(selectedMeeting);
      const pdfBase64DataUri = doc.output("datauristring");
      const cleanName = selectedMeeting.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const pdfFilename = `${cleanName}-resumen.pdf`;
      const subject = emailSubject || `Acta de reunion: ${selectedMeeting.title}`;
      const localMailBody = [
        emailNote || "Hola, te comparto el acta de la reunion junto con la transcripcion completa.",
        "",
        `Olli descargo el PDF "${pdfFilename}". Adjuntalo manualmente antes de enviar este correo.`,
      ].join("\n");

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          subject,
          body: emailNote,
          pdfBase64: pdfBase64DataUri,
          pdfFilename,
          title: selectedMeeting.title,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.code === "SMTP_NOT_CONFIGURED") {
          doc.save(pdfFilename);
          window.location.href = `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(localMailBody)}`;
          setEmailSuccess("No hay SMTP configurado. Olli descargo el PDF y abrio un borrador de correo para que lo adjuntes manualmente.");
          setRecipientEmail("");
          setEmailNote("");
          return;
        }
        throw new Error(errData.error || "No se pudo enviar el correo electronico.");
      }

      const result = await response.json();

      if (result.success) {
        setEmailSuccess(result.message);
        setRecipientEmail("");
        setEmailNote("");
      } else {
        throw new Error(result.error || "Ocurrio un error inesperado al enviar.");
      }

    } catch (err: any) {
      console.error("Failed to send email:", err);
      setEmailError(err.message || "Error al enviar el correo con el PDF adjunto.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Otter.ai Interactive Ask Q&A handler
  const handleQueryOlliChat = async (questionText: string) => {
    if (!selectedMeeting || !questionText || !questionText.trim()) return;

    const cleanTranscript = cleanTextForExport(selectedMeeting.transcript, {
      fallback: "",
      maxWords: 1200,
    });

    if (cleanTranscript.split(/\s+/).filter(Boolean).length < 20) {
      setChatError("Aun no hay texto suficiente para consultar.");
      return;
    }

    setUserChatMessage("");
    setChatError("");
    setIsGeneratingChat(true);

    const userMsg: ChatMessage = {
      role: "user",
      content: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append user message
    const currentHistory = conversations[selectedMeeting.id] || [];
    const updatedHistory = [...currentHistory, userMsg];
    setConversations(prev => ({
      ...prev,
      [selectedMeeting.id]: updatedHistory
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: selectedMeeting.transcript,
          messages: updatedHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
          userMessage: questionText,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Ocurrió un error al contactar al motor de Olli.");
      }

      const data = await response.json();
      const modelMsg: ChatMessage = {
        role: "model",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => ({
        ...prev,
        [selectedMeeting.id]: [...updatedHistory, modelMsg]
      }));

    } catch (err: any) {
      console.error("Olli Chat Error:", err);
      setChatError(err.message || "No se pudo obtener respuesta.");
    } finally {
      setIsGeneratingChat(false);
    }
  };

  // Custom parser rendering Markdown to HTML neatly
  const renderMarkdown = (markdownText: string) => {
    if (!markdownText) return <p className="text-slate-450 italic">No hay contenido disponible.</p>;
    
    const lines = markdownText.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-[11px] font-semibold text-slate-700 tracking-wide uppercase mt-3 mb-1.5">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h3 key={idx} className="text-[13px] font-semibold text-slate-800 border-b border-slate-100 pb-1.5 mt-4 mb-2">
            {trimmed.replace(/^##\s*/, "")}
          </h3>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h2 key={idx} className="text-sm font-semibold text-[#135bf1] mt-4 mb-2 font-sans tracking-tight">
            {trimmed.replace(/^#\s*/, "")}
          </h2>
        );
      }

      // Checklists (Task Lists)
      const checklistMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.*)/);
      if (checklistMatch) {
        const checked = checklistMatch[1].toLowerCase() === "x";
        const text = checklistMatch[2];
        return (
          <div key={idx} className="flex items-start space-x-2.5 my-2 pl-2">
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-[#135bf1] focus:ring-[#135bf1] shrink-0"
            />
            <span className={`text-[12px] leading-6 ${checked ? "text-slate-400 line-through" : "text-slate-750"}`}>
              {text}
            </span>
          </div>
        );
      }

      // Standard Unordered Lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} className="text-[12px] text-slate-750 leading-6 my-1 list-disc pl-1 ml-4">
            {trimmed.replace(/^[-*]\s+/, "")}
          </li>
        );
      }

      // Empty Lines
      if (trimmed === "") {
        return <div key={idx} className="h-1.5" />;
      }

      // Bold text replacements
      let lineWithBold = trimmed;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(trimmed)) !== null) {
        if (match.index > lastIndex) {
          parts.push(trimmed.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="font-bold text-[#111111]">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < trimmed.length) {
        parts.push(trimmed.substring(lastIndex));
      }

      return (
        <p key={idx} className="text-[12px] text-slate-655 leading-6 my-1">
          {parts.length > 0 ? parts : trimmed}
        </p>
      );
    });
  };

  return (
    <div className="flex h-[calc(100vh-72px)] gap-3 select-none font-sans relative overflow-hidden">
      
      {/* 2. Interactive Double Pane (Main Workspace & Ask Olli AI Column) */}
      <div id="notes_workspace" className="flex-grow min-w-0 bg-white border border-[#E9E9EB] rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="px-5 py-2 border-b border-[#E9E9EB] bg-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <select
              value={selectedFolderFilter}
              onChange={(e) => setSelectedFolderFilter(e.target.value)}
              className="h-8 min-w-[150px] rounded-lg border border-[#E9E9EB] bg-white px-3 text-xs font-semibold text-slate-650 outline-none transition-all hover:border-[#135bf1]/30 focus:border-[#135bf1]"
              title="Filtrar por carpeta"
            >
              <option value="all">Todas las carpetas</option>
              <option value="none">Sin carpeta</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                }}
                placeholder="Nueva carpeta"
                className="h-8 w-36 rounded-lg border border-[#E9E9EB] bg-white px-3 text-xs font-semibold text-slate-650 placeholder:text-slate-400 outline-none transition-all hover:border-[#135bf1]/30 focus:border-[#135bf1]"
              />
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-[#135bf1] text-white hover:bg-[#0746cc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Crear carpeta"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {folderError && (
              <span className="text-[10px] font-semibold text-rose-600">{folderError}</span>
            )}

            {selectedFolderFilter !== "all" && selectedFolderFilter !== "none" && (
              <button
                type="button"
                onClick={handleDeleteSelectedFolder}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#E9E9EB] bg-white text-slate-400 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                title="Eliminar carpeta"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {selectedFolderFilter !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedFolderFilter("all")}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#E9E9EB] bg-white text-slate-500 hover:text-[#135bf1] transition-colors"
              title="Limpiar filtro"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {selectedMeeting && activeMeeting ? (
          <div className="flex w-full flex-grow min-h-0">
            
            {/* Left Pane - Document text and media */}
            <div className="flex-grow flex flex-col h-full min-w-0 border-r border-[#E9E9EB] relative">
              {/* Doc Workspace header controls */}
              <div className="px-5 py-3 border-b border-[#E9E9EB] bg-white flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
                <div className="flex-grow min-w-0">
                  {isEditingTitle ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onBlur={() => saveEditTitle(selectedMeeting.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditTitle(selectedMeeting.id);
                          if (e.key === "Escape") setIsEditingTitle(false);
                        }}
                        className="text-base font-bold text-slate-800 border-b border-[#135bf1] px-1 bg-transparent py-0.5 focus:outline-none w-full max-w-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEditTitle(selectedMeeting.id)}
                        className="text-xs bg-[#135bf1] text-white px-2 py-1 rounded-lg cursor-pointer font-bold"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <div className="relative min-w-0 max-w-full">
                        <button
                          type="button"
                          onClick={() => setIsMeetingMenuOpen((open) => !open)}
                          className="group flex max-w-[min(520px,calc(100vw-720px))] min-w-[220px] items-center gap-2 rounded-lg border border-transparent px-1.5 py-1 text-left hover:border-[#E9E9EB] hover:bg-slate-50 transition-colors"
                          title="Cambiar de borrador o transcripcion"
                        >
                          <span className="truncate text-lg font-semibold text-[#111111] tracking-tight leading-snug group-hover:text-[#135bf1]">
                            {selectedMeeting.title}
                          </span>
                          <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${isMeetingMenuOpen ? "-rotate-90" : "rotate-90"}`} />
                        </button>

                        <AnimatePresence>
                          {isMeetingMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ duration: 0.14 }}
                              className="absolute left-0 top-full z-50 mt-2 w-[min(520px,calc(100vw-140px))] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
                            >
                              <div className="flex items-center justify-between border-b border-[#F1F5F9] px-4 py-3">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Borradores y transcripciones</p>
                                  <p className="text-xs font-semibold text-slate-500">{filteredMeetings.length} disponibles en este filtro</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setIsMeetingMenuOpen(false)}
                                  className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                                  title="Cerrar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="max-h-[360px] overflow-y-auto p-2">
                                {filteredMeetings.map((meeting, index) => {
                                  const isCurrent = meeting.id === selectedMeeting.id;
                                  const status = getMeetingStatus(meeting);
                                  return (
                                    <button
                                      key={meeting.id}
                                      type="button"
                                      onClick={() => selectMeetingFromMenu(meeting)}
                                      className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
                                        isCurrent
                                          ? "bg-[#135bf1]/8 border border-[#135bf1]/20"
                                          : "border border-transparent hover:bg-slate-50"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400">{index + 1}</span>
                                            <p className="truncate text-sm font-black text-slate-900">{meeting.title}</p>
                                          </div>
                                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                                            <span>{formatInUTC5(meeting.date, "datetime")}</span>
                                            <span>{meeting.duration}</span>
                                            <span>{getMeetingFolderLabel(meeting)}</span>
                                          </div>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                                          status === "Resumen listo"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : status === "Transcripcion"
                                              ? "bg-blue-50 text-[#135bf1]"
                                              : status === "Borrador"
                                                ? "bg-amber-50 text-amber-700"
                                                : "bg-slate-100 text-slate-500"
                                        }`}>
                                          {status}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="inline-flex items-center gap-1 rounded-xl border border-[#E9E9EB] bg-white p-1">
                        <button
                          type="button"
                          onClick={() => goToAdjacentMeeting(-1)}
                          disabled={selectedMeetingIndex <= 0}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#135bf1] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                          title="Reunion anterior"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                          {selectedMeetingIndex >= 0 ? selectedMeetingIndex + 1 : 0} de {filteredMeetings.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => goToAdjacentMeeting(1)}
                          disabled={selectedMeetingIndex < 0 || selectedMeetingIndex >= filteredMeetings.length - 1}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#135bf1] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                          title="Siguiente reunion"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => startEditTitle(selectedMeeting)}
                        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-50 hover:text-[#135bf1] transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-2 font-medium">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {formatInUTC5(selectedMeeting.date, "datetime")} (UTC-5)
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {selectedMeeting.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5" />
                      <select
                        value={selectedMeeting.folderId || ""}
                        onChange={(e) => onUpdateMeeting(selectedMeeting.id, { folderId: e.target.value || null })}
                        className="h-7 max-w-[180px] rounded-lg border border-[#E9E9EB] bg-white px-2 text-[11px] font-semibold text-slate-600 outline-none hover:border-[#135bf1]/30 focus:border-[#135bf1]"
                        title="Asignar carpeta"
                      >
                        <option value="">Sin carpeta</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))}
                      </select>
                      {selectedFolderName && (
                        <button
                          type="button"
                          onClick={() => onUpdateMeeting(selectedMeeting.id, { folderId: null })}
                          className="text-[10px] text-slate-400 hover:text-rose-500"
                          title={`Quitar de ${selectedFolderName}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  </div>
                </div>

                {/* Toolbar widgets */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onToggleFavorite(selectedMeeting.id)}
                    className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                      selectedMeeting.isFavorite
                        ? "bg-[#135bf1]/5 border-slate-100 text-[#135bf1]"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                    }`}
                    title="Pin File to Chest"
                  >
                    <Pin className={`w-3.5 h-3.5 ${selectedMeeting.isFavorite ? "fill-[#135bf1]" : ""}`} />
                  </button>
                  <button
                    onClick={() => handleExportMarkdown(selectedMeeting)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-[#E9E9EB] hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Exportar Markdown"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsPdfExportModalOpen(true)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-[#E9E9EB] hover:bg-emerald-55 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                    title="Descargar PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  </button>
                  <button
                    onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
                    className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                      isChatPanelOpen
                        ? "bg-[#135bf1]/5 border-[#135bf1]/15 text-[#135bf1]"
                        : "bg-white border-[#E9E9EB] text-slate-500 hover:text-[#135bf1]"
                    }`}
                    title={isChatPanelOpen ? "Cerrar asistente" : "Abrir asistente"}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* Compartir pill selector button */}
                  <button
                    onClick={() => {
                      setIsEmailModalOpen(true);
                      setEmailSubject(`Acta de reunion: ${selectedMeeting.title}`);
                      setEmailSuccess(null);
                      setEmailError("");
                    }}
                    className="h-8 px-3 rounded-full bg-[#135bf1] hover:bg-[#0746cc] text-white flex items-center gap-1.5 text-xs font-semibold shadow-xs cursor-pointer transition-all active:scale-95"
                    title="Compartir meeting note via E-mail"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Compartir</span>
                  </button>
                  
                  <button
                    onClick={() => onDeleteMeeting(selectedMeeting.id)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-[#E9E9EB] hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 💡 DRAFT AI SUMMARY TRIGGER BANNER */}
              {false && selectedMeeting.isDraft && (
                <div className="mx-6 mt-5 p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                      <Sparkles className="w-5 h-5 text-[#135bf1] shrink-0" />
                      Borrador guardado en tiempo real
                    </h3>
                    <p className="text-sm text-slate-650 leading-7 mt-2 max-w-2xl">
                      Esta conversacion se guardo automaticamente mientras hablabas. Puedes generar un resumen ejecutivo, revisar la transcripcion o crear un plan de accion.
                    </p>
                    {summarizationError && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-2 bg-rose-50 p-2 rounded-lg border border-rose-100">
                        ⚠️ Error: {summarizationError}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSummarizeDraftText(selectedMeeting)}
                      disabled={isSummarizing || !selectedMeeting.transcript}
                      className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 w-full md:w-auto bg-[#135bf1] hover:bg-[#0746cc] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSummarizing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{isSummarizing ? "Generando..." : "Resumir con IA"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Display document area */}
              <div className="flex-grow overflow-y-auto bg-white relative">
                <div className="sticky top-0 z-10 bg-white border-b border-[#E9E9EB] px-5 pt-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={() => setActiveDocTab("transcript")}
                        className={`py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                          activeDocTab === "transcript"
                            ? "border-[#135bf1] text-[#111111]"
                            : "border-transparent text-slate-500 hover:text-[#111111]"
                        }`}
                      >
                        Transcription
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDocTab("summary")}
                        className={`py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                          activeDocTab === "summary"
                            ? "border-[#135bf1] text-[#111111]"
                            : "border-transparent text-slate-500 hover:text-[#111111]"
                        }`}
                      >
                        Summary
                      </button>
                    </div>

                  </div>
                </div>

                <div className="px-5 py-5 max-w-4xl">
                  {activeDocTab === "transcript" ? (
                    <section className="text-left">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-3.5 h-3.5 text-[#135bf1]" />
                        <h2 className="text-base font-semibold text-slate-900">Transcripcion</h2>
                      </div>
                      <div className="font-sans text-slate-800 leading-7 text-[14px] whitespace-pre-wrap font-normal space-y-2 text-left [text-wrap:pretty]">
                        {selectedMeeting.transcript ? (
                          cleanTextForExport(selectedMeeting.transcript, { fallback: "", maxWords: 8000 })
                            .split("\n")
                            .map((line, idx) => {
                              const match = line.match(/^\[(\d{2}:\d{2})\]\s*(.*?):\s*(.*)/);
                              if (match) {
                                const timestamp = match[1];
                                const speaker = match[2];
                                const utterance = match[3];
                                return (
                                  <div key={idx} className="flex flex-col md:flex-row md:items-start gap-3 pb-3 border-b border-[#F4F4F5] last:border-b-0">
                                    <div className="flex items-center gap-2 shrink-0 md:w-36">
                                      <span className="text-[11px] bg-[#F4F4F5] text-[#111111] px-2 py-1 rounded-md font-semibold font-mono">
                                        {timestamp}
                                      </span>
                                      <span className="text-xs font-bold text-[#111111] truncate max-w-[90px]" title={speaker}>
                                        {speaker}
                                      </span>
                                    </div>
                                    <p className="text-[13px] text-slate-700 text-left flex-grow leading-6">{utterance}</p>
                                  </div>
                                );
                              }
                              return (
                                <p key={idx} className="text-[14px] text-slate-700 text-left leading-7">
                                  {line}
                                </p>
                              );
                            })
                        ) : (
                          <p className="font-sans italic text-slate-400 text-sm py-8">
                            No hay transcripcion disponible.
                          </p>
                        )}
                      </div>
                    </section>
                  ) : (
                    <section className="text-left space-y-5">
                      {(() => {
                        const analysis = getSummaryAnalysis(selectedMeeting);
                        const hasStructuredAnalysis = Boolean(selectedMeeting.analysis);
                        return (
                          <>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
                              <div>
                                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-[#135bf1]" />
                                  Analisis de la transcripcion
                                </h2>
                                <p className="text-xs text-slate-600 leading-5 mt-1 max-w-2xl">
                                  {hasStructuredAnalysis
                                    ? "Analisis guardado. Puedes actualizarlo si la transcripcion cambio."
                                    : "Analiza la transcripcion para obtener puntos clave, pendientes, esquema y notas. Esta accion usa Gemini."}
                                </p>
                                {summarizationError && (
                                  <p className="text-[11px] text-rose-600 font-semibold mt-2 bg-white p-2 rounded-lg border border-rose-100">
                                    Error: {summarizationError}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSummarizeDraftText(selectedMeeting)}
                                disabled={isSummarizing || !selectedMeeting.transcript}
                                className="inline-flex items-center justify-center gap-2 h-9 px-3.5 bg-[#135bf1] hover:bg-[#0746cc] text-white rounded-lg text-[11px] font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSummarizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                <span>{isSummarizing ? "Analizando..." : hasStructuredAnalysis ? "Actualizar analisis" : "Analizar con IA"}</span>
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-[#135bf1]" />
                                <h3 className="text-base font-semibold text-slate-900">Resumen general</h3>
                              </div>
                              <p className="pl-6 text-[13px] leading-6 text-slate-700 whitespace-pre-line">{analysis.overview}</p>
                            </div>

                            {analysis.keyPoints.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-[#135bf1]" />
                                  <h3 className="text-base font-semibold text-slate-900">Puntos clave</h3>
                                </div>
                                <ul className="pl-10 space-y-2 text-[13px] leading-6 text-slate-700 list-disc">
                                  {analysis.keyPoints.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                                </ul>
                              </div>
                            )}

                            {hasStructuredAnalysis && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <h3 className="text-base font-semibold text-slate-900">Acciones y pendientes</h3>
                                </div>
                                {analysis.actionItems.length > 0 ? (
                                  <ul className="pl-10 space-y-2 text-[13px] leading-6 text-slate-700 list-disc">
                                    {analysis.actionItems.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                                  </ul>
                                ) : (
                                  <p className="pl-6 text-[13px] leading-6 text-slate-500">No se mencionaron tareas o compromisos explicitos.</p>
                                )}
                              </div>
                            )}

                            {analysis.outline.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Filter className="w-3.5 h-3.5 text-slate-600" />
                                  <h3 className="text-base font-semibold text-slate-900">Esquema de la clase</h3>
                                </div>
                                <div className="pl-6 space-y-3">
                                  {analysis.outline.map((section, index) => (
                                    <div key={`${section.heading}-${index}`}>
                                      {section.heading && <h4 className="text-[13px] font-semibold text-slate-800">{section.heading}</h4>}
                                      {section.items.length > 0 && (
                                        <ul className="mt-1 ml-4 space-y-1 text-[13px] leading-6 text-slate-700 list-disc">
                                          {section.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}
                                        </ul>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {analysis.additionalNotes.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                                  <h3 className="text-base font-semibold text-slate-900">Notas adicionales</h3>
                                </div>
                                <ul className="pl-10 space-y-2 text-[13px] leading-6 text-slate-700 list-disc">
                                  {analysis.additionalNotes.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                                </ul>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </section>
                  )}
                </div>
              </div>

            </div>

            {/* Right Pane - Olli contextual assistant */}
            <AnimatePresence>
              {isChatPanelOpen && (
                <motion.aside
                  id="olli_assistant_column"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 360, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "tween", duration: 0.2 }}
                  className="bg-white flex flex-col h-full min-w-[340px] shrink-0 border-l border-[#E5E7EB] overflow-hidden"
                >
                  <div className="h-14 px-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#135bf1]/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-[#135bf1]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-[#111111] tracking-tight">New chat</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          Consulta esta conversacion
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsChatPanelOpen(false)}
                      className="p-2 hover:bg-[#F4F4F5] rounded-full text-slate-400 hover:text-slate-700 transition"
                      title="Cerrar asistente"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                    <div className="space-y-2">
                      {assistantPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleQueryOlliChat(prompt)}
                          disabled={isGeneratingChat}
                          className="w-full rounded-2xl bg-[#F4F4F5] hover:bg-[#ECEEF2] px-4 py-3 text-left text-[12px] leading-5 font-semibold text-[#111111] transition-colors disabled:opacity-50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 pt-1">
                      {conversations[selectedMeeting.id]?.map((msg, idx) => {
                        const isAI = msg.role === "model";
                        return (
                          <div key={idx} className={`flex items-start gap-3 ${isAI ? "" : "flex-row-reverse"}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[10px] shrink-0 border select-none ${
                              isAI
                                ? "bg-[#135bf1]/8 border-[#135bf1]/15 text-[#135bf1]"
                                : "bg-[#F5F2EB] border-[#E2E0D8] text-slate-700"
                            }`}>
                              {isAI ? "AI" : "Tu"}
                            </div>
                            <div className={`max-w-[82%] ${isAI ? "text-left" : "text-right"}`}>
                              <div className={`px-3.5 py-2.5 rounded-2xl text-[12px] leading-5 ${
                                isAI
                                  ? "bg-white border border-[#E5E7EB] text-slate-800"
                                  : "bg-[#135bf1] text-white"
                              }`}>
                                <div className="whitespace-pre-wrap font-sans">
                                  {isAI ? renderMarkdown(msg.content) : msg.content}
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1 block">{msg.timestamp}</span>
                            </div>
                          </div>
                        );
                      })}

                      {isGeneratingChat && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#135bf1]/8 border border-[#135bf1]/15 flex items-center justify-center text-[10px] text-[#135bf1] shrink-0">
                            AI
                          </div>
                          <div className="bg-white border border-[#E5E7EB] px-4 py-3 rounded-2xl flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[#135bf1] rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-[#135bf1] rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-[#135bf1] rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}

                      {chatError && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[12px] text-rose-700 text-left leading-relaxed">
                          {getFriendlyAIError(chatError)}
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>
                  </div>

                  <div className="border-t border-[#E5E7EB] bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-2 text-[10.5px] text-slate-600">
                      <span className="font-semibold">Tu chat es privado. Las respuestas usan Gemini y consumen API.</span>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (userChatMessage.trim()) {
                          handleQueryOlliChat(userChatMessage.trim());
                        }
                      }}
                      className="rounded-2xl border border-[#CBD5E1] bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex w-7 h-7 items-center justify-center rounded-full border border-[#E5E7EB] text-slate-500">@</span>
                        <span className="max-w-[210px] truncate rounded-full border border-[#E5E7EB] px-3 py-1.5 text-[10.5px] font-semibold text-slate-700">
                          {selectedMeeting.title}
                        </span>
                      </div>
                      <textarea
                        value={userChatMessage}
                        onChange={(e) => setUserChatMessage(e.target.value)}
                        placeholder="Ask anything about your conversations"
                        disabled={isGeneratingChat}
                        rows={2}
                        className="w-full resize-none bg-transparent text-[13px] text-[#111111] placeholder-slate-400 outline-none"
                      />
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#135bf1]"
                          title="Opciones avanzadas"
                        >
                          <Plus className="w-4 h-4" />
                          Advanced
                        </button>
                        <button
                          type="submit"
                          disabled={isGeneratingChat || !userChatMessage.trim()}
                          className="w-9 h-9 rounded-full bg-[#135bf1] hover:bg-[#0746cc] text-white flex items-center justify-center transition-colors disabled:bg-slate-200 disabled:text-slate-400"
                          title="Enviar pregunta"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

          </div>
        ) : (
          <div className="flex-grow min-h-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40 select-none">
            <div className="w-14 h-14 bg-white rounded-2xl border border-[#E9E9EB] flex items-center justify-center text-slate-400 mb-4 shadow-sm">
              <FolderOpen className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-black text-slate-800 mt-1">
              {selectedFolderFilter === "all" ? "No hay reuniones guardadas" : "No hay reuniones en esta carpeta"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
              {selectedFolderFilter === "none"
                ? "Todas las reuniones disponibles ya tienen una carpeta asignada."
                : selectedFolderFilter === "all"
                  ? "Graba una clase o sube audio para crear tu primera reunion local."
                  : "Crea o asigna reuniones a esta carpeta desde el selector de carpeta de cada reunion."}
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPdfExportModalOpen && selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Cerrar selector de PDF"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPdfExportModalOpen(false)}
              className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-[1px]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pdf-export-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="pdf-export-title" className="text-sm font-bold text-slate-900">Descargar PDF</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Elige el contenido que quieres incluir.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPdfExportModalOpen(false)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => handleExportPDF(selectedMeeting, "both")}
                  className="flex items-center justify-between rounded-lg border border-[#135bf1] bg-[#135bf1] px-4 py-3 text-left text-white transition-colors hover:bg-[#0d4ed8]"
                >
                  <span>
                    <span className="block text-sm font-bold">Resumen y transcripcion</span>
                    <span className="mt-1 block text-xs text-white/80">Documento completo de la sesion.</span>
                  </span>
                  <FileText className="h-4 w-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPDF(selectedMeeting, "transcript")}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition-colors hover:border-[#135bf1]/40 hover:bg-slate-50"
                >
                  <span>
                    <span className="block text-sm font-bold">Solo transcripcion</span>
                    <span className="mt-1 block text-xs text-slate-500">Texto segmentado por tiempo.</span>
                  </span>
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPDF(selectedMeeting, "summary")}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition-colors hover:border-[#135bf1]/40 hover:bg-slate-50"
                >
                  <span>
                    <span className="block text-sm font-bold">Solo resumen</span>
                    <span className="mt-1 block text-xs text-slate-500">Sintesis generada a partir de la sesion.</span>
                  </span>
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* EMAIL REPORT PDF DISPATCH MODAL */}
      <AnimatePresence>
        {isEmailModalOpen && selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSendingEmail) {
                  setIsEmailModalOpen(false);
                }
              }}
              className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-xs"
            />

            {/* Modal Glass Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl w-full max-w-lg p-7 relative z-10 shadow-2xl border border-slate-100 overflow-hidden text-left font-sans select-none"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-50 mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Mail className="w-5 h-5 text-[#135bf1]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 leading-none">Enviar Reporte PDF</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Comparte actas con SMTP o correo local</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={() => setIsEmailModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 flex items-center justify-center text-sm font-semibold transition-colors disabled:opacity-55 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form parameters */}
              <div className="space-y-4">
                {/* Information Badge */}
                <div className="p-3.5 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl flex items-start space-x-2.5 text-[11px] text-indigo-800 leading-relaxed">
                  <span className="text-sm shrink-0">📎</span>
                  <div>
                    <span className="font-semibold text-indigo-900">PDF listo para compartir:</span>
                    <p className="mt-0.5 text-indigo-750/90 text-[10px]">
                      Si SMTP esta configurado, Olli enviara el adjunto. Si no, descargara el PDF y abrira tu correo para adjuntarlo manualmente.
                    </p>
                  </div>
                </div>

                {/* Recipient Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-widest mb-1.5 text-left">
                    Destinatario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    disabled={isSendingEmail}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#135bf1] focus:bg-white transition-all text-slate-800 placeholder-slate-450"
                  />
                </div>

                {/* Custom Subject Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-widest mb-1.5 text-left">
                    Asunto del Correo
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={`Acta de reunion: ${selectedMeeting.title}`}
                    disabled={isSendingEmail}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#135bf1] focus:bg-white transition-all text-slate-800 placeholder-slate-450"
                  />
                </div>

                {/* Optional Message note */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-widest mb-1.5 text-left">
                    Mensaje u Observación Adicional <span className="text-slate-400">(Opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={emailNote}
                    onChange={(e) => setEmailNote(e.target.value)}
                    placeholder="Hola, te comparto el acta de la reunión de hoy junto con la transcripción completa..."
                    disabled={isSendingEmail}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#135bf1] focus:bg-white transition-all text-slate-800 placeholder-slate-450 resize-none leading-relaxed"
                  />
                </div>

                {/* Success Banner */}
                {emailSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-105 rounded-xl text-[11px] text-emerald-850 leading-relaxed">
                    <span className="font-bold text-emerald-950 flex items-center gap-1">✅ ¡Enviado con Éxito!</span>
                    <p className="mt-0.5 text-emerald-700">{emailSuccess}</p>
                  </div>
                )}

                {/* Error Banner */}
                {emailError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-800 leading-relaxed text-left flex items-start space-x-2">
                    <span className="text-sm shrink-0">⚠️</span>
                    <div>
                      <span className="font-bold">Fallo al despachar</span>
                      <p className="mt-0.5 text-rose-700">{emailError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  disabled={isSendingEmail}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-[11px] font-bold transition-all disabled:opacity-55 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !recipientEmail}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-[#135bf1] hover:opacity-95 text-white text-[11px] font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md shadow-indigo-100 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Despachando Reporte...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>Enviar / Abrir Correo</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

