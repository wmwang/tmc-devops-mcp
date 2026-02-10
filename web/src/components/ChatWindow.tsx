import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Card,
    Input,
    Button,
    Spinner,
    Text,
    Badge,
    makeStyles,
    tokens,
    shorthands,
    Tooltip,
} from '@fluentui/react-components';
import {
    Send24Regular,
    Delete24Regular,
    Folder24Regular,
    ClipboardTask24Regular,
    Pipeline24Regular,
    BranchFork24Regular,
    Search24Regular,
    Book24Regular,
    Beaker24Regular,
    ShieldCheckmark24Regular,
    CalendarLtr24Regular,
    ChevronRight20Regular,
    ChevronDown20Regular,
    PlugConnected24Regular,
} from '@fluentui/react-icons';
import { useChat } from '../hooks/useChat';
import { useTools } from '../hooks/useTools';
import { MessageBubble } from './MessageBubble';

/* ── Quick action definitions ── */
const quickActions = [
    { icon: <Folder24Regular />, label: '列出所有專案', prompt: '列出所有專案' },
    { icon: <ClipboardTask24Regular />, label: '我的工作項目', prompt: '查詢指派給我的工作項目' },
    { icon: <Pipeline24Regular />, label: '最近的建置', prompt: '列出最近的建置紀錄' },
    { icon: <BranchFork24Regular />, label: 'Pull Requests', prompt: '列出需要我審核的 Pull Requests' },
    { icon: <Search24Regular />, label: '搜尋工作項目', prompt: '搜尋工作項目：' },
    { icon: <Book24Regular />, label: '查看 Wiki', prompt: '列出 Wiki 頁面' },
];

const categoryIcons: Record<string, React.ReactNode> = {
    '🏢': <Folder24Regular style={{ fontSize: '16px' }} />,
    '📁': <BranchFork24Regular style={{ fontSize: '16px' }} />,
    '📋': <ClipboardTask24Regular style={{ fontSize: '16px' }} />,
    '🔧': <Pipeline24Regular style={{ fontSize: '16px' }} />,
    '📅': <CalendarLtr24Regular style={{ fontSize: '16px' }} />,
    '🔍': <Search24Regular style={{ fontSize: '16px' }} />,
    '📖': <Book24Regular style={{ fontSize: '16px' }} />,
    '🧪': <Beaker24Regular style={{ fontSize: '16px' }} />,
    '🔒': <ShieldCheckmark24Regular style={{ fontSize: '16px' }} />,
};

/* ── Styles ── */
const useStyles = makeStyles({
    /* top-level layout */
    layout: {
        display: 'flex',
        height: '100%',
        width: '100%',
    },

    /* ─── Left sidebar ─── */
    sidebar: {
        width: '280px',
        minWidth: '280px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: tokens.colorNeutralBackground1,
        ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
        overflowY: 'auto',
    },
    sidebarHeader: {
        ...shorthands.padding('16px'),
        ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    },
    sidebarTitle: {
        fontSize: '16px',
        fontWeight: 700,
        color: tokens.colorBrandForeground1,
    },
    statusRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '8px',
    },
    statusDot: {
        width: '7px',
        height: '7px',
        ...shorthands.borderRadius('50%'),
        display: 'inline-block',
    },
    dotConnected: {
        backgroundColor: '#4CAF50',
        boxShadow: '0 0 4px rgba(76,175,80,.6)',
    },
    dotDisconnected: {
        backgroundColor: '#f44336',
    },
    sectionLabel: {
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: tokens.colorNeutralForeground3,
        ...shorthands.padding('12px', '16px', '6px'),
    },
    quickItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        ...shorthands.padding('8px', '16px'),
        cursor: 'pointer',
        fontSize: '13px',
        color: tokens.colorNeutralForeground1,
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
    },
    categoryItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        ...shorthands.padding('7px', '16px'),
        fontSize: '13px',
        color: tokens.colorNeutralForeground2,
        cursor: 'pointer',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
    },
    categoryName: {
        flexGrow: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    toolSubItem: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.padding('4px', '16px', '4px', '44px'),
        fontSize: '12px',
        color: tokens.colorNeutralForeground3,
    },
    toolName: {
        fontWeight: 500,
        color: tokens.colorNeutralForeground2,
        fontSize: '12px',
    },
    toolDesc: {
        fontSize: '11px',
        color: tokens.colorNeutralForeground3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    /* ─── Right chat panel ─── */
    chatPanel: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: tokens.colorNeutralBackground2,
    },
    chatHeader: {
        ...shorthands.padding('10px', '20px'),
        backgroundColor: tokens.colorNeutralBackground1,
        ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    chatHeaderTitle: {
        fontSize: '14px',
        fontWeight: 600,
    },
    messagesContainer: {
        flexGrow: 1,
        flexShrink: 1,
        minHeight: 0,
        overflowY: 'auto',
        ...shorthands.padding('20px'),
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    emptyChat: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: tokens.colorNeutralForeground3,
        textAlign: 'center',
        ...shorthands.padding('40px'),
    },
    inputContainer: {
        ...shorthands.padding('12px', '20px'),
        backgroundColor: tokens.colorNeutralBackground1,
        ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    },
    inputWrapper: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
    },
    input: {
        flexGrow: 1,
    },
});

/* ── Component ── */
export function ChatWindow() {
    const styles = useStyles();
    const { messages, isLoading, error, sendMessage, clearMessages } = useChat();
    const { toolsData, isLoading: toolsLoading } = useTools();
    const [inputValue, setInputValue] = useState('');
    const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        const msg = inputValue;
        setInputValue('');
        await sendMessage(msg);
    };

    const handleQuickAction = useCallback((prompt: string) => {
        if (prompt.endsWith('：')) {
            setInputValue(prompt);
            return;
        }
        sendMessage(prompt);
    }, [sendMessage]);

    return (
        <div className={styles.layout}>
            {/* ════════ Left Sidebar ════════ */}
            <div className={styles.sidebar}>
                {/* Logo + Status */}
                <div className={styles.sidebarHeader}>
                    <Text className={styles.sidebarTitle}>TMC DevOps AI</Text>
                    <div className={styles.statusRow}>
                        <PlugConnected24Regular style={{ fontSize: '14px', color: tokens.colorNeutralForeground3 }} />
                        {toolsLoading ? (
                            <Spinner size="extra-tiny" />
                        ) : (
                            <>
                                <span
                                    className={`${styles.statusDot} ${toolsData?.connected ? styles.dotConnected : styles.dotDisconnected
                                        }`}
                                />
                                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                                    {toolsData?.connected
                                        ? `MCP 已連線 · ${toolsData.totalTools} 個工具`
                                        : 'MCP 未連線'}
                                </Text>
                            </>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <Text className={styles.sectionLabel}>⚡ 快速指令</Text>
                {quickActions.map((a, i) => (
                    <div key={i} className={styles.quickItem} onClick={() => handleQuickAction(a.prompt)}>
                        {a.icon}
                        <span>{a.label}</span>
                    </div>
                ))}

                {/* Tool Categories */}
                {toolsData?.categories && toolsData.categories.length > 0 && (
                    <>
                        <Text className={styles.sectionLabel}>🛠️ 功能模組</Text>
                        {toolsData.categories.map((cat, i) => {
                            const emoji = cat.name.slice(0, 2).trim();
                            const icon = categoryIcons[emoji] || <Folder24Regular style={{ fontSize: '16px' }} />;
                            const label = cat.name.slice(2).trim() || cat.name;
                            const isExpanded = expandedCats.has(i);
                            return (
                                <div key={i}>
                                    <div
                                        className={styles.categoryItem}
                                        onClick={() => {
                                            setExpandedCats((prev) => {
                                                const next = new Set(prev);
                                                if (next.has(i)) next.delete(i);
                                                else next.add(i);
                                                return next;
                                            });
                                        }}
                                    >
                                        {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                                        {icon}
                                        <span className={styles.categoryName}>{label}</span>
                                        <Badge appearance="tint" color="informative" size="small">
                                            {cat.tools.length}
                                        </Badge>
                                    </div>
                                    {isExpanded && cat.tools.map((tool, j) => (
                                        <div key={j} className={styles.toolSubItem}>
                                            <span className={styles.toolName}>{tool.name}</span>
                                            {tool.description && (
                                                <span className={styles.toolDesc}>{tool.description}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* ════════ Right Chat Panel ════════ */}
            <div className={styles.chatPanel}>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                    <Text className={styles.chatHeaderTitle}>💬 對話</Text>
                    {messages.length > 0 && (
                        <Tooltip content="清除對話" relationship="label">
                            <Button
                                appearance="subtle"
                                icon={<Delete24Regular />}
                                onClick={clearMessages}
                                size="small"
                            />
                        </Tooltip>
                    )}
                </div>

                {/* Messages */}
                <div className={styles.messagesContainer}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyChat}>
                            <Text size={400} weight="semibold">
                                👋 歡迎使用 TMC DevOps AI 助手
                            </Text>
                            <Text size={200} style={{ marginTop: '8px' }}>
                                從左側選擇快速指令，或直接在下方輸入問題
                            </Text>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))
                    )}
                    {isLoading && (
                        <Card style={{ padding: '12px', width: 'fit-content' }}>
                            <Spinner size="tiny" label="AI 正在思考中..." />
                        </Card>
                    )}
                    {error && (
                        <Card style={{ padding: '12px', backgroundColor: tokens.colorPaletteRedBackground2 }}>
                            <Text style={{ color: tokens.colorPaletteRedForeground1 }}>錯誤: {error}</Text>
                        </Card>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className={styles.inputContainer}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.inputWrapper}>
                            <Input
                                className={styles.input}
                                placeholder="輸入您的問題..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={isLoading}
                                size="large"
                            />
                            <Button
                                appearance="primary"
                                icon={<Send24Regular />}
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                            >
                                傳送
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
