import {
    Card,
    Text,
    Badge,
    Spinner,
    makeStyles,
    tokens,
    shorthands,
} from '@fluentui/react-components';
import {
    Folder24Regular,
    ClipboardTask24Regular,
    Pipeline24Regular,
    BranchFork24Regular,
    Search24Regular,
    Book24Regular,
    Beaker24Regular,
    ShieldCheckmark24Regular,
    CalendarLtr24Regular,
    PlugConnected24Regular,
} from '@fluentui/react-icons';
import { useTools } from '../hooks/useTools';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        overflowY: 'auto',
        ...shorthands.padding('32px', '24px'),
    },
    hero: {
        textAlign: 'center',
        marginBottom: '32px',
        maxWidth: '600px',
    },
    title: {
        fontSize: '28px',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #1267B4 0%, #5C2D91 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '8px',
    },
    subtitle: {
        color: tokens.colorNeutralForeground3,
        marginTop: '8px',
        fontSize: '14px',
    },
    statusBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '16px',
        ...shorthands.padding('8px', '16px'),
        ...shorthands.borderRadius('20px'),
        backgroundColor: tokens.colorNeutralBackground3,
    },
    statusDot: {
        width: '8px',
        height: '8px',
        ...shorthands.borderRadius('50%'),
        display: 'inline-block',
    },
    statusDotConnected: {
        backgroundColor: '#4CAF50',
        boxShadow: '0 0 6px rgba(76, 175, 80, 0.6)',
    },
    statusDotDisconnected: {
        backgroundColor: '#f44336',
        boxShadow: '0 0 6px rgba(244, 67, 54, 0.6)',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: '16px',
        color: tokens.colorNeutralForeground1,
        textAlign: 'center',
    },
    quickActions: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '12px',
        width: '100%',
        maxWidth: '900px',
        marginBottom: '32px',
    },
    actionCard: {
        cursor: 'pointer',
        ...shorthands.padding('16px'),
        ...shorthands.borderRadius('12px'),
        backgroundColor: tokens.colorNeutralBackground3,
        ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
        transitionProperty: 'all',
        transitionDuration: '0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground3Hover,
            ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
            transform: 'translateY(-2px)',
            boxShadow: tokens.shadow8,
        },
    },
    actionIcon: {
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...shorthands.borderRadius('10px'),
        backgroundColor: tokens.colorBrandBackground2,
        flexShrink: 0,
    },
    actionContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        minWidth: 0,
    },
    actionTitle: {
        fontWeight: 600,
        fontSize: '13px',
        color: tokens.colorNeutralForeground1,
    },
    actionDesc: {
        fontSize: '12px',
        color: tokens.colorNeutralForeground3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    toolsSection: {
        width: '100%',
        maxWidth: '900px',
    },
    categoryRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        ...shorthands.padding('8px', '12px'),
        ...shorthands.borderRadius('8px'),
        backgroundColor: tokens.colorNeutralBackground3,
        marginBottom: '6px',
    },
    categoryName: {
        fontSize: '13px',
        fontWeight: 600,
        color: tokens.colorNeutralForeground1,
        flexGrow: 1,
    },
});

interface QuickAction {
    icon: React.ReactNode;
    title: string;
    description: string;
    prompt: string;
}

const quickActions: QuickAction[] = [
    {
        icon: <Folder24Regular style={{ color: '#4FC3F7' }} />,
        title: '列出所有專案',
        description: '查看 Azure DevOps 組織中的專案清單',
        prompt: '列出所有專案',
    },
    {
        icon: <ClipboardTask24Regular style={{ color: '#66BB6A' }} />,
        title: '我的工作項目',
        description: '查看指派給我的待辦事項',
        prompt: '查詢指派給我的工作項目',
    },
    {
        icon: <Pipeline24Regular style={{ color: '#FFA726' }} />,
        title: '最近的建置',
        description: '查看最近的 Pipeline 建置紀錄',
        prompt: '列出最近的建置紀錄',
    },
    {
        icon: <BranchFork24Regular style={{ color: '#AB47BC' }} />,
        title: 'Pull Requests',
        description: '查看我需要審核的 PR',
        prompt: '列出需要我審核的 Pull Requests',
    },
    {
        icon: <Search24Regular style={{ color: '#EF5350' }} />,
        title: '搜尋工作項目',
        description: '透過關鍵字搜尋工作項目',
        prompt: '搜尋工作項目：',
    },
    {
        icon: <Book24Regular style={{ color: '#26A69A' }} />,
        title: '查看 Wiki',
        description: '瀏覽專案的 Wiki 文件',
        prompt: '列出 Wiki 頁面',
    },
];

const categoryIcons: Record<string, React.ReactNode> = {
    '🏢': <Folder24Regular style={{ color: '#4FC3F7' }} />,
    '📁': <BranchFork24Regular style={{ color: '#AB47BC' }} />,
    '📋': <ClipboardTask24Regular style={{ color: '#66BB6A' }} />,
    '🔧': <Pipeline24Regular style={{ color: '#FFA726' }} />,
    '📅': <CalendarLtr24Regular style={{ color: '#29B6F6' }} />,
    '🔍': <Search24Regular style={{ color: '#EF5350' }} />,
    '📖': <Book24Regular style={{ color: '#26A69A' }} />,
    '🧪': <Beaker24Regular style={{ color: '#FF7043' }} />,
    '🔒': <ShieldCheckmark24Regular style={{ color: '#78909C' }} />,
};

interface WelcomeScreenProps {
    onSendMessage: (message: string) => void;
}

export function WelcomeScreen({ onSendMessage }: WelcomeScreenProps) {
    const styles = useStyles();
    const { toolsData, isLoading } = useTools();

    const handleQuickAction = (action: QuickAction) => {
        // 如果 prompt 以冒號結尾，表示需要使用者補充（例如搜尋）
        if (action.prompt.endsWith('：')) {
            // 這裡可以用 prompt 做為輸入框的預填
            onSendMessage(action.prompt);
        } else {
            onSendMessage(action.prompt);
        }
    };

    return (
        <div className={styles.container}>
            {/* Hero 標題 */}
            <div className={styles.hero}>
                <div className={styles.title}>TMC DevOps AI 助手</div>
                <Text className={styles.subtitle}>
                    智慧化管理您的 Azure DevOps — 專案、工作項目、Pipeline、程式碼一手掌握
                </Text>

                {/* MCP 連線狀態 */}
                <div className={styles.statusBar}>
                    <PlugConnected24Regular style={{ color: tokens.colorNeutralForeground3, fontSize: '16px' }} />
                    {isLoading ? (
                        <Spinner size="tiny" label="正在連線 MCP Server..." />
                    ) : (
                        <>
                            <span
                                className={`${styles.statusDot} ${toolsData?.connected
                                    ? styles.statusDotConnected
                                    : styles.statusDotDisconnected
                                    }`}
                            />
                            <Text size={200}>
                                {toolsData?.connected
                                    ? `MCP 已連線 · ${toolsData.totalTools} 個工具可用`
                                    : 'MCP 未連線'}
                            </Text>
                        </>
                    )}
                </div>
            </div>

            {/* 快速指令 */}
            <Text className={styles.sectionTitle}>⚡ 快速開始</Text>
            <div className={styles.quickActions}>
                {quickActions.map((action, index) => (
                    <Card
                        key={index}
                        className={styles.actionCard}
                        onClick={() => handleQuickAction(action)}
                    >
                        <div className={styles.actionIcon}>{action.icon}</div>
                        <div className={styles.actionContent}>
                            <Text className={styles.actionTitle}>{action.title}</Text>
                            <Text className={styles.actionDesc}>{action.description}</Text>
                        </div>
                    </Card>
                ))}
            </div>

            {/* 可用工具分類 */}
            {toolsData?.categories && toolsData.categories.length > 0 && (
                <div className={styles.toolsSection}>
                    <Text className={styles.sectionTitle}>🛠️ 可用功能模組</Text>
                    {toolsData.categories.map((category, index) => {
                        // 取出 emoji 前綴作為 icon key
                        const emoji = category.name.slice(0, 2).trim();
                        const icon = categoryIcons[emoji] || <Folder24Regular />;
                        const label = category.name.slice(2).trim() || category.name;

                        return (
                            <div key={index} className={styles.categoryRow}>
                                {icon}
                                <Text className={styles.categoryName}>{label}</Text>
                                <Badge appearance="filled" color="informative" size="small">
                                    {category.tools.length} 個工具
                                </Badge>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
