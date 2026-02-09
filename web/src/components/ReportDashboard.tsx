import React from 'react';
import {
    Card,
    Text,
    makeStyles,
    tokens,
    shorthands,
} from '@fluentui/react-components';
import {
    Folder24Regular,
    Pipeline24Regular,
    PeopleTeam24Regular,
    Bug24Regular,
} from '@fluentui/react-icons';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const useStyles = makeStyles({
    container: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        ...shorthands.padding('16px'),
    },
    statCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        ...shorthands.padding('20px'),
    },
    statIcon: {
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...shorthands.borderRadius('12px'),
        backgroundColor: tokens.colorBrandBackground2,
    },
    statContent: {
        display: 'flex',
        flexDirection: 'column',
    },
    statValue: {
        fontSize: '24px',
        fontWeight: 600,
        color: tokens.colorNeutralForeground1,
    },
    chartCard: {
        ...shorthands.padding('20px'),
        minHeight: '300px',
    },
});

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
}

function StatCard({ icon, label, value }: StatCardProps) {
    const styles = useStyles();

    return (
        <Card className={styles.statCard}>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statContent}>
                <Text className={styles.statValue}>{value}</Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    {label}
                </Text>
            </div>
        </Card>
    );
};

// Sample data - these would be populated from actual API calls
const pipelineData = [
    { name: 'Mon', succeeded: 12, failed: 2 },
    { name: 'Tue', succeeded: 15, failed: 1 },
    { name: 'Wed', succeeded: 10, failed: 3 },
    { name: 'Thu', succeeded: 18, failed: 0 },
    { name: 'Fri', succeeded: 14, failed: 2 },
];

const workItemData = [
    { name: 'New', value: 15, color: '#0078D4' },
    { name: 'Active', value: 25, color: '#107C10' },
    { name: 'Resolved', value: 10, color: '#FFB900' },
    { name: 'Closed', value: 50, color: '#505050' },
];

export function ReportDashboard() {
    const styles = useStyles();

    return (
        <div>
            {/* Stats */}
            <div className={styles.container}>
                <StatCard
                    icon={<Folder24Regular style={{ color: tokens.colorBrandForeground1 }} />}
                    label="專案數量"
                    value={2}
                />
                <StatCard
                    icon={<Pipeline24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />}
                    label="Pipeline 數量"
                    value={8}
                />
                <StatCard
                    icon={<PeopleTeam24Regular style={{ color: tokens.colorPaletteBlueForeground2 }} />}
                    label="團隊成員"
                    value={12}
                />
                <StatCard
                    icon={<Bug24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />}
                    label="待處理 Bug"
                    value={5}
                />
            </div>

            {/* Charts */}
            <div className={styles.container}>
                <Card className={styles.chartCard}>
                    <Text weight="semibold" size={400} style={{ marginBottom: '16px' }}>
                        本週 Pipeline 執行狀態
                    </Text>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={pipelineData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="succeeded" fill="#107C10" name="成功" />
                            <Bar dataKey="failed" fill="#D13438" name="失敗" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Card className={styles.chartCard}>
                    <Text weight="semibold" size={400} style={{ marginBottom: '16px' }}>
                        工作項目狀態分佈
                    </Text>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={workItemData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            >
                                {workItemData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};
